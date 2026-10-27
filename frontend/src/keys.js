// Format normalisé des touches, le même que l'API (backend/keys.py) : « Ctrl+Shift+P ».
export const MODIFIERS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const NAMED_KEYS = new Set([
  'Enter', 'Escape', 'Tab', 'Space', 'Backspace', 'Delete', 'Insert',
  'Home', 'End', 'PageUp', 'PageDown',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Plus',
  ...Array.from({ length: 24 }, (_, index) => `F${index + 1}`),
]);
// Appuyées seules, ces touches ne forment pas un raccourci.
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'AltGraph', 'Shift', 'Meta', 'OS', 'CapsLock', 'Fn', 'FnLock', 'NumLock']);
const LABELS = {
  Shift: 'Maj', Enter: 'Entrée', Escape: 'Échap', Space: 'Espace', Backspace: 'Retour arrière',
  Delete: 'Suppr', Insert: 'Inser', Home: 'Début', End: 'Fin', PageUp: 'Page préc.', PageDown: 'Page suiv.',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Plus: '+',
};

// Carte du clavier (Chrome et Edge) : position physique → caractère selon la disposition,
// par exemple KeyW → « z » sur AZERTY. Chargée une fois, car la capture d'une touche est synchrone.
let keyboardLayout = null;

export async function loadKeyboardLayout() {
  try {
    keyboardLayout = (await navigator.keyboard?.getLayoutMap?.()) ?? null;
  } catch {
    // Indisponible (Safari, Firefox, iframe…) : on garde la position QWERTY.
    keyboardLayout = null;
  }
}

export function isApple(platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent) {
  return /mac|iphone|ipad/i.test(platform);
}

function mainKey(event, layout) {
  if (MODIFIER_KEYS.has(event.key)) return null;
  if (event.key === ' ') return 'Space';
  if (event.key === '+') return 'Plus';
  if (NAMED_KEYS.has(event.key)) return event.key;
  // Les chiffres (« & » sur AZERTY) changent de caractère : on se fie à la position physique.
  // Avec Alt, Windows et Linux donnent la bonne lettre (Z sur AZERTY) ; seul Option sur Mac la
  // transforme (« π » pour Option + P), et c'est alors seulement qu'on lit la position.
  const altered = event.altKey && !/^[a-z]$/i.test(event.key);
  // La carte du clavier retrouve la vraie lettre (Z sur un Mac AZERTY), sinon la position QWERTY.
  const mapped = altered && /^Key[A-Z]$/.test(event.code) ? layout?.get(event.code) : undefined;
  if (mapped && /^[a-z]$/i.test(mapped)) return mapped.toUpperCase();
  const physical = /^(?:Digit|Numpad)(\d)$/.exec(event.code) ?? (altered ? /^Key([A-Z])$/.exec(event.code) : null);
  if (physical) return physical[1];
  const upper = event.key.toUpperCase();
  // « ß » devient « SS » en majuscule : comme l'API, on n'accepte qu'un seul caractère.
  if ([...event.key].length === 1 && [...upper].length === 1 && event.key.trim()) return upper;
  return null;
}

// Modificateurs enfoncés au clavier, plus ceux choisis à l'écran (`held`), dans l'ordre normalisé.
export function heldModifiers(event, held = []) {
  const pressed = new Set(held);
  if (event.ctrlKey) pressed.add('Ctrl');
  if (event.altKey) pressed.add('Alt');
  if (event.shiftKey) pressed.add('Shift');
  if (event.metaKey) pressed.add('Meta');
  return MODIFIERS.filter((name) => pressed.has(name));
}

// Combinaison d'un keydown au format normalisé, ou null pour un modificateur seul.
// `held` ajoute des modificateurs choisis à l'écran plutôt qu'au clavier.
// `layout` remplace la carte du clavier chargée (tests).
export function fromKeyboardEvent(event, held = [], layout = keyboardLayout) {
  const key = mainKey(event, layout);
  if (key === null) return null;
  return [...heldModifiers(event, held), key].join('+');
}

export function keyLabel(name, apple = isApple()) {
  if (name === 'Meta') return apple ? 'Cmd' : 'Win';
  if (name === 'Alt' && apple) return 'Option';
  return LABELS[name] ?? name;
}

// « Ctrl+Shift+P » → « Ctrl + Maj + P », pour l'affichage.
export function formatKeys(keys, apple = isApple()) {
  return keys.split('+').map((name) => keyLabel(name, apple)).join(' + ');
}
