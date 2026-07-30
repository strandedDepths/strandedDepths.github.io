// Shared behaviour across all pages: mark the current nav link.
(function () {
  const current = document.body.dataset.page;
  if (!current) return;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    if (link.dataset.page === current) {
      link.setAttribute("aria-current", "page");
    }
  });
})();

// the page has actually scrolled, so it doesn't sit invisibly over the scene.
(function () {
  const header = document.getElementById("site-header");
  if (!header) return;

  function onScroll() {
    header.classList.toggle("is-stuck", window.scrollY > 8);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

//to prevent bot from spamming email...
document.getElementById("email-btn").addEventListener("click", function() {
  const user = "hmosser.p"; // id
  const domain = "gmail.com"; // domain
  window.location.href = `mailto:${user}@${domain}`;
});
