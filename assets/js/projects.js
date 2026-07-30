import { projects } from "./data/projects.js";

// ---- render the ropes, two flags per line ---------------------------------------

const lines = document.getElementById("quest-lines");

function ropeSvg() {
  return `
    <svg class="quest-line__rope" viewBox="0 0 1000 130" preserveAspectRatio="none" aria-hidden="true">
      <path class="rope-shadow" d="M0,26 Q500,124 1000,26" fill="none" stroke="#0d0705" stroke-width="20" stroke-linecap="round" opacity="0.45"/>
      <path class="rope-base" d="M0,22 Q500,120 1000,22" fill="none" stroke="#3a2814" stroke-width="16" stroke-linecap="round"/>
      <path class="rope-mid" d="M0,22 Q500,120 1000,22" fill="none" stroke="#5c4020" stroke-width="9" stroke-linecap="round"/>
      <path class="rope-twist" d="M0,22 Q500,120 1000,22" fill="none" stroke="#8a6633" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="7 11"/>
      <path class="rope-highlight" d="M0,17 Q500,113 1000,17" fill="none" stroke="#d1a862" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    </svg>`;
}

function flagMarkup(p, index) {
  return `
    <div class="quest-flag-anchor">
      <div class="quest-flag-wrap">
        <span class="quest-flag-pin" aria-hidden="true"></span>
        <button class="quest-banner" type="button" data-project-index="${index}">
          <span class="date">${p.category}</span>
          <h3>${p.title}</h3>
          <p class="description">${p.description}</p>
        </button>
      </div>
    </div>`;
}

if (lines) {
  let html = "";
  for (let i = 0; i < projects.length; i += 2) {
    const pair = projects.slice(i, i + 2);
    html += `
      <div class="quest-line">
        ${ropeSvg()}
        <div class="quest-flags">
          ${pair.map((p, j) => flagMarkup(p, i + j)).join("")}
        </div>
      </div>`;
  }
  lines.innerHTML = html;
}

// ---- clicking a banner opens the full project in a modal ------------------------

const modal = document.getElementById("paper-modal");
const modalVenue = document.getElementById("paper-modal-venue");
const modalTitle = document.getElementById("paper-modal-title");
const modalAbstract = document.getElementById("paper-modal-abstract");
const modalRepo = document.getElementById("paper-modal-repo");
const modalDocs = document.getElementById("paper-modal-docs");
let lastFocused = null;

function openProject(index) {
  const p = projects[index];
  if (!p || !modal) return;
  modalVenue.textContent = p.category;
  modalTitle.textContent = p.title;
  modalAbstract.textContent = p.description;
  modalRepo.href = p.repo;
  modalDocs.href = p.docs;
  lastFocused = document.activeElement;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.querySelector(".paper-modal__close").focus();
}

function closeProject() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

if (lines) {
  lines.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-project-index]");
    if (btn) openProject(Number(btn.dataset.projectIndex));
  });
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeProject();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeProject();
  });
}
