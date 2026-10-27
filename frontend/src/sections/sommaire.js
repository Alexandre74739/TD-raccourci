// Sommaire de la page d'accueil : recherche et grille des fiches
// (styles : src/styles/sections/_sommaire.scss, cartes : src/styles/components/_card.scss).

import { escapeHtml as e } from "../api.js";
import { setupCtaSpin } from "../header.js";

// L'API normalise les touches au format « Ctrl+Shift+P » (noms de KeyboardEvent.key, voir
// backend/keys.py) : on les traduit pour la lecture.
const KEY_LABELS = {
  Shift: "Maj",
  Meta: "Cmd / Win",
  Enter: "Entrée",
  Escape: "Échap",
  Space: "Espace",
  Backspace: "⌫ Retour",
  Delete: "Suppr",
  Insert: "Inser",
  Home: "Début",
  End: "Fin",
  PageUp: "Page ↑",
  PageDown: "Page ↓",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Plus: "+",
};

function keyLabels(keys) {
  return keys.split("+").map((key) => KEY_LABELS[key] ?? key);
}

// Une touche par élément, séparées par un « + » : <kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>P</kbd>.
function keysTemplate(keys) {
  return keyLabels(keys)
    .map((label) => `<kbd>${e(label)}</kbd>`)
    .join('<span class="card-keys-plus">+</span>');
}

// Seul le titre est un lien (la carte reste cliquable en entier, voir _card.scss) :
// au lecteur d'écran, la liste des liens et celle des titres donnent les noms des fiches.
function cardTemplate(item) {
  return `
    <article class="card">
      <div class="card-top">
        <span class="category">${e(item.category)}</span>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
      <h3 class="card-title"><a class="card-link" href="#/raccourci/${encodeURIComponent(item.slug)}">${e(item.title)}</a></h3>
      <p class="card-text">${e(item.description)}</p>
      <p class="card-keys"><span class="sommaire-sr">Raccourci : </span>${keysTemplate(item.keys)}</p>
    </article>`;
}

// Le "+" reprend la structure des boutons (.cta-icon > .cta-plus) pour tourner comme eux.
const ADD_CARD = `
  <a class="card card--add" href="#/nouveau">
    <span class="card-plus cta-icon" aria-hidden="true"><span class="cta-plus">+</span></span>
    <span class="card-title">Ajouter un raccourci</span>
    <span class="card-text">Une astuce qui vous fait gagner du temps ? Partagez-la.</span>
  </a>`;

function plural(count) {
  return `fiche${count > 1 ? "s" : ""}`;
}

export function sommaireTemplate(shortcuts) {
  return `
    <section id="sommaire" class="sommaire" aria-labelledby="sommaire-title">
      <div class="sommaire-head">
        <div>
          <h2 id="sommaire-title" class="sommaire-title">Le sommaire <span class="sommaire-count">${shortcuts.length}<span class="sommaire-sr"> ${plural(shortcuts.length)}</span></span></h2>
          <p class="sommaire-lead">Toutes les fiches du carnet. Tapez quelques lettres pour trouver la vôtre.</p>
        </div>
        <label class="sommaire-search">
          <span class="sommaire-search-label">Rechercher une fiche</span>
          <span class="sommaire-search-field">
            <svg class="sommaire-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
            <input id="search" type="search" placeholder="Titre, touches, catégorie…" />
          </span>
        </label>
      </div>
      <p id="sommaire-status" class="sommaire-sr" role="status"></p>
      <div id="cards" class="cards"></div>
    </section>`;
}

export function setupSommaire(shortcuts) {
  const cards = document.querySelector("#cards");
  const search = document.querySelector("#search");
  const status = document.querySelector("#sommaire-status");
  let announceTimer;
  // Texte de recherche de chaque fiche, touches comprises sous leurs deux noms (« Shift » et « Maj »).
  const haystacks = new Map(
    shortcuts.map((item) => [
      item,
      `${item.title} ${item.description} ${item.keys} ${keyLabels(item.keys).join(" ")} ${item.category}`.toLocaleLowerCase(
        "fr",
      ),
    ]),
  );

  // Affiche les fiches qui correspondent à la recherche et renvoie leur nombre.
  function render() {
    const query = search.value.trim().toLocaleLowerCase("fr");
    const matches = shortcuts.filter((item) =>
      haystacks.get(item).includes(query),
    );
    cards.innerHTML = matches.length
      ? matches.map(cardTemplate).join("") + ADD_CARD
      : `<div class="sommaire-empty">
          <p>Aucune fiche ne correspond à « ${e(search.value.trim())} ».</p>
          <button class="button button--secondary" type="button" data-reset>Tout afficher</button>
        </div>${ADD_CARD}`;
    setupCtaSpin(cards.querySelector(".card--add"));
    return matches.length;
  }

  // Nombre de résultats annoncé au lecteur d'écran, une fois la frappe terminée
  // pour ne pas l'interrompre à chaque lettre.
  function announce(count) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      status.textContent = count
        ? `${count} ${plural(count)} ${count > 1 ? "trouvées" : "trouvée"}`
        : "Aucune fiche trouvée";
    }, 600);
  }

  render();
  search.addEventListener("input", () => announce(render()));
  cards.addEventListener("click", (event) => {
    if (!event.target.closest("[data-reset]")) return;
    search.value = "";
    announce(render());
    search.focus();
  });
}
