// Page « Ajouter un raccourci » (styles : src/styles/pages/_nouveau.scss, champs : src/styles/components/_form.scss).
// Formulaire en trois étapes, avec l'aperçu de la carte du sommaire mis à jour pendant la saisie.

import { api, escapeHtml as e } from "./api.js";
import { setupCtaSpin } from "./header.js";
import { bindKeyField, keyField } from "./key-input.js";
import { keysTemplate } from "./sections/sommaire.js";

// Icônes au trait (24 × 24) : la couleur et l'épaisseur viennent du CSS (.icon).
const ICONS = {
  back: '<path d="M19 12H5M11 18l-6-6 6-6" />',
  title: '<path d="M5 7V5h14v2M12 5v14M9 19h6" />',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" />',
  text: '<path d="M4 6h16M4 12h16M4 18h10" />',
  keyboard:
    '<rect x="2" y="5" width="20" height="14" rx="3" /><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M8 16h8" />',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" />',
  heading: '<path d="M6 4v16M18 4v16M6 12h12" />',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5" />',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L5 21" />',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />',
  bolt: '<path d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" />',
  check: '<path d="m5 12 5 5 9-10" />',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />',
  alert: '<path d="M12 3 2 21h20zM12 10v4M12 17.5h.01" />',
};

export function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

// Barre d'outils Markdown : la sélection est entourée par la syntaxe, sinon un exemple est
// inséré puis sélectionné pour être remplacé. Les blocs (intertitre, liste) ouvrent une ligne.
const SNIPPETS = {
  heading: {
    label: "Intertitre",
    before: "## ",
    after: "",
    sample: "À quoi sert ce raccourci ?",
    block: true,
  },
  bold: { label: "Gras", before: "**", after: "**", sample: "important" },
  code: { label: "Code", before: "`", after: "`", sample: "code" },
  list: {
    label: "Liste",
    before: "- ",
    after: "",
    sample: "Une étape",
    block: true,
  },
  link: {
    label: "Lien",
    before: "[",
    after: "](https://exemple.org)",
    sample: "Texte du lien",
  },
  image: {
    label: "Image",
    before: "![",
    after: "](https://exemple.org/image.png)",
    sample: "Description de l’image",
  },
};

function insertSnippet(textarea, { before, after, sample, block }) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const text = value.slice(start, end) || sample;
  const prefix =
    block && start > 0 && value[start - 1] !== "\n" ? `\n${before}` : before;
  const suffix = block && end < value.length && value[end] !== "\n" ? "\n" : "";
  textarea.setRangeText(prefix + text + after + suffix, start, end);
  textarea.focus();
  textarea.setSelectionRange(
    start + prefix.length,
    start + prefix.length + text.length,
  );
}

// En-tête de champ : libellé avec son icône, et le compteur de caractères s'il y a une limite.
function fieldHead(id, iconName, label, counter = "") {
  return `
    <div class="field-head">
      <label class="field-label" for="new-${id}">${icon(iconName)} ${label}</label>
      ${counter && `<span class="field-count" data-count="${counter}" aria-hidden="true"></span>`}
    </div>`;
}

const SUBMIT_LABEL = "Publier la fiche";
// Touches d'exemple de l'aperçu, tant que la combinaison n'est pas faite.
const PREVIEW_KEYS = "Ctrl+Shift+P";

