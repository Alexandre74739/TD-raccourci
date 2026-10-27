"""Mode révision : tirage des questions du quiz et correction (rien n'est stocké)."""
import random

DEFAULT_COUNT = 10
MAX_COUNT = 50
CHOICES = 4


class InvalidQuiz(ValueError):
    """Une requête du quiz ne respecte pas le contrat attendu."""


def parse_count(raw):
    """Nombre de questions demandées (10 par défaut, 50 au maximum)."""
    if raw is None:
        return DEFAULT_COUNT
    try:
        count = int(raw)
    except (TypeError, ValueError) as error:
        raise InvalidQuiz("Le paramètre count doit être un entier.") from error
    if not 1 <= count <= MAX_COUNT:
        raise InvalidQuiz(f"Le paramètre count doit être compris entre 1 et {MAX_COUNT}.")
    return count


def build_questions(pool, category_slug=None, count=DEFAULT_COUNT, rng=random):
    """Tire les questions : la description s'affiche, l'utilisateur choisit la bonne combinaison.

    Les questions viennent de la catégorie demandée (ou de toutes), mais les mauvaises
    propositions viennent de toutes les fiches : une petite catégorie reste jouable.
    La bonne réponse n'est jamais renvoyée : elle est vérifiée par grade().
    """
    candidates = [f for f in pool if category_slug is None or f["category_slug"] == category_slug]
    if not candidates:
        raise InvalidQuiz("Aucun raccourci à réviser dans cette catégorie.")
    all_keys = sorted({f["keys"] for f in pool})
    if len(all_keys) < 2:
        raise InvalidQuiz("Il faut au moins deux combinaisons différentes pour faire un quiz.")

    questions = []
    for fiche in rng.sample(candidates, min(count, len(candidates))):
        others = [keys for keys in all_keys if keys != fiche["keys"]]
        choices = rng.sample(others, min(CHOICES - 1, len(others))) + [fiche["keys"]]
        rng.shuffle(choices)
        questions.append({
            "slug": fiche["slug"],
            "title": fiche["title"],
            "description": fiche["description"],
            "choices": choices,
        })
    return questions


def parse_answers(data):
    """Valide le corps de la requête et renvoie une liste de (slug, réponse)."""
    if not isinstance(data, dict) or not isinstance(data.get("answers"), list):
        raise InvalidQuiz("Le champ answers est obligatoire et doit être une liste.")
    if not 1 <= len(data["answers"]) <= MAX_COUNT:
        raise InvalidQuiz(f"Une session contient entre 1 et {MAX_COUNT} questions.")
    answers = []
    for item in data["answers"]:
        if not isinstance(item, dict) or not isinstance(item.get("slug"), str):
            raise InvalidQuiz("Chaque réponse doit contenir un slug.")
        given = item.get("answer")
        if given is not None and not isinstance(given, str):
            raise InvalidQuiz("Chaque réponse doit être un texte (ou null si la question est passée).")
        answers.append((item["slug"], given))
    return answers


def grade(answers, known):
    """Score et liste des raccourcis ratés. `known` associe chaque slug à sa fiche en base."""
    wrong = []
    for slug, given in answers:
        fiche = known.get(slug)
        if fiche is None:
            raise InvalidQuiz(f"Raccourci inconnu : {slug}.")
        if given != fiche["keys"]:
            wrong.append({
                "slug": slug,
                "title": fiche["title"],
                "description": fiche["description"],
                "keys": fiche["keys"],
                "answer": given,
            })
    return {"count": len(answers), "score": len(answers) - len(wrong), "wrong": wrong}