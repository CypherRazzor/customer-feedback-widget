# Customer Feedback Widget

An embeddable feedback widget that lets customers click on any element of a web page to leave a comment — including an automatic screenshot. Feedback lands in the admin dashboard with element selector, URL, and screenshot attached.

---

## Quick Start (CDN — 2 minutes)

Add one `<script>` tag to your HTML before `</body>` — no build step, no dependencies:

```html
<script
  src="https://your-app.com/widget.js"
  data-token="YOUR_PREVIEW_TOKEN"
></script>
```

Replace `https://your-app.com` with the URL where this Next.js app is hosted and `YOUR_PREVIEW_TOKEN` with the preview token from your admin dashboard (`/admin`).

That's it. A **"Feedback geben"** button appears in the bottom-right corner of the page.

---

## Installation

### Self-host (recommended)

Clone the repository and run the Next.js server:

```bash
git clone https://github.com/CypherRazzor/customer-feedback-widget.git
cd customer-feedback-widget
npm install
cp .env.example .env.local   # fill in your environment variables
psql $DATABASE_URL -f migrations/001_initial.sql
psql $DATABASE_URL -f migrations/002_add_status.sql
npm run build
npm start
```

The server exposes:
- `GET /widget.js` — embeddable widget script (served with `Access-Control-Allow-Origin: *`)
- `POST /api/feedback` — submit feedback
- `/admin` — admin dashboard

### Environment Variables

Create a `.env.local` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/feedback

# AWS S3 for screenshot storage
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=feedback-screenshots
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# JWT secret for preview token signing
PREVIEW_TOKEN_SECRET=change-me-in-production

# Auth (better-auth)
BETTER_AUTH_SECRET=change-me-in-production
BETTER_AUTH_URL=http://localhost:3000
```

### Database Migrations

```bash
psql $DATABASE_URL -f migrations/001_initial.sql
psql $DATABASE_URL -f migrations/002_add_status.sql
```

---

## Script Attributes (Configuration)

| Attribute      | Required | Default | Description |
|----------------|----------|---------|-------------|
| `data-token`   | Yes*     | —       | Preview token from the admin dashboard. Authenticates submissions. |
| `data-api`     | No       | Same origin as `widget.js` | Base URL of the feedback API. Set this when the script is served from a CDN but the API lives on a different domain (e.g. `data-api="https://feedback.example.com"`). |
| `data-session` | No       | Auto-generated `s-<random>` | Custom session ID. Use this to group feedback from the same reviewer across multiple page loads. If omitted, a random session is created per page load. |
| `data-demo`    | No       | `"false"` | Set to `"true"` to enable demo mode — the widget renders and accepts input but makes **no API calls**. Useful for screenshots, onboarding, and local development without a token. |

\* `data-token` is not required when `data-demo="true"`.

---

## Integration Examples

### Vanilla JS / Plain HTML

Complete, copy-paste ready example for any HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My App</title>
</head>
<body>

  <h1>Welcome to My App</h1>
  <p>Click the feedback button to leave a comment on any element.</p>

  <!-- Feedback Widget — add just before </body> -->
  <script
    src="https://your-app.com/widget.js"
    data-token="YOUR_PREVIEW_TOKEN"
  ></script>

</body>
</html>
```

**With a custom session ID** (to group feedback from the same reviewer):

```html
<script
  src="https://your-app.com/widget.js"
  data-token="YOUR_PREVIEW_TOKEN"
  data-session="reviewer-jane-2024"
></script>
```

**When `widget.js` is on a CDN** and your API is on a different domain:

```html
<script
  src="https://cdn.example.com/widget.js"
  data-token="YOUR_PREVIEW_TOKEN"
  data-api="https://feedback.example.com"
></script>
```

---

### React

Load the widget script once on mount — no package install required.

**Option A — `useEffect` hook (recommended for SPAs)**

```jsx
// components/FeedbackWidget.jsx
import { useEffect } from 'react';

export function FeedbackWidget({ token }) {
  useEffect(() => {
    if (document.querySelector('script[data-feedback-widget]')) {
      window.FeedbackWidget?.init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://your-app.com/widget.js';
    script.setAttribute('data-token', token);
    script.setAttribute('data-feedback-widget', '');
    document.body.appendChild(script);
  }, [token]);

  return null; // Widget renders its own UI into document.body
}
```

Add it to your root layout:

```jsx
// app/layout.jsx (Next.js App Router)
import { FeedbackWidget } from '@/components/FeedbackWidget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FeedbackWidget token={process.env.NEXT_PUBLIC_FEEDBACK_TOKEN} />
      </body>
    </html>
  );
}
```

Set the token in `.env.local`:

```env
NEXT_PUBLIC_FEEDBACK_TOKEN=your_preview_token_here
```

**Option B — Next.js `Script` component (simpler)**

```jsx
// app/layout.jsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://your-app.com/widget.js"
          data-token={process.env.NEXT_PUBLIC_FEEDBACK_TOKEN}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

**Handling SPA route changes**

The widget stays active across route changes automatically. If you dynamically remove and re-add the widget component, call:

```js
window.FeedbackWidget?.init();
```

---

## Widget JavaScript API

```js
// Re-initialize the widget (e.g. after a dynamic script inject or SPA mount)
window.FeedbackWidget.init();
```

The widget is fully self-contained: it injects its own styles and DOM elements into `document.body`. No global CSS or HTML scaffolding is required.

---

## Admin Dashboard

Access the dashboard at `/admin`. Log in with your credentials. Features:

- Status management (`open` / `in_review` / `done`)
- Filter by project, status, and date
- Element selector and page URL per submission
- Screenshot preview with lightbox
- Assignee tracking
- Feedback trend charts

---

## Live Demo

Start the dev server and open `/demo` to see the widget in demo mode (no token required):

```bash
npm run dev
# open http://localhost:3000/demo
```

Or embed it anywhere with `data-demo="true"`:

```html
<script
  src="https://your-app.com/widget.js"
  data-demo="true"
></script>
```

---

## API Reference

### `POST /api/feedback`

Submit a feedback annotation.

**Header:** `x-preview-token: <token>`

```json
{
  "page_url": "https://example.com/pricing",
  "css_selector": "button#cta-primary",
  "comment": "Change the button color to green",
  "screenshot_base64": "data:image/png;base64,...",
  "session_id": "s-abc123"
}
```

**Response:** `200 OK` on success, `401` for invalid token, `400` for missing fields.

---

### `POST /api/feedback/confirm`

Close a feedback session (triggered when the reviewer clicks "Feedback abschließen").

**Header:** `x-preview-token: <token>`

```json
{ "session_id": "s-abc123" }
```

---

### `PATCH /api/feedback/[id]`

Update feedback status or assignee. Requires an authenticated admin session cookie.

```json
{ "status": "in_review", "assignee": "Jane Doe" }
```

**Status values:** `open` | `in_review` | `done`

---

## Browser Compatibility

The widget is plain ES5 with no external runtime dependencies. `html2canvas` is loaded on-demand from jsDelivr only when a user takes a screenshot. Supports all modern browsers (Chrome, Firefox, Safari, Edge).

---

## Development

```bash
npm install
npm run dev        # start dev server on http://localhost:3000
npm run build      # production build
npm run type-check # TypeScript check (no emit)
npm run lint       # ESLint
```

---

## License

MIT
