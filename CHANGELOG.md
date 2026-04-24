# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-24

First stable release.

### Added

- **Embeddable widget** (`public/widget.js`) — plain ES5 script, no build step required.
  Activated via `<script data-token="...">` tag; renders a "Feedback geben" button in the
  bottom-right corner.
- **Element picker** — hover any element on the host page to highlight and select it;
  CSS selector is captured automatically.
- **Screenshot capture** — on-demand screenshot via `html2canvas` (loaded from jsDelivr CDN);
  uploaded to S3 and linked to the submission.
- **Feedback form** — textarea dialog attached to the selected element; submits
  `page_url`, `css_selector`, `comment`, `screenshot_base64`, and `session_id`.
- **Demo mode** (`data-demo="true"`) — widget renders and accepts input without making
  any API calls. Useful for onboarding, screenshots, and local development.
- **Cross-origin support** (`data-api` attribute) — script can be served from a CDN while
  the API lives on a different domain.
- **Session grouping** (`data-session` attribute) — group feedback from the same reviewer
  across multiple page loads.
- **Admin dashboard** (`/admin`) — view and triage all feedback submissions with
  status management, assignee tracking, and project grouping.
- **Feedback status workflow** — three-state lifecycle: `open` → `in_review` → `done`.
- **Assignee field** — assign feedback items to team members; stored in `metadata` JSONB column.
- **Filter bar** — client-side filtering by project, status, and sort order (newest/oldest first).
- **Stat strip** — live KPI tiles showing open / in-review / done counts.
- **Screenshot lightbox** — click thumbnail to open full-size image in a `<dialog>` overlay.
- **Feedback trend charts** — analytics page in the admin dashboard showing submission
  volume over time via Recharts.
- **Preview pages** — static preview support for embedding the widget in customer demos
  (e.g. plenergy-compass).
- **Token authentication** — preview tokens signed with `PREVIEW_TOKEN_SECRET`; validated
  server-side using timing-safe comparison.
- **Database migrations** — PostgreSQL schema in `migrations/` with initial table and
  status-column backfill.
- **Next.js 14 backend** — App Router, server components, route handlers, and
  `better-auth` session management.
- **S3 screenshot storage** — screenshots uploaded via `@aws-sdk/lib-storage`
  multipart upload.

### Security

- Timing-safe token comparison using `crypto.timingSafeEqual` (prevents length-oracle
  and timing-side-channel attacks on preview tokens).
- SQL interval injection prevention in analytics time-bucket queries.
- Next.js upgraded to 14.2.35 (patches CVE GHSA-f82v-jwr5-mffw authorization bypass
  and GHSA-ggv3-7p47-pfv8 HTTP request smuggling).
- `httpOnly` session cookies for admin authentication; PATCH routes guarded by
  server-side session check.

---

## [Unreleased]

_Nothing yet._
