// Bouton de thème du header : bascule sombre / clair via <html data-theme>,
// choix mémorisé dans localStorage (relu avant le rendu par public/theme-init.js,
// qui suit prefers-color-scheme tant que rien n'est enregistré).
const STORAGE_KEY = "theme";
const root = document.documentElement;
const toggle = document.querySelector(".header .theme-toggle");

function currentTheme() {
  return root.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  if (theme === "light") {
    root.dataset.theme = "light";
  } else {
    delete root.dataset.theme;
  }
  // Le libellé annonce l'action du bouton, pas l'état courant.
  const label = theme === "light" ? "Passer en thème sombre" : "Passer en thème clair";
  toggle?.setAttribute("aria-label", label);
  toggle?.setAttribute("title", label);
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Stockage indisponible (navigation privée…) : le thème vaut pour la session.
  }
}

applyTheme(currentTheme());

toggle?.addEventListener("click", () => {
  const next = currentTheme() === "light" ? "dark" : "light";
  applyTheme(next);
  saveTheme(next);
});
