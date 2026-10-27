// Applique le thème avant le premier rendu (script classique bloquant, chargé dans <head>) :
// choix enregistré par src/theme.js, sinon préférence du système.
try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || (!saved && matchMedia("(prefers-color-scheme: light)").matches))
    document.documentElement.dataset.theme = "light";
} catch {}
