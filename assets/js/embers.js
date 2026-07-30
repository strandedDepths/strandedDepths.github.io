// Projects page — warm embers and dust drifting slowly upward in the sunset light.
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
    const count = Math.round((width * height) / 26000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.22 + 0.05,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.7 ? "gold" : "ember",
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle =
        p.hue === "gold"
          ? `rgba(255, 205, 120, ${p.alpha})`
          : `rgba(255, 138, 90, ${p.alpha})`;
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
