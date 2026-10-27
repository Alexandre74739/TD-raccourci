import { marked } from "marked";
import DOMPurify from "dompurify";
import { api, escapeHtml as e } from "./api.js";
import { icon, showForm } from "./new-shortcut.js";
import { heroTemplate, setupHero } from "./sections/hero.js";
import { reflexesTemplate } from "./sections/reflexes.js";
import {
  keysTemplate,
  sommaireTemplate,
  setupSommaire,
} from "./sections/sommaire.js";
import "./styles/main.scss";

const app = document.querySelector("#app");
let navigation = 0;

function showIndex(shortcuts) {
  app.innerHTML = `
    ${heroTemplate()}
    ${reflexesTemplate()}
    ${sommaireTemplate(shortcuts)}`;
  setupHero();
  setupSommaire(shortcuts);
}

// Fiche d'un raccourci (styles : src/styles/pages/_detail.scss, contenu : components/_markdown.scss).
// Sur grand écran, le contenu à gauche et les touches à droite ; sur mobile, les touches d'abord.
function showShortcut(shortcut) {
  app.innerHTML = `
    <div class="detail">
      <a class="detail-back" href="#/">${icon("back")} Retour au sommaire</a>
      <div class="detail-head">
        <span class="category">${e(shortcut.category)}</span>
        <h1 class="detail-title">${e(shortcut.title)}</h1>
        <p class="detail-lead">${e(shortcut.description)}</p>
      </div>
      <div class="detail-layout">
        <aside class="detail-aside" aria-label="Le raccourci">
          <div class="detail-keys">
            <p class="detail-keys-label">${icon("keyboard")} Le raccourci</p>
            <p class="detail-keys-combo">${keysTemplate(shortcut.keys)}</p>
            <button class="button button--secondary detail-copy" type="button">${icon("copy")} <span data-copy-label>Copier</span></button>
          </div>
          <div class="detail-share">
            <p class="detail-share-title">${icon("bolt")} Une astuce à partager&nbsp;?</p>
            <a class="button button--secondary" href="#/nouveau">Ajouter une fiche</a>
          </div>
        </aside>
        <article id="markdown" class="markdown detail-content"></article>
      </div>
    </div>`;
  // Le Markdown est du contenu externe : nettoyer le HTML avant de l'insérer.
  document.querySelector("#markdown").innerHTML = DOMPurify.sanitize(
    marked.parse(shortcut.content),
  );
  // Texte copié : les touches affichées, comme « Ctrl + Maj + P ».
  const combo = [...document.querySelectorAll(".detail-keys-combo kbd")]
    .map((key) => key.textContent)
    .join(" + ");
  const copy = document.querySelector(".detail-copy");
  const copyLabel = copy.querySelector("[data-copy-label]");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(combo);
      copyLabel.textContent = "Copié !";
    } catch {
      copyLabel.textContent = "Copie impossible";
    }
    setTimeout(() => {
      copyLabel.textContent = "Copier";
    }, 2000);
  });
}

async function route() {
  const current = ++navigation;
  const path = location.hash.slice(1) || "/";
  app.innerHTML = '<p role="status">Chargement des fiches…</p>';
  try {
    if (path === "/nouveau") {
      showForm(app);
    } else if (path === "/") {
      const shortcuts = await api();
      if (current !== navigation) return;
      showIndex(shortcuts);
    } else if (/^\/raccourci\/[^/]+$/.test(path)) {
      const shortcut = await api(
        `/${encodeURIComponent(decodeURIComponent(path.split("/")[2]))}`,
      );
      if (current !== navigation) return;
      showShortcut(shortcut);
    } else {
      throw new Error("Cette page n’existe pas.");
    }
  } catch (error) {
    if (current !== navigation) return;
    app.innerHTML = `<div class="notice" role="alert"><h1>Oups…</h1><p>${e(error.message)}</p><a class="button button--secondary" href="#/">Revenir au sommaire</a></div>`;
  }
  app.focus();
}

window.addEventListener("hashchange", route);
route();
