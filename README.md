# devswapnil.github.io

Personal site for **Swapnil Mishra** — Vice President, Lead Software Engineer at J.P. Morgan,
Bengaluru. Live at <https://devswapnil.github.io/>.

A single-page professional profile: experience, skills, recognition, education, and a live feed
of recent Medium articles.

## Stack

No build step, no dependencies. Plain HTML, CSS and vanilla JavaScript, served directly by
GitHub Pages from the `master` branch.

```
index.html          the whole page
css/main.css        design tokens + all component styles
js/main.js          nav, scroll-spy, theme toggle, stat counters, Medium feed
images/             favicon assets
```

## Local development

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Notes

- **Theming** — dark by default with a light theme, driven by CSS custom properties. The
  choice is stored in `localStorage` and applied by an inline script in `<head>` so the stored
  theme never flashes on load. Falls back to `prefers-color-scheme`.
- **Medium feed** — fetched client-side from `api.rss2json.com` against the handle in the
  `data-medium-handle` attribute on the writing section. Fails gracefully to a message if the
  feed is unreachable.
- **Content** — every factual claim on the page (roles, dates, figures, awards) comes from the
  LinkedIn profile. Keep them in sync.
