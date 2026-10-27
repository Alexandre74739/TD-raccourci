"""Connexion à PostgreSQL : un pool de connexions réutilisées d'une requête à l'autre."""
import os
import threading

import psycopg
from flask import g
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# Autocommit : chaque écriture groupée passe explicitement par db.transaction().
OPTIONS = {"autocommit": True, "row_factory": dict_row}
_pool = None
_pool_lock = threading.Lock()


def database_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("La variable d'environnement DATABASE_URL est manquante.")
    return url


def connect():
    """Connexion isolée, pour les scripts (migrations, import)."""
    return psycopg.connect(database_url(), **OPTIONS)


def get_pool():
    # Créé à la première requête : importer app.py depuis un script n'ouvre aucune connexion.
    global _pool
    with _pool_lock:
        if _pool is None:
            _pool = ConnectionPool(database_url(), kwargs=OPTIONS, open=True)
    return _pool


def get_db():
    if "db" not in g:
        g.db = get_pool().getconn()
    return g.db


def close_db(error=None):
    db = g.pop("db", None)
    if db is not None:
        get_pool().putconn(db)
