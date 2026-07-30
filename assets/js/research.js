import { publications } from "./data/publications.js";

// ---- render the tablets --------------------------------------------------------

const grid = document.getElementById("archive-grid");
if (grid) {
  grid.innerHTML = publications
    .map((p, i) => {
      const ribbon = p.latest ? '<span class="paper-tablet__ribbon">Latest</span>' : "";
      const cls = p.latest ? "paper-tablet paper-tablet--latest" : "paper-tablet";
      return `
      <button class="${cls}" type="button" data-paper-index="${i}">
        ${ribbon}
        <span class="venue">${p.venue}</span>
        <h3>${p.title}</h3>
        <p class="abstract">${p.abstract}</p>
      </button>`;
    })
    .join("");
}

// ---- clicking a tablet opens the full paper in a modal --------------------------

const modal = document.getElementById("paper-modal");
const modalVenue = document.getElementById("paper-modal-venue");
const modalTitle = document.getElementById("paper-modal-title");
const modalAbstract = document.getElementById("paper-modal-abstract");
const modalCode = document.getElementById("paper-modal-code");
const modalPaper = document.getElementById("paper-modal-paper");
let lastFocused = null;

function openPaper(index) {
  const p = publications[index];
  if (!p || !modal) return;
  modalVenue.textContent = p.venue;
  modalTitle.textContent = p.title;
  modalAbstract.textContent = p.abstract;
  modalCode.href = p.code;
  modalPaper.href = p.paper;
  lastFocused = document.activeElement;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.querySelector(".paper-modal__close").focus();
}

function closePaper() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

if (grid) {
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-paper-index]");
    if (btn) openPaper(Number(btn.dataset.paperIndex));
  });
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closePaper();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closePaper();
  });
}

// ---- the castle: scroll zooms toward the gate, the doors swing open, then a
//      wash of warm light carries the scroll through into the archive --------

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const track = document.getElementById("castle-track");
const rig = document.getElementById("castle-rig");
const gate = document.getElementById("castle-gate");
const scene = document.getElementById("castle-scene");

if (track && rig && gate && scene) {
  let ticking1 = false;

  function updateCastle() {
    const rect = track.getBoundingClientRect();
    const trackHeight = track.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = trackHeight > 0 ? clamp(scrolled / trackHeight, 0, 1) : 0;

    const zoom = 1 + Math.min(progress / 0.72, 1) ** 1.4 * 2.1;
    const doorProgress = smoothstep(0.3, 0.62, progress);
    const doorAngle = doorProgress * 100;
    const glow = doorProgress;
    const flash = smoothstep(0.8, 0.98, progress);

    rig.style.setProperty("--castle-zoom", zoom.toFixed(3));
    gate.style.setProperty("--door-angle", `${doorAngle.toFixed(1)}deg`);
    gate.style.setProperty("--gate-glow", glow.toFixed(3));
    scene.style.setProperty("--flash", flash.toFixed(3));

    ticking1 = false;
  }

  function onScroll1() {
    if (!ticking1) {
      ticking1 = true;
      requestAnimationFrame(updateCastle);
    }
  }

  window.addEventListener("scroll", onScroll1, { passive: true });
  window.addEventListener("resize", onScroll1);
  updateCastle();

  if (reduceMotion) {
    // Skip straight to "inside, gates open" rather than relying on a scroll-driven reveal.
    rig.style.setProperty("--castle-zoom", "3.1");
    gate.style.setProperty("--door-angle", "100deg");
    gate.style.setProperty("--gate-glow", "1");
  }
}

// ---- the deeper into the archive, the colder it gets ---------------------------

const interior = document.getElementById("archive-interior");
const tempEl = document.getElementById("temp-value");
const MIN_C = -2;
const MAX_C = -28;
let ticking2 = false;

function updateFrost() {
  if (!interior) return;
  const rect = interior.getBoundingClientRect();
  const span = interior.offsetHeight - window.innerHeight;
  const scrolled = -rect.top;
  const fraction = span > 0 ? clamp(scrolled / span, 0, 1) : 0;
  document.documentElement.style.setProperty("--frost", (fraction * 0.85).toFixed(3));
  // the falling snow belongs to the outdoor approach — fade it out well before
  // the frozen floor and the old door, so it doesn't drift over indoor ground
  const snowFade = 1 - smoothstep(0.62, 0.8, fraction);
  document.documentElement.style.setProperty("--snow-opacity", snowFade.toFixed(3));
  if (tempEl) {
    const temp = Math.round(MIN_C + (MAX_C - MIN_C) * fraction);
    tempEl.textContent = `${temp}\u00A0°C`;
  }
  ticking2 = false;
}

function onScroll2() {
  if (!ticking2) {
    ticking2 = true;
    requestAnimationFrame(updateFrost);
  }
}

window.addEventListener("scroll", onScroll2, { passive: true });
window.addEventListener("resize", onScroll2);
updateFrost();
if (reduceMotion) {
  document.documentElement.style.setProperty("--frost", "0.3");
}
