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

    if (article.image) {
      const media = document.createElement('div');
      media.className = 'blog-card__media';

      const image = document.createElement('img');
      image.className = 'blog-card__image';
      image.src = article.image;
      image.loading = 'lazy';
      image.alt = article.title;

      media.appendChild(image);
      card.appendChild(media);
    }

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

  const ensureAbsoluteHttpUrl = (value) => {
    if (typeof value !== 'string') return '';
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return '';
  };

  const extractImageFromHtml = (html) => {
    if (typeof html !== 'string') return '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? ensureAbsoluteHttpUrl(match[1]) : '';
  };

  const extractArticleImage = (item) => {
    if (!item || typeof item !== 'object') return '';

    const candidates = [
      ensureAbsoluteHttpUrl(item.thumbnail),
      item.enclosure && ensureAbsoluteHttpUrl(item.enclosure.link || item.enclosure.url),
      extractImageFromHtml(item.content),
      extractImageFromHtml(item.description),
    ].filter(Boolean);

    return candidates[0] || '';
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
          image: extractArticleImage(item),
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
