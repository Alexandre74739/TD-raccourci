"""Importe les fiches content/*.md dans PostgreSQL.

Lancer depuis la racine du dépôt : python backend/import_markdown.py
Le script peut être relancé : une fiche déjà présente (même slug) est ignorée.
"""
import re
import sys
from pathlib import Path

import frontmatter
import psycopg
from yaml import YAMLError

from app import SLUG_LIMIT, InvalidShortcut, category_id, validate_metadata
from db import connect

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def import_file(db, path):
    """Renvoie True si la fiche a été ajoutée, False si elle existait déjà."""
    post = frontmatter.loads(path.read_text(encoding="utf-8"))
    metadata = validate_metadata(post.metadata)
    content = post.content.strip()
    if not content:
        raise InvalidShortcut("Le contenu Markdown est obligatoire.")
    with db.transaction():
        row = db.execute(
            """INSERT INTO fiches (slug, title, description, keys, category_id, content)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (slug) DO NOTHING RETURNING id""",
            (path.stem, metadata["title"], metadata["description"], metadata["keys"],
             category_id(db, post.metadata), content),
        ).fetchone()
    return row is not None


def main():
    imported, skipped, errors = 0, 0, 0
    with connect() as db:
        for path in sorted(CONTENT_DIR.glob("*.md")):
            # Le nom du fichier devient le slug : les liens existants restent valides.
            if len(path.stem) > SLUG_LIMIT or not SLUG_PATTERN.fullmatch(path.stem):
                print(f"✗ {path.name} : nom de fichier non autorisé.")
                errors += 1
                continue
            try:
                added = import_file(db, path)
            # Une fiche refusée par la base est annulée seule : l'import continue.
            except (InvalidShortcut, UnicodeError, YAMLError, ValueError, TypeError, psycopg.Error) as error:
                print(f"✗ {path.name} : {error}")
                errors += 1
                continue
            print(f"{'✓' if added else '='} {path.name}")
            imported += added
            skipped += not added
    print(f"{imported} importée(s), {skipped} déjà présente(s), {errors} erreur(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
