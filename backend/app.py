"""API du carnet : PostgreSQL est la seule source de données."""
import re
import unicodedata

import psycopg
from flask import Flask, jsonify, request
from psycopg.errors import UniqueViolation
from werkzeug.exceptions import HTTPException

from db import close_db, get_db
from keys import InvalidKeys, normalize_keys

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 256 * 1024
app.teardown_appcontext(close_db)
LIMITS = {"title": 120, "description": 300, "keys": 120}
CATEGORY_LIMIT = 60
SLUG_LIMIT = 140
LIST_QUERY = """
    SELECT f.slug, f.title, f.description, f.keys, c.label AS category, c.slug AS category_slug
    FROM fiches f JOIN categories c ON c.id = f.category_id
"""
DETAIL_QUERY = """
    SELECT f.slug, f.title, f.description, f.keys, c.label AS category, c.slug AS category_slug,
           f.content
    FROM fiches f JOIN categories c ON c.id = f.category_id
    WHERE f.slug = %s
"""


class InvalidShortcut(ValueError):
    """Une fiche reçue ne respecte pas le contrat attendu."""


def clean_text(data, field, maximum):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise InvalidShortcut(f"Le champ {field} est obligatoire et doit être un texte.")
    if len(value.strip()) > maximum:
        raise InvalidShortcut(f"Le champ {field} dépasse {maximum} caractères.")
    return value.strip()


def validate_metadata(data):
    if not isinstance(data, dict):
        raise InvalidShortcut("Les métadonnées doivent être un objet.")
    metadata = {field: clean_text(data, field, maximum) for field, maximum in LIMITS.items()}
    try:
        metadata["keys"] = normalize_keys(metadata["keys"])
    except InvalidKeys as error:
        raise InvalidShortcut(f"Le champ keys est invalide : {error}") from error
    return metadata


def slugify(text):
    text_ascii = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text_ascii.lower()).strip("-")


def category_id(db, data):
    """Catégorie existante (category_slug) ou nouvelle (new_category, ou category).

    Une nouvelle catégorie au même slug qu'une existante (« VS Code » = « vs code »)
    réutilise celle-ci au lieu de créer un doublon.
    """
    existing = data.get("category_slug")
    if existing is not None:
        row = None
        if isinstance(existing, str):
            row = db.execute("SELECT id FROM categories WHERE slug = %s", (existing,)).fetchone()
        if row is None:
            raise InvalidShortcut("Catégorie inconnue : choisissez-en une dans la liste.")
        return row["id"]
    field = "new_category" if "new_category" in data else "category"
    label = clean_text(data, field, CATEGORY_LIMIT)
    slug = slugify(label)[:CATEGORY_LIMIT].strip("-")
    if not slug:
        raise InvalidShortcut("La catégorie doit contenir au moins une lettre latine ou un chiffre.")
    row = db.execute(
        """INSERT INTO categories (slug, label) VALUES (%s, %s)
           ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id""",
        (slug, label),
    ).fetchone()
    return row["id"]


@app.errorhandler(InvalidShortcut)
def invalid_shortcut(error):
    return jsonify(error=str(error)), 422


@app.errorhandler(HTTPException)
def http_error(error):
    return jsonify(error=error.description), error.code


@app.errorhandler(psycopg.Error)
def database_error(error):
    app.logger.error("Erreur de base de données : %s", type(error).__name__)
    return jsonify(error="Impossible de lire ou écrire dans la base de données."), 500


@app.get("/api/shortcuts")
def list_shortcuts():
    shortcuts = get_db().execute(LIST_QUERY).fetchall()
    shortcuts.sort(key=lambda shortcut: shortcut["title"].casefold())
    return jsonify(shortcuts)


@app.get("/api/shortcuts/<slug>")
def get_shortcut(slug):
    shortcut = get_db().execute(DETAIL_QUERY, (slug,)).fetchone()
    if shortcut is None:
        return jsonify(error="Raccourci introuvable."), 404
    return jsonify(shortcut)


@app.get("/api/categories")
def list_categories():
    categories = get_db().execute("SELECT slug, label FROM categories").fetchall()
    categories.sort(key=lambda category: category["label"].casefold())
    return jsonify(categories)


@app.post("/api/shortcuts")
def create_shortcut():
    data = request.get_json()
    metadata = validate_metadata(data)
    content = data.get("content")
    if not isinstance(content, str) or not content.strip():
        raise InvalidShortcut("Le contenu Markdown est obligatoire.")
    slug = slugify(metadata["title"])[:SLUG_LIMIT].strip("-")
    if not slug:
        raise InvalidShortcut("Le titre doit contenir au moins une lettre latine ou un chiffre.")
    db = get_db()
    # La catégorie créée est annulée avec la fiche si celle-ci est refusée.
    try:
        with db.transaction():
            db.execute(
                """INSERT INTO fiches (slug, title, description, keys, category_id, content)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (slug, metadata["title"], metadata["description"], metadata["keys"],
                 category_id(db, data), content.strip()),
            )
    except UniqueViolation as error:
        # Seul le slug de la fiche signale un doublon de titre : les autres conflits restent des erreurs 500.
        if error.diag.constraint_name != "fiches_slug_key":
            raise
        return jsonify(error="Une fiche porte déjà ce titre. Choisissez un autre titre."), 409
    return jsonify(db.execute(DETAIL_QUERY, (slug,)).fetchone()), 201
