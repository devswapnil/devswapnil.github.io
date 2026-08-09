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

  // Theme toggle. The initial theme is applied by an inline script in <head> so
  // the stored choice never flashes; this only handles switching afterwards.
  const themeToggle = document.querySelector('[data-theme-toggle]');

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      /* Storage unavailable (private mode); the theme still applies for this page. */
    }
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal. Elements start hidden via `html.js .reveal` in CSS, so if
  // anything here fails to run they must still end up visible — hence the
  // unconditional fallback that marks everything shown.
  const revealTargets = Array.from(document.querySelectorAll('.reveal'));

  const showAll = (els) => els.forEach((el) => el.classList.add('is-visible'));

  if (revealTargets.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      showAll(revealTargets);
    } else {
      // Stagger siblings so groups (skill cards, recognition columns) cascade
      // rather than snapping in together.
      revealTargets.forEach((el) => {
        const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
        const index = siblings.indexOf(el);
        el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 60}ms`);
      });

      const pending = new Set(revealTargets);

      const show = (el) => {
        el.classList.add('is-visible');
        pending.delete(el);
        revealObserver.unobserve(el);
      };

      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) show(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      );

      revealTargets.forEach((el) => revealObserver.observe(el));

      // IntersectionObserver is not guaranteed to fire for elements that pass
      // through the viewport between frames, so a fast jump (Cmd+End, dragging
      // the scrollbar, a smooth-scrolled anchor) can otherwise strand content
      // at opacity 0. Sweep anything at or above the viewport bottom.
      let ticking = false;

      const sweep = () => {
        ticking = false;
        if (pending.size === 0) {
          window.removeEventListener('scroll', onScroll);
          return;
        }
        const limit = window.innerHeight;
        Array.from(pending).forEach((el) => {
          if (el.getBoundingClientRect().top < limit) show(el);
        });
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(sweep);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('load', sweep);
      sweep();
    }
  }

  // Hero entrance, staggered on load rather than by the observer.
  const heroStagger = Array.from(document.querySelectorAll('.hero__stagger'));

  if (heroStagger.length > 0) {
    if (prefersReducedMotion) {
      showAll(heroStagger);
    } else {
      heroStagger.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${i * 60}ms`);
      });
      requestAnimationFrame(() => requestAnimationFrame(() => showAll(heroStagger)));
    }
  }

  // Nav condenses once the page scrolls. A sentinel avoids a scroll handler.
  const nav = document.querySelector('.nav');

  if (nav && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none;';
    document.body.prepend(sentinel);

    const navObserver = new IntersectionObserver(
      ([entry]) => nav.classList.toggle('is-scrolled', !entry.isIntersecting),
      { threshold: 0 }
    );

    navObserver.observe(sentinel);
  }

  // Count-up on the stats strip. Values are already in the markup, so this is
  // purely decorative and is skipped entirely when motion is reduced.
  const statValues = Array.from(document.querySelectorAll('[data-count-to]'));

  const runCountUp = (el) => {
    const target = Number(el.getAttribute('data-count-to'));
    const suffix = el.getAttribute('data-suffix') || '';
    if (Number.isNaN(target)) return;

    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if (!prefersReducedMotion && statValues.length > 0 && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCountUp(entry.target);
          statObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    statValues.forEach((el) => statObserver.observe(el));
  }

  const mediumFeedContainer = document.querySelector('[data-medium-feed]');

  const renderMediumError = (container, message) => {
    if (!container) return;
    container.innerHTML = '';
    const emptyState = document.createElement('div');
    emptyState.className = 'blog-list__empty';
    emptyState.textContent = message;
    container.appendChild(emptyState);
  };

  const buildArticleCard = (article) => {
    const card = document.createElement('article');
    card.className = 'blog-card';

    const title = document.createElement('h3');
    title.className = 'blog-card__title';

    const link = document.createElement('a');
    link.href = article.link;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = article.title;
    title.appendChild(link);

    const meta = document.createElement('div');
    meta.className = 'blog-card__meta';
    meta.textContent = [article.pubDate, article.readingTime].filter(Boolean).join(' · ');

    const excerpt = document.createElement('p');
    excerpt.className = 'blog-card__excerpt';
    excerpt.textContent = article.excerpt;

    const footer = document.createElement('div');
    footer.className = 'blog-card__footer';

    const footerLink = document.createElement('a');
    footerLink.className = 'blog-card__link';
    footerLink.href = article.link;
    footerLink.target = '_blank';
    footerLink.rel = 'noopener';
    footerLink.textContent = 'Read on Medium';

    footer.appendChild(footerLink);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(excerpt);
    card.appendChild(footer);

    return card;
  };

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  };

  const estimateReadingTime = (wordCount) => {
    const wordsPerMinute = 220;
    const minutes = Math.max(1, Math.round(wordCount / wordsPerMinute));
    return `${minutes} min read`;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadMediumFeed = async (container) => {
    if (!container) return;

    const status = container.querySelector('[data-status]');
    const handle = container.getAttribute('data-medium-handle');
    const maxItems = Number(container.getAttribute('data-medium-limit')) || 6;

    if (!handle) {
      renderMediumError(container, 'Medium handle is not configured.');
      return;
    }

    try {
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${encodeURIComponent(handle)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const payload = await response.json();

      if (payload.status && payload.status !== 'ok') {
        throw new Error(payload.message || 'Feed unavailable');
      }

      const items = Array.isArray(payload.items) ? payload.items.slice(0, maxItems) : [];

      container.innerHTML = '';

      if (items.length === 0) {
        renderMediumError(container, 'No posts found yet — check back soon.');
        return;
      }

      items.forEach((item) => {
        const text = stripHtml(item.description || '');
        const excerpt = text.length > 180 ? `${text.slice(0, 177)}…` : text;
        const words = text.split(/\s+/).filter(Boolean).length;

        const card = buildArticleCard({
          title: item.title || 'Untitled',
          link: item.link,
          pubDate: formatDate(item.pubDate),
          readingTime: estimateReadingTime(words),
          excerpt,
        });

        container.appendChild(card);
      });
    } catch (error) {
      renderMediumError(
        container,
        'Unable to load Medium posts right now. Please visit Medium to read the latest updates.'
      );
    } finally {
      if (status && status.parentElement) {
        status.parentElement.removeChild(status);
      }
    }
  };

  if (mediumFeedContainer) {
    loadMediumFeed(mediumFeedContainer);
  }
})();
