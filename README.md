# Le carnet des raccourcis

Template pédagogique : un site Vite en JavaScript et une API Flask. Les élèves documentent leurs raccourcis clavier, enregistrés dans une base **PostgreSQL**.

## Démarrer

Prérequis : Node.js **22.12+** (ou 24/26 LTS), npm, Python **3.10+** et Docker (pour PostgreSQL).

```bash
git clone <URL-DU-DEPOT>
cd raccourcis-template
```

Démarrez PostgreSQL, à la racine du dépôt :

```bash
docker compose up -d db
```

Dans un premier terminal, à la racine du dépôt :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export DATABASE_URL=postgresql://raccourcis:raccourcis@127.0.0.1:5432/raccourcis
python backend/migrate.py           # à relancer après chaque git pull : met la base à jour
python backend/import_markdown.py   # une seule fois : importe les fiches d’exemple
flask --app backend/app run --host 0.0.0.0 --port 5000 --debug
```

Dans un second terminal :

```bash
cd frontend
npm ci
npm run dev
```

Ouvrez **http://localhost:5173**. Vite transmet les requêtes `/api` à Flask : aucune configuration CORS supplémentaire n’est nécessaire. Le serveur Flask en mode debug est réservé au développement local.

## Les trois pages

- `#/` : sommaire et recherche par titre, description, touches ou catégorie.
- `#/nouveau` : formulaire de création. L’API enregistre la fiche en base, puis la fiche s’ouvre.
- `#/raccourci/<slug>` : métadonnées et contenu Markdown rendu avec **Marked**, puis nettoyé avec **DOMPurify**.

## Organisation

```text
backend/
  app.py                 # Routes API et validation
  db.py                  # Connexion à PostgreSQL (DATABASE_URL)
  keys.py                # Format normalisé des touches
  migrate.py             # Applique les migrations manquantes
  migrations/*.sql       # Évolutions du schéma, numérotées : 001_…, 002_…
  import_markdown.py     # Import des fiches content/*.md en base
  test_keys.py           # Tests du format des touches
  requirements.txt       # Dépendances Python
content/
  *.md                   # Fiches d’exemple, à importer avec import_markdown.py
frontend/
  index.html             # Structure commune
  vite.config.js         # Proxy vers Flask
  src/
    main.js              # Navigation, sommaire et affichage d’une fiche
    new-shortcut.js       # Formulaire
    api.js               # Appels HTTP et échappement du texte
    style.css            # Styles adaptatifs
```

PostgreSQL est la seule source de données : l’API ne lit plus les fichiers de `content/`. Deux tables :

- `categories` : `slug` (identifiant dans l’URL, ex. `vs-code`) et `label` (texte affiché, ex. `VS Code`) ;
- `fiches` : titre, description, touches, catégorie et contenu Markdown. Les colonnes `keys_macos`, `keys_linux` et `keys_windows` sont prévues pour les alternatives par système.

Pour repartir d’une base vide : `docker compose down -v`, qui supprime aussi le volume des données.

## Faire évoluer la base : les migrations

Le schéma n’est jamais modifié à la main : chaque changement est un fichier SQL numéroté dans `backend/migrations/`. `backend/migrate.py` applique dans l’ordre ceux qui manquent et les note dans la table `schema_migrations`. Avec Docker, il s’exécute automatiquement à chaque démarrage de l’API : après un `git pull`, `docker compose up -d --build` suffit pour que la base de chacun suive le code, sans perdre de fiche.

Pour ajouter une colonne, par exemple :

```sql
-- backend/migrations/002_add_fiche_author.sql
ALTER TABLE fiches ADD COLUMN author VARCHAR(80);
```

Règles pour travailler à plusieurs :

- **ne modifiez jamais une migration déjà fusionnée** : elle a déjà été appliquée chez les autres et ne repasserait pas. Ajoutez une nouvelle migration ;
- nom au format `001_description.sql` : trois chiffres, puis minuscules, chiffres et `_` ;
- si deux branches ajoutent chacune une migration avec le même numéro, l’API refuse de démarrer : renumérotez celle de la branche fusionnée en second ;
- une migration qui échoue est annulée en entier, et les suivantes ne sont pas appliquées.

## Format des touches

Les touches sont enregistrées dans un format normalisé, pour pouvoir les comparer à ce que tape l’utilisateur : `Ctrl+Shift+P`.

- touches séparées par `+`, sans espaces ;
- modificateurs dans l’ordre `Ctrl`, `Alt`, `Shift`, `Meta` (`Cmd` sur macOS, touche Windows sur PC) ;
- une seule touche principale, nommée comme `KeyboardEvent.key` : `Enter`, `Escape`, `ArrowUp`, `F5`… La touche `+` s’écrit `Plus`.