export function showForm(app) {
  app.innerHTML = `
    <div class="nouveau">
      <a class="nouveau-back" href="#/">${icon("back")} Retour au sommaire</a>
      <div class="nouveau-head">
        <span class="nouveau-deco" aria-hidden="true"></span>
        <p class="nouveau-eyebrow">Enrichir le carnet</p>
        <h1 class="nouveau-title">Une astuce à <mark>partager</mark>&nbsp;?</h1>
        <p class="nouveau-lead">Trois étapes : la fiche, les touches, puis l’explication en Markdown. L’aperçu de la carte suit votre saisie.</p>
      </div>
      <form id="shortcut-form" class="nouveau-form">
        <fieldset class="form-step">
          <legend class="form-step-title"><span class="form-step-number" aria-hidden="true">01</span> La fiche</legend>
          <div class="form-grid">
            <div class="field field--wide">
              ${fieldHead("title", "title", "Titre", "title")}
              <input id="new-title" name="title" required maxlength="120" autocomplete="off" placeholder="Ouvrir la palette de commandes" />
            </div>
            <div class="field">
              ${fieldHead("category", "tag", "Catégorie", "category")}
              <input id="new-category" name="category" required maxlength="60" autocomplete="off" placeholder="VS Code, terminal…" />
            </div>
            <div class="field">
              ${fieldHead("description", "text", "Description courte", "description")}
              <input id="new-description" name="description" required maxlength="300" autocomplete="off" placeholder="Une phrase pour le sommaire" />
            </div>
          </div>
        </fieldset>

        <fieldset class="form-step">
          <legend class="form-step-title"><span class="form-step-number" aria-hidden="true">02</span> Les touches</legend>
          ${keyField({ id: "new-keys", name: "keys", head: fieldHead("keys", "keyboard", "Combinaison") })}
        </fieldset>

        <fieldset class="form-step">
          <legend class="form-step-title"><span class="form-step-number" aria-hidden="true">03</span> L’explication</legend>
          <div class="field">
            ${fieldHead("content", "file", "Contenu Markdown")}
            <div class="editor">
              <div class="editor-toolbar" role="group" aria-label="Mise en forme Markdown">
                ${Object.entries(SNIPPETS)
                  .map(
                    ([name, { label }]) =>
                      `<button class="editor-tool" type="button" data-snippet="${name}" aria-label="${label}" title="${label}">${icon(name)}</button>`,
                  )
                  .join("")}
              </div>
              <textarea id="new-content" name="content" required rows="12" spellcheck="true" placeholder="## À quoi sert ce raccourci ?"></textarea>
            </div>
          </div>
        </fieldset>

        <aside class="nouveau-preview" aria-label="Aperçu et conseils">
          <div class="nouveau-preview-block" aria-hidden="true">
            <p class="nouveau-preview-title">${icon("eye")} Aperçu dans le sommaire</p>
            <article class="card nouveau-card">
              <div class="card-top">
                <span class="category" data-preview="category">Catégorie</span>
                <span class="card-arrow">↗</span>
              </div>
              <p class="card-title" data-preview="title">Titre de la fiche</p>
              <p class="card-text" data-preview="description">La description courte s’affiche ici.</p>
              <p class="card-keys" data-preview-keys></p>
            </article>
          </div>
          <div class="nouveau-tips">
            <p class="nouveau-tips-title">${icon("bolt")} Une bonne fiche</p>
            <ul>
              <li>${icon("check")} Un titre qui dit ce que fait le raccourci.</li>
              <li>${icon("check")} Une description lisible d’un coup d’œil.</li>
              <li>${icon("check")} Un exemple concret dans l’explication.</li>
            </ul>
          </div>
        </aside>

        <div class="form-footer">
          <p id="form-error" class="form-error" role="alert"></p>
          <div class="form-actions">
            <p class="form-actions-note">La fiche rejoint le sommaire dès sa création.</p>
            <a class="button button--secondary" href="#/">Annuler</a>
            <button class="button button--primary" type="submit"><span class="cta-icon" aria-hidden="true"><span class="cta-plus">+</span></span> <span data-submit-label>${SUBMIT_LABEL}</span></button>
          </div>
        </div>
      </form>
    </div>`;

  const form = document.querySelector("#shortcut-form");
  const field = (name) => form.elements.namedItem(name);
  const keys = bindKeyField(form.querySelector('[data-key-field="keys"]'));
  const content = field("content");
  const button = form.querySelector('[type="submit"]');
  const buttonLabel = button.querySelector("[data-submit-label]");
  const errorMessage = document.querySelector("#form-error");
  const counters = form.querySelectorAll("[data-count]");
  const previews = form.querySelectorAll("[data-preview]");
  const previewKeys = form.querySelector("[data-preview-keys]");
  // Le texte d'exemple de l'aperçu revient quand le champ est vidé.
  for (const element of previews)
    element.dataset.fallback = element.textContent;

  function update() {
    for (const counter of counters) {
      const input = field(counter.dataset.count);
      counter.textContent = `${input.value.length} / ${input.maxLength}`;
      counter.classList.toggle(
        "is-near",
        input.value.length > input.maxLength * 0.9,
      );
    }
    for (const element of previews) {
      const value = field(element.dataset.preview).value.trim();
      element.textContent = value || element.dataset.fallback;
      element.classList.toggle("is-empty", !value);
    }
    previewKeys.innerHTML = keysTemplate(keys.value || PREVIEW_KEYS);
    previewKeys.classList.toggle("is-empty", !keys.value);
  }

  form.querySelector(".editor-toolbar").addEventListener("click", (event) => {
    const tool = event.target.closest("[data-snippet]");
    if (tool) insertSnippet(content, SNIPPETS[tool.dataset.snippet]);
  });

  function showError(message) {
    errorMessage.innerHTML = `${icon("alert")}<span>${e(message)}</span>`;
  }

  form.addEventListener("input", update);
  update();
  setupCtaSpin(button);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";
    // Le champ affiché est en lecture seule : le navigateur ne vérifie pas qu'il est rempli.
    if (!keys.value) {
      showError("Faites la combinaison de touches dans le champ Combinaison.");
      keys.focus();
      return;
    }
    button.disabled = true;
    buttonLabel.textContent = "Publication…";
    try {
      const data = Object.fromEntries(new FormData(form));
      const shortcut = await api("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      location.hash = `/raccourci/${encodeURIComponent(shortcut.slug)}`;
    } catch (error) {
      showError(error.message);
    } finally {
      button.disabled = false;
      buttonLabel.textContent = SUBMIT_LABEL;
    }
  });
}
