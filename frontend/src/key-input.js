import { escapeHtml as e } from './api.js';
import { MODIFIERS, formatKeys, fromKeyboardEvent, heldModifiers, keyLabel, loadKeyboardLayout } from './keys.js';

// Champ de touches : on fait la combinaison au clavier au lieu de l'écrire.
// La valeur lisible est affichée, la valeur normalisée part dans un champ caché `name`.
// `head` est l'en-tête du champ (libellé relié à `id`), fourni par la page.
export function keyField({ id, name, head }) {
  return `
    <div class="field key-field" data-key-field="${e(name)}">
      ${head}
      <div class="key-capture">
        <input id="${e(id)}" class="field-keys key-display" readonly autocomplete="off"
          placeholder="Cliquez, puis tapez…" aria-describedby="${e(id)}-hint" />
        <button class="key-toggle key-clear" type="button" data-clear>Effacer</button>
      </div>
      <input type="hidden" name="${e(name)}" />
      <div class="key-toggles" role="group" aria-labelledby="${e(id)}-modifiers">
        <span id="${e(id)}-modifiers" class="key-toggles-label">Modificateurs</span>
        ${MODIFIERS.map((modifier) => `<button class="key-toggle" type="button" aria-pressed="false" data-modifier="${modifier}">${e(keyLabel(modifier))}</button>`).join('')}
      </div>
      <p id="${e(id)}-hint" class="field-hint">Cliquez dans le champ, puis faites la combinaison au clavier. <code>Tab</code> passe au champ suivant.
        Combinaison interceptée par le système (<code>Cmd + Q</code>, <code>Alt + F4</code>…) ? Activez ses modificateurs ci-dessus, puis appuyez seulement sur la dernière touche.</p>
    </div>`;
}

export function bindKeyField(field) {
  loadKeyboardLayout();
  const display = field.querySelector('.key-display');
  const value = field.querySelector('input[type="hidden"]');
  const buttons = [...field.querySelectorAll('[data-modifier]')];
  const placeholder = display.placeholder;
  // Modificateurs activés à l'écran : le système ne les voit pas, donc n'intercepte pas la combinaison.
  const held = new Set();
  const release = () => {
    held.clear();
    buttons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    display.placeholder = placeholder;
  };
  // Pendant l'appui sur des modificateurs, le champ montre « Ctrl + … » : sans cela, on croit
  // que Ctrl n'est pas pris en compte. Au relâchement, il revient à la combinaison enregistrée.
  // `pending` : des modificateurs sont enfoncés sans touche principale. Une combinaison qui
  // vient d'être enregistrée reste affichée même si on relâche Ctrl après P.
  let pending = false;
  const preview = (event) => {
    const modifiers = heldModifiers(event, [...held]);
    pending = modifiers.length > 0;
    display.value = pending
      ? `${formatKeys(modifiers.join('+'))} + …`
      : (value.value ? formatKeys(value.value) : '');
  };
  const set = (keys) => {
    value.value = keys;
    display.value = keys ? formatKeys(keys) : '';
    // Le champ caché ne déclenche pas d'événement : la page (aperçu…) est prévenue ici.
    display.dispatchEvent(new Event('input', { bubbles: true }));
  };
  display.addEventListener('keydown', (event) => {
    // Tab et Maj + Tab restent la navigation au clavier, sauf pour compléter des modificateurs activés (Cmd + Tab).
    if (event.key === 'Tab' && !held.size && !event.ctrlKey && !event.altKey && !event.metaKey) return;
    // Sans cela, la combinaison déclencherait aussi son action dans la page (Entrée envoie le formulaire…).
    event.preventDefault();
    const keys = fromKeyboardEvent(event, [...held]);
    if (!keys) return preview(event);
    pending = false;
    set(keys);
    release();
  });
  display.addEventListener('keyup', (event) => {
    if (pending) preview(event);
  });
  display.addEventListener('blur', () => {
    pending = false;
    display.value = value.value ? formatKeys(value.value) : '';
  });
  buttons.forEach((button) => button.addEventListener('click', () => {
    const { modifier } = button.dataset;
    if (held.has(modifier)) held.delete(modifier);
    else held.add(modifier);
    button.setAttribute('aria-pressed', String(held.has(modifier)));
    const ordered = MODIFIERS.filter((name) => held.has(name));
    display.placeholder = ordered.length ? `${formatKeys(ordered.join('+'))} + … (appuyez sur la dernière touche)` : placeholder;
    display.focus();
  }));
  field.querySelector('[data-clear]').addEventListener('click', () => {
    set('');
    release();
    display.focus();
  });
  return {
    get value() { return value.value; },
    focus: () => display.focus(),
  };
}
