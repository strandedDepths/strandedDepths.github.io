import { news } from "./data/news.js";

// ---- render the news list -------------------------------------------------------

const newsList = document.getElementById("news-list");
if (newsList) {
  newsList.innerHTML = news
    .map(
      (item) => `
      <li>
        <span class="news-date">${item.date}</span>
        <span class="news-text">${item.text}</span>
      </li>`
    )
    .join("");
}

// Home page — particle burst around a slit's title on hover/focus.
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".slit-group").forEach((group) => {
    const canvas = group.querySelector(".slit-particles");
    const titleEl = group.querySelector(".slit-title");
    if (!canvas || !titleEl) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let rafId = null;
    let spawnId = null;
    let running = false;

    function fit() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    function spawn() {
      const titleRect = titleEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const originX = titleRect.left - canvasRect.left + titleRect.width * Math.random();
      const originY = titleRect.top - canvasRect.top + titleRect.height * 0.5;

      particles.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.9 + 0.4),
        r: Math.random() * 2 + 0.8,
        life: 0,
        maxLife: Math.random() * 40 + 40,
      });
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const t = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 154, 90, ${alpha})`;
        ctx.shadowColor = "rgba(255, 122, 69, 0.8)";
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      particles = particles.filter((p) => p.life < p.maxLife);
      if (running || particles.length) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function start() {
      if (reduceMotion || running) return;
      running = true;
      fit();
      spawnId = setInterval(spawn, 90);
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      clearInterval(spawnId);
    }

    group.addEventListener("mouseenter", start);
    group.addEventListener("focus", start);
    group.addEventListener("mouseleave", stop);
    group.addEventListener("blur", stop);
    window.addEventListener("resize", fit);
  });
})();
