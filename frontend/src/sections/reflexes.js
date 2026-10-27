// Bandeau Toxine sous le hero (styles : src/styles/sections/_reflexes.scss).

// Sept éclairs décoratifs, placés dans les marges de part et d'autre du texte :
// côté (l ou r), position dans la marge (0 = bord de l'écran, 1 = bord du texte),
// hauteur (%), taille maximale (px) et inclinaison (deg).
const BOLTS = [
  ["l", 0.45, 30, 84, 4],
  ["l", 0.35, 62, 120, -4],
  ["l", 0.55, 86, 64, 6],
  ["l", 0.85, 40, 52, -2],
  ["r", 0.5, 26, 72, -6],
  ["r", 0.4, 60, 110, 4],
  ["r", 0.7, 86, 52, -4],
]
  .map(([side, gutter, y, size, tilt], index) => {
    const x =
      side === "l"
        ? `calc(${gutter} * var(--gutter))`
        : `calc(100% - ${gutter} * var(--gutter))`;
    return `<span class="reflexes-bolt" style="--x: ${x}; --y: ${y}%; --size: ${size}px; --tilt: ${tilt}deg; --delay: ${-index}s" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" /></svg></span>`;
  })
  .join("");

export function reflexesTemplate() {
  return `
    <section class="reflexes" aria-labelledby="reflexes-title">
      ${BOLTS}
      <div class="reflexes-content">
        <h2 id="reflexes-title" class="reflexes-title">Un raccourci de plus, un clic de <mark>moins</mark>.</h2>
        <p class="reflexes-text">Chaque fiche fait gagner quelques secondes. Mises bout à bout, ce sont des heures rendues au vrai travail.</p>
      </div>
    </section>`;
}
