// Hero de la page d'accueil (styles : src/styles/sections/_hero.scss).

import { setupCtaSpin } from "../header.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Icônes de fond, décoratives : une touche Ctrl (le clavier), un curseur (les clics en moins)
// et un éclair (les réflexes). Les dessins sont dans public/icons/, la couleur dans le CSS.
const ICONS = ["key", "cursor", "bolt"]
  .map(
    (name) =>
      `<span class="hero-icon hero-icon--${name}" aria-hidden="true"></span>`,
  )
  .join("");

export function heroTemplate(shortcuts) {
  const browse =
    shortcuts.length > 1
      ? `Voir les ${shortcuts.length} fiches`
      : "Voir le sommaire";
  return `
    <section class="hero" aria-labelledby="hero-title">
      ${ICONS}
      <div class="hero-content">
        <h1 id="hero-title" class="hero-title">Moins de clics.<br>Plus de <mark>réflexes</mark>.</h1>
        <p class="hero-lead">Les raccourcis clavier qu’on utilise vraiment en cours. Une fiche chacun, à lire en une minute.</p>
        <div class="hero-actions">
          <a class="button button--primary" href="#/nouveau"><span class="cta-icon" aria-hidden="true"><span class="cta-plus">+</span></span> Ajouter un raccourci</a>
          <button class="button button--secondary" type="button" data-hero-browse>${browse}</button>
        </div>
      </div>
    </section>`;
}

export function setupHero() {
  setupCtaSpin(document.querySelector(".hero .button--primary"));
  document.querySelector("[data-hero-browse]").addEventListener("click", () => {
    document
      .querySelector("#sommaire")
      .scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    document.querySelector("#search").focus({ preventScroll: true });
  });
}
