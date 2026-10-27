import { escapeHtml as e } from './api.js';
import { formatKeys, fromKeyboardEvent } from './keys.js';

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
      <p id="${e(id)}-hint" class="field-hint">Cliquez dans le champ, puis faites la combinaison au clavier. <code>Tab</code> passe au champ suivant.</p>
    </div>`;
}

export function bindKeyField(field) {
  const display = field.querySelector('.key-display');
  const value = field.querySelector('input[type="hidden"]');
  const set = (keys) => {
    value.value = keys;
    display.value = keys ? formatKeys(keys) : '';
    // Le champ caché ne déclenche pas d'événement : la page (aperçu…) est prévenue ici.
    display.dispatchEvent(new Event('input', { bubbles: true }));
  };
  display.addEventListener('keydown', (event) => {
    // Tab et Maj + Tab restent la navigation au clavier.
    if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) return;
    // Sans cela, la combinaison déclencherait aussi son action dans la page (Entrée envoie le formulaire…).
    event.preventDefault();
    const keys = fromKeyboardEvent(event);
    if (keys) set(keys);
  });
  field.querySelector('[data-clear]').addEventListener('click', () => {
    set('');
    display.focus();
  });
  return {
    get value() { return value.value; },
    focus: () => display.focus(),
  };
}
