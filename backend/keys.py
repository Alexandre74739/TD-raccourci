"""Format normalisé des touches : « Ctrl+Shift+P ».

Les modificateurs viennent d'abord, dans un ordre fixe, puis une seule touche
principale. Les noms suivent KeyboardEvent.key pour que le frontend puisse
comparer directement une combinaison tapée au clavier.
"""

MODIFIERS = ("Ctrl", "Alt", "Shift", "Meta")
NAMED_KEYS = (
    "Enter", "Escape", "Tab", "Space", "Backspace", "Delete", "Insert",
    "Home", "End", "PageUp", "PageDown",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Plus",
    *(f"F{number}" for number in range(1, 25)),
)
# Noms acceptés en saisie, en minuscules, y compris les noms français.
ALIASES = {
    "ctrl": "Ctrl", "control": "Ctrl", "contrôle": "Ctrl", "controle": "Ctrl",
    "alt": "Alt", "option": "Alt", "opt": "Alt", "⌥": "Alt", "altgr": "Alt",
    "shift": "Shift", "maj": "Shift", "majuscule": "Shift", "⇧": "Shift",
    "meta": "Meta", "cmd": "Meta", "command": "Meta", "commande": "Meta", "⌘": "Meta",
    "win": "Meta", "windows": "Meta", "super": "Meta",
    "entrée": "Enter", "entree": "Enter", "return": "Enter", "↵": "Enter",
    "échap": "Escape", "echap": "Escape", "esc": "Escape",
    "espace": "Space", "tabulation": "Tab",
    "retour arrière": "Backspace", "effacement": "Backspace", "⌫": "Backspace",
    "suppr": "Delete", "supprimer": "Delete", "del": "Delete", "inser": "Insert",
    "début": "Home", "debut": "Home", "fin": "End",
    "pageprec": "PageUp", "pagesuiv": "PageDown",
    "haut": "ArrowUp", "flèche haut": "ArrowUp", "↑": "ArrowUp",
    "bas": "ArrowDown", "flèche bas": "ArrowDown", "↓": "ArrowDown",
    "gauche": "ArrowLeft", "flèche gauche": "ArrowLeft", "←": "ArrowLeft",
    "droite": "ArrowRight", "flèche droite": "ArrowRight", "→": "ArrowRight",
    **{name.lower(): name for name in (*MODIFIERS, *NAMED_KEYS)},
}


class InvalidKeys(ValueError):
    """La combinaison ne peut pas être convertie au format normalisé."""


def normalize_keys(value):
    """Convertit « Ctrl + Maj + P » en « Ctrl+Shift+P »."""
    parts = [part.strip() for part in value.split("+")]
    if not all(parts):
        raise InvalidKeys("Touche vide : utilisez « Plus » pour la touche +.")
    modifiers = set()
    main_keys = []
    for part in parts:
        name = ALIASES.get(part.lower())
        if name is None and len(part) == 1 and not part.isspace():
            name = part.upper()
        if name is None:
            raise InvalidKeys(f"Touche inconnue : {part}.")
        if name in MODIFIERS:
            if name in modifiers:
                raise InvalidKeys(f"Le modificateur {name} apparaît deux fois.")
            modifiers.add(name)
        else:
            main_keys.append(name)
    if len(main_keys) != 1:
        raise InvalidKeys("La combinaison doit contenir exactement une touche principale.")
    return "+".join([name for name in MODIFIERS if name in modifiers] + main_keys)
