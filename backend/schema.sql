-- Exécuté par l'image postgres au premier démarrage, quand le volume est vide.

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label VARCHAR(60) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fiches (
  id SERIAL PRIMARY KEY,
  -- Fixé à la création : modifier le titre ne casse pas les liens partagés.
  slug VARCHAR(140) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title VARCHAR(120) NOT NULL,
  description VARCHAR(300) NOT NULL,
  -- Format normalisé, par exemple « Ctrl+Shift+P » (voir backend/keys.py).
  keys VARCHAR(120) NOT NULL,
  keys_macos VARCHAR(120),
  keys_linux VARCHAR(120),
  keys_windows VARCHAR(120),
  category_id INTEGER NOT NULL REFERENCES categories (id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
