// Research page — falling snow over the frozen ruins.
(function () {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let width, height, flakes;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeFlakes() {
    const count = Math.round((width * height) / 14000);
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      fall: Math.random() * 0.5 + 0.25,
      sway: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.35,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const f of flakes) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 251, 255, ${f.alpha})`;
      ctx.fill();

      if (!reduceMotion) {
        f.y += f.fall;
        f.x += Math.sin(f.y * 0.02 + f.phase) * f.sway * 0.05;
        if (f.y > height + 4) {
          f.y = -4;
          f.x = Math.random() * width;
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  makeFlakes();
  draw();

  window.addEventListener("resize", () => {
    resize();
    makeFlakes();
    if (reduceMotion) draw();
  });
})();
