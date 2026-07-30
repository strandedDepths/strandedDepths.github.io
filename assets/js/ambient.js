// Ambient drifting particulate — a quiet underwater atmosphere behind every page.
(function () {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let width, height, particles;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeParticles() {
    const count = Math.round((width * height) / 32000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      speed: Math.random() * 0.15 + 0.03,
      drift: (Math.random() - 0.5) * 0.12,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.82 ? "coral" : "bio",
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle =
        p.hue === "coral"
          ? `rgba(255, 122, 69, ${p.alpha})`
          : `rgba(110, 231, 192, ${p.alpha})`;
      ctx.fill();

      if (!reduceMotion) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  makeParticles();
  draw();

  window.addEventListener("resize", () => {
    resize();
    makeParticles();
    if (reduceMotion) draw();
  });
})();
