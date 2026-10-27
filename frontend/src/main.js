import { marked } from "marked";
import DOMPurify from "dompurify";
import { api, escapeHtml as e } from "./api.js";
import { showForm } from "./new-shortcut.js";
import { heroTemplate, setupHero } from "./sections/hero.js";
import { reflexesTemplate } from "./sections/reflexes.js";
import { sommaireTemplate, setupSommaire } from "./sections/sommaire.js";
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

function showShortcut(shortcut) {
  app.innerHTML = `
    <a class="back" href="#/">← Retour au sommaire</a>
    <article class="detail"><span class="category">${e(shortcut.category)}</span>
      <h1>${e(shortcut.title)}</h1><p class="intro">${e(shortcut.description)}</p>
      <kbd>${e(shortcut.keys)}</kbd><div id="markdown" class="markdown"></div>
    </article>`;
  // Le Markdown est du contenu externe : nettoyer le HTML avant de l'insérer.
  document.querySelector("#markdown").innerHTML = DOMPurify.sanitize(
    marked.parse(shortcut.content),
  );
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
    app.innerHTML = `<div class="notice" role="alert"><h1>Oups…</h1><p>${e(error.message)}</p><a href="#/">Revenir au sommaire</a></div>`;
  }
  app.focus();
}

window.addEventListener("hashchange", route);
route();
