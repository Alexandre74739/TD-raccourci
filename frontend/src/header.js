import { animate } from "motion";

// Survol du CTA et du bouton de thème : leur icône part comme une toupie.
// Clic sur un bouton : explosion de particules.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const PARTICLE_COLORS = ["var(--toxine)", "var(--acide)", "var(--papier)"];
const SWIRL_ARMS = 3;

// Bras de spirale d'Archimède (r = a + bθ), tracé de l'extérieur vers le centre
// en tournant dans le sens horaire, comme le "+".
function spiralArm(start, turns = 0.5, from = 14, to = 2, steps = 40) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const angle = start + (i / steps) * turns * Math.PI * 2;
    const radius = from + ((to - from) * i) / steps;
    points.push(
      `${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return `M${points.join("L")}`;
}

let swirlCount = 0;

function createSwirl(container) {
  // Identifiants uniques : chaque tourbillon a son propre masque.
  const id = `cta-swirl-${++swirlCount}`;
  const arms = Array.from(
    { length: SWIRL_ARMS },
    (_, i) => `<path d="${spiralArm((i / SWIRL_ARMS) * Math.PI * 2)}" />`,
  ).join("");
  // Le masque radial efface le bout extérieur des bras et le cœur du tourbillon :
  // les traits apparaissent sur les bords et disparaissent, aspirés, au centre.
  container.insertAdjacentHTML(
    "afterbegin",
    `<svg class="cta-swirl" viewBox="-15 -15 30 30">
      <defs>
        <radialGradient id="${id}-fade">
          <stop offset="0.12" stop-color="black" />
          <stop offset="0.4" stop-color="white" />
          <stop offset="0.7" stop-color="white" />
          <stop offset="1" stop-color="black" />
        </radialGradient>
        <mask id="${id}-mask">
          <rect x="-15" y="-15" width="30" height="30" fill="url(#${id}-fade)" />
        </mask>
      </defs>
      <g mask="url(#${id}-mask)">${arms}</g>
    </svg>`,
  );
  return container.querySelector(".cta-swirl");
}

function spinTop(target, swirl) {
  // Ressort réglé sur 1 s : un tour qui ralentit en douceur, dépasse un peu
  // puis revient se poser (élasticité légère).
  const spin = animate(
    target,
    { rotate: [0, 360] },
    { type: "spring", duration: 1, bounce: 0.25 },
  );
  // Vacillement de toupie : léger, il apparaît quand elle ralentit puis se stabilise.
  animate(
    target,
    { skewX: [0, 0, -6, 5, -2, 0], scale: [1, 1.2, 1.1, 1, 1.02, 1] },
    { duration: 1, ease: "easeOut" },
  );
  // Tourbillon : il tourne avec la toupie et se resserre pendant que les traits
  // glissent le long des bras vers le centre, puis s'efface quand elle ralentit.
  animate(
    swirl,
    { rotate: [0, 360], scale: [1.3, 0.8], opacity: [0, 0.6, 0.6, 0] },
    {
      duration: 1,
      ease: [0.33, 1, 0.68, 1],
      opacity: { duration: 1, times: [0, 0.12, 0.6, 1], ease: "linear" },
    },
  );
  animate(
    swirl.querySelectorAll("path"),
    { strokeDashoffset: [0, -20] },
    { duration: 1, ease: [0.33, 1, 0.68, 1] },
  );
  return spin;
}

function burst(x, y) {
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("span");
    particle.className = "cta-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    document.body.append(particle);

    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
    const distance = 28 + Math.random() * 30;
    animate(
      particle,
      {
        x: [0, Math.cos(angle) * distance],
        y: [0, Math.sin(angle) * distance],
        rotate: [0, Math.random() * 360],
        scale: [1, 0.2],
        opacity: [1, 1, 0],
      },
      {
        duration: 0.7 + Math.random() * 0.3,
        ease: [0.16, 1, 0.3, 1],
        opacity: { times: [0, 0.5, 1] },
      },
    ).then(() => particle.remove());
  }
}

function setupSpin(trigger, target, swirlContainer) {
  if (!trigger || !target) return;
  const swirl = createSwirl(swirlContainer);
  let spinning = null;
  trigger.addEventListener("pointerenter", () => {
    // Une seule fois par survol : pas de relance tant que la toupie tourne.
    if (reducedMotion.matches || spinning) return;
    spinning = spinTop(target, swirl);
    spinning.then(() => {
      spinning = null;
    });
  });
}

// Bouton avec une icône "+" (.cta-icon > .cta-plus) : aussi utilisé par le hero.
export function setupCtaSpin(cta) {
  const ctaIcon = cta?.querySelector(".cta-icon");
  setupSpin(cta, ctaIcon?.querySelector(".cta-plus"), ctaIcon);
}

setupCtaSpin(document.querySelector(".header .button--primary"));

const themeToggle = document.querySelector(".header .theme-toggle");
setupSpin(themeToggle, themeToggle?.querySelector(".theme-icon"), themeToggle);

// Tous les boutons du site, y compris ceux affichés plus tard par le routeur.
document.addEventListener("click", (event) => {
  const button = event.target.closest("button, .button, .nav-link");
  if (!button || reducedMotion.matches) return;
  // Au clavier, il n'y a pas de position de pointeur : on part du centre du bouton.
  if (event.detail === 0) {
    const { left, top, width, height } = button.getBoundingClientRect();
    burst(left + width / 2, top + height / 2);
  } else {
    burst(event.clientX, event.clientY);
  }
});
