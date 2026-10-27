"""Connexion à PostgreSQL : une connexion par requête, fermée à la fin."""
import os

import psycopg
from flask import g
from psycopg.rows import dict_row


def connect():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("La variable d'environnement DATABASE_URL est manquante.")
    # Autocommit : chaque écriture groupée passe explicitement par db.transaction().
    return psycopg.connect(url, autocommit=True, row_factory=dict_row)


def get_db():
    if "db" not in g:
        g.db = connect()
    return g.db


def close_db(error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()
