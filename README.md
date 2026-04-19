# Customer Feedback Widget

An embeddable feedback widget that lets customers click on any element of a web page to leave a comment — including an automatic screenshot. Feedback lands in the admin dashboard with element selector, URL, and screenshot attached.

---

## Quick Start (CDN)

Add one `<script>` tag to your HTML — no build step required:

```html
<script
  src="https://your-app.com/widget.js"
  data-token="YOUR_PROJECT_TOKEN"
></script>
```

Replace `https://your-app.com` with the URL where this Next.js app is hosted, and `YOUR_PROJECT_TOKEN` with the preview token from the admin dashboard.

---

## Live Demo

Start the dev server and open `/demo` to see the widget in action without a token:

```bash
npm run dev
# open http://localhost:3000/demo
```

---

## Script Attributes

| Attribute      | Required | Description |
|----------------|----------|-------------|
| `data-token`   | Yes*     | Preview token from the admin dashboard. |
| `data-api`     | No       | Base URL of the feedback API. Defaults to the same origin as the script. Use this when the script is hosted on a CDN but the API is on a different domain. |
| `data-session` | No       | Custom session ID. Auto-generated if omitted. Use to group feedback from the same reviewer across multiple page loads. |
| `data-demo`    | No       | Set to `"true"` to enable demo mode — the widget renders fully but no API calls are made. Useful for screenshots, onboarding flows, or local development. |

\* `data-token` is not required when `data-demo="true"`.

---

## Self-Hosting

The widget script is a static file served from the Next.js `public/` directory. No additional CDN setup is needed — the Next.js server sets `Access-Control-Allow-Origin: *` so the script can be embedded on any domain.

### Environment variables

Create a `.env.local` file:

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

### Database migrations

```bash
# Apply all pending migrations
psql $DATABASE_URL -f migrations/001_initial.sql
psql $DATABASE_URL -f migrations/002_add_status.sql
```

### Start the server

```bash
npm install
npm run dev     # development
npm run build && npm start  # production
```

---

## Admin Dashboard

Access the admin at `/admin`. Log in with the credentials configured via the auth setup. The dashboard shows all feedback submissions with:

- Status (`open` / `in_review` / `done`)
- Element selector and page URL
- Screenshot preview
- Comment text
- Session grouping

---

## API Reference

### POST `/api/feedback`

Submit a feedback annotation.

**Headers:** `x-preview-token: <token>`

```json
{
  "page_url": "https://example.com/pricing",
  "css_selector": "button#cta-primary",
  "comment": "Change the button color to green",
  "screenshot_base64": "data:image/png;base64,...",
  "session_id": "s-abc123"
}
```

### POST `/api/feedback/confirm`

Confirm (close) a feedback session.

**Headers:** `x-preview-token: <token>`

```json
{ "session_id": "s-abc123" }
```

### PATCH `/api/feedback/[id]`

Update feedback status or assignee (admin only, requires session cookie).

```json
{ "status": "in_review", "assigneeId": "user-uuid" }
```

---

## Widget JavaScript API

The widget exposes a minimal global API for programmatic control:

```js
// Re-initialize the widget (e.g. after a SPA route change)
window.FeedbackWidget.init();
```

---

## Browser Compatibility

The widget is plain ES5 with no external dependencies at runtime. `html2canvas` is loaded on-demand from jsDelivr for screenshots. Supports all modern browsers (Chrome, Firefox, Safari, Edge).
