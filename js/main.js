(function () {
  const navToggle = document.querySelector('.nav__toggle');
  const navLinks = document.querySelector('.nav__links');
  const navAnchors = Array.from(document.querySelectorAll('.nav__links a'));
  const yearEl = document.getElementById('current-year');

  const toggleNav = () => {
    if (!navToggle || !navLinks) return;
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('is-open');
  };

  if (navToggle) {
    navToggle.addEventListener('click', toggleNav);
  }

  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', () => {
      if (!navLinks) return;
      navLinks.classList.remove('is-open');
      if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const sections = navAnchors
    .map((anchor) => {
      const id = anchor.getAttribute('href');
      if (!id || !id.startsWith('#')) return null;
      const el = document.querySelector(id);
      return el ? { anchor, el } : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = sections.find((item) => item.el === entry.target);
          if (!section) return;
          if (entry.isIntersecting) {
            navAnchors.forEach((a) => a.classList.remove('active'));
            section.anchor.classList.add('active');
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sections.forEach(({ el }) => observer.observe(el));
  }

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
