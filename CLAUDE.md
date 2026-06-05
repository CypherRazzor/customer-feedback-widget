# CLAUDE.md — Arbeitsregeln für Agenten in diesem Repo

> Verbindlich für alle Agenten, die in diesem Repo arbeiten. Quelle der Wahrheit liegt unter
> `~/deploy/` auf dem eadu-Host (`REPO_GOVERNANCE.md`, `COOLIFY_PLAYBOOK.md`, `REPO_REGISTRY.md`).

## Deployment (Coolify — verbindlich)

Deployt wird über **Coolify v4.1.1**, API-Basis `https://coruscant.digitalesgeschaeft.de/api/v1`
(Bearer `COOLIFY_API_TOKEN`). Deploy **immer** über den self-hosted Runner `eadu`
(Coolify-API ist für Cloud-Runner IP-gesperrt). Vollständiges Playbook:
`~/deploy/COOLIFY_PLAYBOOK.md` auf dem eadu-Host.

**Harte Regeln:**
1. Kein UI-/Browser-Login gegen Coolify — nur API/Webhook.
2. App über feste **UUID** ansprechen (siehe Playbook §4), nie per Namens-Match.
3. Routing nur über **FQDN-Feld + Coolify-Custom-Labels** — nie den `coolify-proxy`
   von Hand patchen (wird bei jedem Redeploy überschrieben → 404).
4. **PR-Previews:** alle Secrets brauchen `is_preview`-Variante (v. a. `POSTGRES_PASSWORD`)
   — sonst Preview-DB-Crash-Loop. Geschlossener PR → Preview per API löschen, nie `docker rm`.
5. **Health-Gate nach jedem Deploy:** Deploy-Status `finished` **und** FQDN liefert 2xx/3xx.
   404/5xx = Fehlschlag, nicht „bekannt" durchwinken.
6. **Secrets nie raten/hardcoden:** über `~/deploy/secret-ensure.sh <project> <env> <KEY>`
   holen (erzeugt + speichert idempotent in Vaultwarden-Collection des Projekts).

API-Referenz: `~/deploy/COOLIFY_API_4.1.2.md`. Secret-Self-Service: `~/deploy/SECRET_SELF_SERVICE.md`.

## Repository-Disziplin (verbindlich)

1. **Kein neues Repo anlegen.** Arbeite via **Branch + PR im bestehenden Repo**. Braucht es
   wirklich ein neues Repo → Issue mit Begründung an den Owner, nicht selbst `gh repo create`.
2. **Ein Repo = ein Thema.** Keine Themen mischen (SaaS ≠ Tenant-Portal ≠ Marketing-Website).
3. **Fix/Utility/Experiment ist NIE ein eigenes Repo** — Branch im betroffenen Repo.
4. **Kunde = Config, kein Fork.** Portal-Instanz pro Kunde = `customer.config.json` + Secrets +
   eigenes Coolify-Project, kein kopiertes Repo.
5. **Naming:** `kebab-case`, `<subjekt>-<typ>`. Jedes Repo steht in `~/deploy/REPO_REGISTRY.md`.

Regeln vollständig: `~/deploy/REPO_GOVERNANCE.md`.

Deploy-Ablauf, Capability-Matrix (was die API kann/nicht kann) und UUID-Mapping:
siehe `~/deploy/COOLIFY_PLAYBOOK.md`.
