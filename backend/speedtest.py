"""SpeedTest : tirage d'une série et calcul des statistiques (rien n'est stocké)."""
import math

DEFAULT_COUNT = 20
MAX_COUNT = 50


class InvalidSpeedtest(ValueError):
    """Une requête SpeedTest ne respecte pas le contrat attendu."""


def parse_count(raw):
    """Nombre de raccourcis demandés (20 par défaut, 50 au maximum)."""
    if raw is None:
        return DEFAULT_COUNT
    try:
        count = int(raw)
    except (TypeError, ValueError) as error:
        raise InvalidSpeedtest("Le paramètre count doit être un entier.") from error
    if not 1 <= count <= MAX_COUNT:
        raise InvalidSpeedtest(f"Le paramètre count doit être compris entre 1 et {MAX_COUNT}.")
    return count


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def compute_stats(data):
    """Statistiques d'une partie à partir des résultats envoyés par le frontend.

    Attendu : {"results": [{"slug": str, "time_ms": nombre >= 0, "success": bool}, ...]}
    """
    if not isinstance(data, dict) or not isinstance(data.get("results"), list):
        raise InvalidSpeedtest("Le champ results est obligatoire et doit être une liste.")
    results = data["results"]
    if not 1 <= len(results) <= MAX_COUNT:
        raise InvalidSpeedtest(f"Une partie contient entre 1 et {MAX_COUNT} raccourcis.")

    for result in results:
        if not isinstance(result, dict) or not isinstance(result.get("slug"), str):
            raise InvalidSpeedtest("Chaque résultat doit contenir un slug.")
        time_ms = result.get("time_ms")
        if not _is_number(time_ms) or not math.isfinite(time_ms) or time_ms < 0:
            raise InvalidSpeedtest("Chaque résultat doit contenir un time_ms positif.")
        if not isinstance(result.get("success"), bool):
            raise InvalidSpeedtest("Chaque résultat doit contenir un booléen success.")

    count = len(results)
    total_ms = sum(result["time_ms"] for result in results)
    successful_times = [result["time_ms"] for result in results if result["success"]]
    return {
        "count": count,
        "successes": len(successful_times),
        "success_rate": round(len(successful_times) / count, 4),
        "total_ms": round(total_ms, 1),
        "average_ms": round(total_ms / count, 1),
        "best_ms": round(min(successful_times), 1) if successful_times else None,
    }