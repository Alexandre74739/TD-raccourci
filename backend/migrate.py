"""Applique les migrations SQL de backend/migrations, dans l'ordre de leur numéro.

Lancer depuis la racine du dépôt : python backend/migrate.py
La table schema_migrations garde la liste des migrations déjà appliquées :
chacune ne passe qu'une fois. Ne modifiez jamais une migration appliquée,
ajoutez-en une nouvelle (002_..., 003_...).
Une migration est reconnue par sa description, sans le numéro : on peut la
renuméroter, mais pas changer sa description.
"""
import re
import sys
from pathlib import Path

from db import connect

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"
NAME_PATTERN = re.compile(r"^(\d{3})_([a-z0-9_]+)\.sql$")
# Verrou PostgreSQL : deux API qui démarrent ensemble n'appliquent pas deux fois la même migration.
LOCK_ID = 120_001


def description(name):
    """Identifiant d'une migration : son nom sans le numéro, qui peut changer."""
    return name.split("_", 1)[1]


def migration_files():
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    numbers = {}
    descriptions = {}
    for path in files:
        match = NAME_PATTERN.fullmatch(path.name)
        if match is None:
            raise SystemExit(f"✗ {path.name} : nom attendu 001_description.sql (minuscules, chiffres, _).")
        # Deux branches qui ajoutent chacune une migration 002 : l'une doit être renumérotée.
        if match[1] in numbers:
            raise SystemExit(f"✗ {path.name} et {numbers[match[1]]} portent le même numéro.")
        if match[2] in descriptions:
            raise SystemExit(f"✗ {path.name} et {descriptions[match[2]]} portent la même description.")
        numbers[match[1]] = path.name
        descriptions[match[2]] = path.name
    return files


def main():
    files = migration_files()
    applied_now = 0
    with connect() as db:
        db.execute("SELECT pg_advisory_lock(%s)", (LOCK_ID,))
        db.execute(
            """CREATE TABLE IF NOT EXISTS schema_migrations (
                 version VARCHAR(255) PRIMARY KEY,
                 applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
               )"""
        )
        applied = {description(row["version"]) for row in db.execute("SELECT version FROM schema_migrations")}
        for path in files:
            if description(path.name) in applied:
                continue
            # Une migration qui échoue est annulée en entier et bloque les suivantes.
            with db.transaction():
                db.execute(path.read_text(encoding="utf-8"))
                db.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.name,))
            print(f"✓ {path.name}")
            applied_now += 1
    print(f"{applied_now} migration(s) appliquée(s), {len(files) - applied_now} déjà à jour.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