L’API accepte aussi les noms français et les espaces, puis convertit : `Ctrl + Maj + P` devient `Ctrl+Shift+P`. Une combinaison incompréhensible est refusée avec une erreur `422`. Tests : `python -m unittest discover backend`.

## Écrire une fiche à la main

Créez `content/mon-raccourci.md`, puis importez-le avec `python backend/import_markdown.py`. Le nom du fichier devient son identifiant dans l’URL : lettres minuscules ASCII, chiffres et tirets uniquement, sans espace ni accent.

```markdown
---
title: "Enregistrer le fichier"
description: "Sauvegarder le document en cours dans l’éditeur."
keys: "Ctrl + S"
category: "Éditeur"
---
## Utilisation

Appuyez sur **Ctrl + S** sous Windows/Linux, ou **Cmd + S** sous macOS.

### Illustration

![Le bouton Enregistrer](https://exemple.org/capture.png)

[Lire la documentation](https://exemple.org/documentation)
```

Les quatre métadonnées sont obligatoires, sous forme de textes non vides. Limites : `title` 120 caractères, `description` 300, `keys` 120, `category` 60. Les touches suivent le [format des touches](#format-des-touches) ; la catégorie est créée si elle n’existe pas encore. Mettez les valeurs entre guillemets pour éviter les ambiguïtés YAML, notamment avec `:`. Le corps après le second `---` contient du Markdown : listes, titres, liens, images, tableaux et blocs de code.

Remplacez les URL d’exemple par des URL réelles. Pour une image, utilisez une URL HTTPS pointant directement vers l’image ; son hébergeur doit autoriser son affichage externe. Le navigateur charge l’image : l’API ne la télécharge pas.

Le script affiche une ligne par fichier : `✓` importé, `=` déjà présent (même identifiant), `✗` invalide avec le message à corriger. Il peut être relancé sans créer de doublon : une fiche déjà en base n’est pas modifiée.

## Créer une fiche depuis le site

Le formulaire sépare les métadonnées du corps Markdown. Flask génère un identifiant à partir du titre et enregistre la fiche en base.

Par exemple, « Sélectionner tout » donne l’identifiant `selectionner-tout`. S’il existe déjà, l’API répond `409` et demande un autre titre. Elle ne modifie ni ne supprime de fiche existante. Les requêtes sont limitées à 256 Kio.

## Contrat API

| Méthode | Route | Réponse |
| --- | --- | --- |
| GET | `/api/shortcuts` | Liste des métadonnées et des identifiants `slug` |
| GET | `/api/shortcuts/<slug>` | Métadonnées, `slug` et corps `content` |
| POST | `/api/shortcuts` | Crée une fiche ; répond `201` avec la fiche complète |
| GET | `/api/categories` | Liste des catégories : `slug` et `label` |

Chaque fiche renvoie sa catégorie sous deux formes : `category` (texte affiché) et `category_slug` (identifiant).

Corps JSON d’une création :

```json
{
  "title": "Sélectionner tout",
  "description": "Sélectionner le contenu du document actif.",
  "keys": "Ctrl + A",
  "category_slug": "editeur",
  "content": "## Utilisation\n\nSur macOS, utilisez **Cmd + A**."
}
```

La catégorie s’indique d’une de ces façons :

- `category_slug` : une catégorie existante, sinon erreur `422` ;
- `new_category` : le texte d’une nouvelle catégorie. Si une catégorie au même identifiant existe déjà (« vs code » et « VS Code »), elle est réutilisée ;
- `category` : même comportement que `new_category`, accepté pour le formulaire actuel.

Les touches sont renvoyées au [format normalisé](#format-des-touches) : `"Ctrl + A"` est enregistré `"Ctrl+A"`.

Les erreurs retournent `{ "error": "message" }` : notamment `400` pour un JSON incorrect, `404` pour une fiche absente, `409` pour un doublon, `413` pour un corps trop volumineux, `415` pour un contenu non JSON et `422` pour des champs invalides.

## Travail avec Git

Chaque élève peut créer sa branche, ajouter une fiche, puis proposer son travail :

```bash
git switch -c fiche/selectionner-tout
# Écrire content/selectionner-tout.md dans un éditeur.
git status
git add content/selectionner-tout.md
git commit -m "Ajoute le raccourci sélectionner tout"
git push -u origin fiche/selectionner-tout
```

Ouvrez ensuite une merge request ou une pull request sur la plateforme choisie. En équipe, deux fiches distinctes donnent des changements indépendants ; modifier la même fiche permet de travailler la résolution de conflits.

Les fiches créées depuis le site sont enregistrées dans la base locale : elles ne créent aucun fichier, aucun commit, et ne sont pas envoyées sur le dépôt distant.

## Démarrer avec Docker

Prérequis : Docker avec Docker Compose. Depuis la racine du dépôt :

```bash
docker compose up -d --build
docker compose exec api python backend/import_markdown.py   # une seule fois : fiches d’exemple
```

Ouvrez **http://localhost:5173**. Pour arrêter les services et supprimer les conteneurs :

```bash
docker compose down
```

`docker compose down -v` supprime aussi le volume de la base : toutes les fiches sont alors effacées.

La configuration fournie est destinée au développement local :

- **frontend** : Node et Vite sur le port 5173, accessible uniquement depuis la machine hôte. Les dépendances sont installées avec `npm ci` à partir du fichier de verrouillage.
- **api** : Python et Flask sur le port interne 5000. Le frontend transmet `/api` à `http://api:5000` grâce à `API_PROXY_TARGET`. Dans un conteneur, `localhost` désigne ce conteneur lui-même. L’API démarre une fois la base prête, applique les [migrations](#faire-évoluer-la-base--les-migrations) manquantes, puis s’y connecte grâce à `DATABASE_URL`.
- **db** : PostgreSQL 18, accessible depuis la machine hôte sur `127.0.0.1:5432` (utilisateur, mot de passe et base : `raccourcis`) avec un client PostgreSQL comme TablePlus ou DBeaver. Ce port ne s’ouvre pas dans un navigateur : utilisez Adminer pour ça. Le mot de passe se change avec la variable `POSTGRES_PASSWORD`, par exemple dans un fichier `.env` à la racine (ignoré par Git).
- **adminer** : interface web pour consulter la base, sur **http://localhost:8080**, accessible uniquement depuis la machine hôte. Choisissez le système **PostgreSQL**, puis serveur `db`, utilisateur `raccourcis`, mot de passe `raccourcis` et base `raccourcis`.
- **Persistance** : les données sont dans le volume nommé `db-data`. Les fiches créées restent présentes après `docker compose down`.
- **Images** : `docker compose up --build` construit les images localement. Le Dockerfile backend utilise la racine du dépôt comme contexte et celui du frontend utilise `frontend/`. Le backend conserve `/app/backend` et `/app/content` côte à côte, pour le script d’import. Les images publiées sur GitHub Container Registry (`ghcr.io/alexandre74739/shortcuts-back:latest` et `ghcr.io/alexandre74739/shortcuts-front:latest`) s’utilisent avec `docker compose pull` puis `docker compose up -d`.

Les sources sont copiées dans les images : après une modification du code, relancez `docker compose up -d --build`.

### Publier les images sur GitHub Container Registry

Le workflow `.github/workflows/docker-publish.yml` construit et publie les deux images à chaque push sur `main`. Il peut aussi être lancé manuellement depuis l’onglet **Actions**, sur `main`. Chaque image reçoit les tags `latest` et `sha-<SHA complet du commit>`.

Aucun secret n’est nécessaire : le workflow s’authentifie sur `ghcr.io` avec le `GITHUB_TOKEN` fourni par GitHub Actions. Après la première publication, rendez les paquets `shortcuts-back` et `shortcuts-front` publics (onglet **Packages** du profil GitHub → **Package settings** → **Change visibility**) pour que `docker compose pull` fonctionne sans connexion.

Pour prolonger l’exercice, les élèves peuvent ajouter des montages des sources et le rechargement automatique. Un montage du frontend devra préserver les dépendances installées dans le conteneur, par exemple avec un volume séparé pour `/app/frontend/node_modules`.

`npm run build` produit `frontend/dist/`. `npm run preview` sert à prévisualiser ce build et ne reprend pas le proxy de développement configuré ici. Un déploiement de production nécessite un serveur de fichiers statiques, un reverse proxy `/api` et un serveur WSGI pour Flask ; cette configuration reste un prolongement possible du cours.

Le template n’inclut pas d’authentification : utilisez-le localement pour l’atelier. Un déploiement accessible à tous nécessiterait un contrôle d’accès à la création.

## Publier ce dépôt

Le dossier est déjà un dépôt Git local avec un commit initial. Depuis sa racine, après avoir créé un dépôt **vide** sur GitHub ou GitLab :

```bash
git remote add origin <URL-DU-DEPOT>
git push -u origin main
```

Les élèves pourront alors cloner cette URL. Ne publiez pas de secrets ni de données personnelles dans les fiches.

## Bibliothèques

- [Vite](https://vite.dev/guide/) pour le développement du frontend.
- [Flask](https://flask.palletsprojects.com/) pour l’API.
- [PostgreSQL](https://www.postgresql.org/docs/) pour la base de données et [psycopg](https://www.psycopg.org/psycopg3/docs/) pour s’y connecter depuis Python.
- [python-frontmatter](https://pypi.org/project/python-frontmatter/) pour lire les métadonnées YAML des fiches à importer.
- [Marked](https://marked.js.org/) pour convertir le Markdown en HTML et [DOMPurify](https://github.com/cure53/DOMPurify) pour nettoyer le HTML avant affichage.
