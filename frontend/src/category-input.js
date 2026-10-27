import { escapeHtml as e } from './api.js';

// Liste déroulante accessible (pattern ARIA « combobox ») : la catégorie doit être choisie
// dans la liste. Une catégorie existante part dans category_slug, une nouvelle dans new_category.
// `head` est l'en-tête du champ (libellé relié à `id`), fourni par la page.
export function categoryField({ id, head }) {
  return `
    <div class="field category-field" data-category-field>
      ${head}
      <div class="combobox">
        <input id="${e(id)}" role="combobox" aria-autocomplete="list" aria-expanded="false"
          aria-controls="${e(id)}-options" autocomplete="off" maxlength="60" placeholder="VS Code, terminal…" />
        <ul id="${e(id)}-options" class="combobox-options" role="listbox" aria-label="Catégories" hidden></ul>
      </div>
      <input type="hidden" name="category_slug" />
      <input type="hidden" name="new_category" />
    </div>`;
}

// « Éditeur » et « editeur » se retrouvent l'une l'autre.
const simplify = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();

export function bindCategoryField(field) {
  const input = field.querySelector('[role="combobox"]');
  const listbox = field.querySelector('[role="listbox"]');
  const slug = field.querySelector('input[name="category_slug"]');
  const newCategory = field.querySelector('input[name="new_category"]');
  let categories = [];
  let options = [];
  let active = -1;

  const close = () => {
    listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const render = () => {
    listbox.innerHTML = options.map((option, index) => `
      <li id="${input.id}-option-${index}" role="option" aria-selected="${index === active}"${option.created ? ' class="created"' : ''}>${e(option.label)}</li>`).join('');
    listbox.hidden = options.length === 0;
    input.setAttribute('aria-expanded', String(!listbox.hidden));
    if (active >= 0) input.setAttribute('aria-activedescendant', `${input.id}-option-${active}`);
    else input.removeAttribute('aria-activedescendant');
    listbox.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };
  const open = () => {
    const query = simplify(input.value);
    options = categories.filter((category) => simplify(category.label).includes(query));
    const text = input.value.trim();
    if (text && !categories.some((category) => simplify(category.label) === query)) {
      options.push({ label: `Nouvelle catégorie "${text}"`, created: text });
    }
    active = options.length ? 0 : -1;
    render();
  };
  // Une valeur changée par le code ne déclenche pas d'événement : la page (aperçu, compteur)
  // est prévenue ici, sans que ce faux « input » n'annule le choix.
  let notifying = false;
  const notify = () => {
    notifying = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    notifying = false;
  };
  const select = (option) => {
    input.value = option.created ?? option.label;
    slug.value = option.slug ?? '';
    newCategory.value = option.created ?? '';
    close();
    notify();
  };

  input.addEventListener('input', () => {
    if (notifying) return;
    // Un texte modifié n'est plus la catégorie choisie : il faut en resélectionner une.
    slug.value = '';
    newCategory.value = '';
    open();
  });
  input.addEventListener('focus', open);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (listbox.hidden) return open();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      active = (active + step + options.length) % options.length;
      render();
    } else if (event.key === 'Enter' && !listbox.hidden && active >= 0) {
      // Entrée choisit l'option au lieu d'envoyer le formulaire.
      event.preventDefault();
      select(options[active]);
    } else if (event.key === 'Escape' && !listbox.hidden) {
      event.preventDefault();
      close();
    }
  });
  // mousedown plutôt que click : le champ ne perd pas le focus avant la sélection.
  listbox.addEventListener('mousedown', (event) => {
    const item = event.target.closest('[role="option"]');
    if (!item) return;
    event.preventDefault();
    select(options[Number(item.id.split('-').pop())]);
  });

  return {
    get value() { return slug.value || newCategory.value; },
    focus: () => input.focus(),
    setCategories(list) {
      categories = list;
      if (document.activeElement === input) open();
    },
  };
}
