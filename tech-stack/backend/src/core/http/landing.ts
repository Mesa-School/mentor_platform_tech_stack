import type { RequestHandler } from 'express'
import { config, docsAuthEnabled } from '../config/index.js'
import { service } from '../service.js'
import { pingDb } from '../db/index.js'
import { describeDatabaseTarget } from '../db/connection-string.js'
import { registeredSlices } from '../../shared/slices.js'

/**
 * Three operator-facing surfaces, all server-rendered with zero JavaScript and zero external
 * assets beyond a webfont:
 *
 *   GET /         public landing — "the API is up", and where to go next
 *   GET /status   public JSON — for uptime monitors; no secrets, no infrastructure detail
 *   GET /health   Basic-auth gated dashboard — dependency latencies and configuration state
 *
 * The theme is the shadcn/ui neutral palette expressed as CSS custom properties, so it matches
 * the frontend and follows the viewer's light/dark preference. The real branded landing page
 * belongs to the frontend; this one is for whoever is holding the pager.
 */

const startedAt = Date.now()

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  if (s < 86_400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86_400)}d ${Math.floor((s % 86_400) / 3600)}h`
}

/** Escape anything that could originate outside the process before it reaches the HTML. */
function esc(v: unknown): string {
  return String(v).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

type Tone = 'ok' | 'warn' | 'bad' | 'muted'

function badge(tone: Tone, label: string): string {
  return `<span class="badge badge-${tone}">${esc(label)}</span>`
}

function row(tone: Tone, name: string, sub: string, right: string): string {
  return `<div class="row">
  <span class="row-dot dot-${tone}"></span>
  <div class="row-main">
    <div class="row-name">${esc(name)}</div>
    ${sub ? `<div class="row-sub">${sub}</div>` : ''}
  </div>
  ${right}
</div>`
}

function card(href: string, icon: string, title: string, sub: string): string {
  return `<a class="card" href="${href}">
  <span class="card-icon">${icon}</span>
  <span class="card-text">
    <span class="card-title">${esc(title)}</span>
    <span class="card-sub">${esc(sub)}</span>
  </span>
  ${ARROW}
</a>`
}

// ─── icons (inline; nothing loads from a CDN) ────────────────────────────────

const ARROW = `<svg class="card-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H7M12 4V9"/></svg>`
const I_SWAGGER = `<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="4" width="2" height="2" rx=".5"/><rect x="7" y="4" width="10" height="2" rx=".5"/><rect x="3" y="9" width="2" height="2" rx=".5"/><rect x="7" y="9" width="10" height="2" rx=".5"/><rect x="3" y="14" width="2" height="2" rx=".5"/><rect x="7" y="14" width="6" height="2" rx=".5"/></svg>`
const I_REDOC = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="2.5" width="9" height="15" rx="1.5"/><path d="M6 7h5M6 10h4M6 13h3"/><path d="M12.5 2.5l4 4v11"/></svg>`
const I_OPENAPI = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5L2 10l5 5M13 5l5 5-5 5"/></svg>`
const I_HEALTH = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h3.5l2-5.5 3.5 11 2.5-5.5H18"/></svg>`
const I_READY = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5L8.5 15L16 6"/></svg>`
const I_STATUS = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4.5l3 1.8"/></svg>`

// ─── shadcn/ui design tokens ─────────────────────────────────────────────────

const CSS = `
:root{
  --radius:.625rem;
  --background:oklch(1 0 0);
  --foreground:oklch(.145 0 0);
  --card:oklch(1 0 0);
  --card-foreground:oklch(.145 0 0);
  --muted:oklch(.97 0 0);
  --muted-foreground:oklch(.556 0 0);
  --border:oklch(.922 0 0);
  --input:oklch(.922 0 0);
  --ring:oklch(.708 0 0);
  --primary:oklch(.205 0 0);
  --primary-foreground:oklch(.985 0 0);
  --success:oklch(.62 .16 152);
  --success-soft:oklch(.62 .16 152 / .12);
  --warning:oklch(.72 .16 76);
  --warning-soft:oklch(.72 .16 76 / .14);
  --destructive:oklch(.577 .245 27.325);
  --destructive-soft:oklch(.577 .245 27.325 / .12);
}
@media (prefers-color-scheme:dark){
  :root{
    --background:oklch(.145 0 0);
    --foreground:oklch(.985 0 0);
    --card:oklch(.205 0 0);
    --card-foreground:oklch(.985 0 0);
    --muted:oklch(.269 0 0);
    --muted-foreground:oklch(.708 0 0);
    --border:oklch(1 0 0 / 10%);
    --input:oklch(1 0 0 / 15%);
    --ring:oklch(.556 0 0);
    --primary:oklch(.985 0 0);
    --primary-foreground:oklch(.205 0 0);
    --success:oklch(.72 .17 152);
    --success-soft:oklch(.72 .17 152 / .16);
    --warning:oklch(.79 .16 76);
    --warning-soft:oklch(.79 .16 76 / .16);
    --destructive:oklch(.704 .191 22.216);
    --destructive-soft:oklch(.704 .191 22.216 / .16);
  }
}
*,::before,::after{box-sizing:border-box;margin:0;padding:0}
html{color-scheme:light dark;-webkit-text-size-adjust:100%}
body{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  font-size:14px;line-height:1.5;font-feature-settings:'cv11','ss01';
  background:var(--background);color:var(--foreground);
  min-height:100dvh;display:grid;place-items:start center;
  padding:clamp(1.5rem,5vw,4rem) 1.25rem 4rem;position:relative;
}
/* soft radial wash + hairline grid, both purely decorative */
body::before{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(48rem 30rem at 50% -8%,color-mix(in oklab,var(--foreground) 7%,transparent),transparent 70%);
}
body::after{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.6;
  background-image:
    linear-gradient(color-mix(in oklab,var(--foreground) 5%,transparent) 1px,transparent 1px),
    linear-gradient(90deg,color-mix(in oklab,var(--foreground) 5%,transparent) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(ellipse 70% 50% at 50% 0%,#000 15%,transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse 70% 50% at 50% 0%,#000 15%,transparent 80%);
}
main{position:relative;z-index:1;width:100%;max-width:56rem}

/* brand */
.brand{display:flex;align-items:center;gap:.75rem;margin-bottom:2.25rem}
.mark{
  width:2.5rem;height:2.5rem;border-radius:calc(var(--radius) + 2px);flex:0 0 auto;
  background:var(--primary);color:var(--primary-foreground);
  display:grid;place-items:center;font-weight:700;font-size:.9rem;letter-spacing:-.04em;
  box-shadow:0 1px 2px oklch(0 0 0 / .12);user-select:none;
}
.brand-name{font-size:.875rem;font-weight:600;letter-spacing:-.011em}
.brand-tag{font-size:.75rem;color:var(--muted-foreground);margin-top:.05rem}

/* hero */
.eyebrow{font-size:.6875rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:.6rem}
h1{font-size:clamp(1.875rem,4.5vw,2.75rem);font-weight:600;letter-spacing:-.035em;line-height:1.08;margin-bottom:.75rem}
h1 .thin{color:var(--muted-foreground);font-weight:400}
.lede{font-size:.9375rem;color:var(--muted-foreground);max-width:52ch;line-height:1.7}

/* badges & pills */
.badge{
  display:inline-flex;align-items:center;gap:.35rem;flex:0 0 auto;
  font-size:.75rem;font-weight:500;line-height:1.3;white-space:nowrap;
  padding:.2rem .55rem;border-radius:calc(var(--radius) - .25rem);border:1px solid transparent;
}
.badge-ok{background:var(--success-soft);border-color:color-mix(in oklab,var(--success) 30%,transparent);color:var(--success)}
.badge-warn{background:var(--warning-soft);border-color:color-mix(in oklab,var(--warning) 30%,transparent);color:var(--warning)}
.badge-bad{background:var(--destructive-soft);border-color:color-mix(in oklab,var(--destructive) 30%,transparent);color:var(--destructive)}
.badge-muted{background:var(--muted);border-color:var(--border);color:var(--muted-foreground)}
.pill-row{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:1.25rem}
.pill{
  display:inline-flex;align-items:center;gap:.4rem;
  font-size:.75rem;font-weight:500;padding:.25rem .6rem;
  border-radius:999px;border:1px solid var(--border);background:var(--card);color:var(--muted-foreground);
}
.pill code,code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}

/* status dots */
.dot{width:.5rem;height:.5rem;border-radius:50%;flex:0 0 auto;display:inline-block}
.dot-ok{background:var(--success);animation:pulse 2.4s ease-in-out infinite}
.dot-warn{background:var(--warning)}
.dot-bad{background:var(--destructive)}
.dot-muted{background:var(--muted-foreground)}
@keyframes pulse{
  0%,100%{box-shadow:0 0 0 0 color-mix(in oklab,var(--success) 45%,transparent)}
  50%{box-shadow:0 0 0 .3rem transparent}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* cards */
.section-label{font-size:.6875rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted-foreground);margin:2.25rem 0 .75rem}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:.75rem}
.card{
  position:relative;display:flex;align-items:flex-start;gap:.75rem;
  padding:1rem;border:1px solid var(--border);border-radius:var(--radius);
  background:var(--card);color:var(--card-foreground);text-decoration:none;
  transition:border-color .15s,box-shadow .15s,transform .15s;
}
.card:hover{border-color:var(--ring);box-shadow:0 1px 3px oklch(0 0 0 / .08),0 8px 24px -12px oklch(0 0 0 / .25);transform:translateY(-1px)}
.card:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.card-icon{
  width:2.25rem;height:2.25rem;border-radius:calc(var(--radius) - .125rem);flex:0 0 auto;
  display:grid;place-items:center;background:var(--muted);border:1px solid var(--border);color:var(--foreground);
}
.card-icon svg{width:1.05rem;height:1.05rem}
.card-text{display:block;min-width:0}
.card-title{display:block;font-size:.875rem;font-weight:500;letter-spacing:-.006em}
.card-sub{display:block;font-size:.75rem;color:var(--muted-foreground);margin-top:.15rem}
.card-arrow{position:absolute;top:.85rem;right:.9rem;width:.85rem;height:.85rem;color:var(--muted-foreground);opacity:0;transition:opacity .15s,transform .15s}
.card:hover .card-arrow{opacity:1;transform:translate(1px,-1px)}

/* panels */
.panel{border:1px solid var(--border);border-radius:var(--radius);background:var(--card);overflow:hidden}
.panel-head{
  display:flex;align-items:center;gap:.5rem;padding:.85rem 1rem;
  border-bottom:1px solid var(--border);background:color-mix(in oklab,var(--muted) 45%,transparent);
  font-size:.6875rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-foreground);
}
.panel-body{padding:.25rem 1rem}
.row{display:flex;align-items:flex-start;gap:.65rem;padding:.7rem 0;border-top:1px solid var(--border)}
.row:first-child{border-top:none}
.row-dot{width:.4rem;height:.4rem;border-radius:50%;flex:0 0 auto;margin-top:.4rem}
.row-main{flex:1;min-width:0}
.row-name{font-size:.8125rem;font-weight:500}
.row-sub{font-size:.75rem;color:var(--muted-foreground);margin-top:.1rem;overflow-wrap:anywhere}
.empty{padding:1.5rem 0 1.75rem;text-align:center;color:var(--muted-foreground);font-size:.8125rem}
.empty code{display:inline-block;margin-top:.4rem;padding:.15rem .4rem;border:1px solid var(--border);border-radius:.35rem;background:var(--muted)}

/* footer */
footer{
  display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;
  margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--border);
  font-size:.75rem;color:var(--muted-foreground);
}
footer a{color:inherit;text-decoration:none;border-bottom:1px solid transparent}
footer a:hover{border-bottom-color:currentColor}
.sep::before{content:'\\00B7'}

/* entrance */
.rise{animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (max-width:520px){.card-arrow{display:none}}
`

const HEAD = (title: string) => `<meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"/>
<style>${CSS}</style>`

const BRAND = `<div class="brand rise">
  <div class="mark">${esc(service.monogram)}</div>
  <div>
    <div class="brand-name">${esc(service.name)}</div>
    <div class="brand-tag">Backend service &middot; REST API</div>
  </div>
</div>`

// ─── GET / — public landing ──────────────────────────────────────────────────

export const landing: RequestHandler = (_req, res) => {
  const docsCards = [
    card('/docs', I_SWAGGER, 'API Explorer', 'Interactive Swagger UI'),
    card('/redoc', I_REDOC, 'Reference', 'Redoc documentation'),
    card('/openapi.json', I_OPENAPI, 'OpenAPI 3.1', 'Download the spec'),
    card('/health', I_HEALTH, 'System Health', 'Operator dashboard'),
  ].join('')

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>${HEAD(`${service.name} API`)}</head>
<body>
<main>
  ${BRAND}

  <section class="rise" style="animation-delay:.05s">
    <div class="eyebrow">Backend service</div>
    <h1>${esc(service.name)} API <span class="thin">is running.</span></h1>
    <p class="lede">${esc(service.description)} Every success response is <code>{ data, meta? }</code> and every failure is <code>{ error }</code> &mdash; consistent enough that the client never has to special-case an endpoint.</p>
    <div class="pill-row">
      <span class="pill"><span class="dot dot-ok"></span> Operational</span>
      <span class="pill"><code>${esc(config.NODE_ENV)}</code></span>
      <span class="pill">v${esc(service.version)}</span>
      <span class="pill">&#8593; ${fmtUptime(Date.now() - startedAt)}</span>
    </div>
  </section>

  <div class="section-label rise" style="animation-delay:.1s">Documentation</div>
  <div class="grid-2 rise" style="animation-delay:.1s">${docsCards}</div>

  <div class="section-label rise" style="animation-delay:.16s">Probes</div>
  <div class="grid-2 rise" style="animation-delay:.16s">
    ${card('/status', I_STATUS, 'Status JSON', 'Machine-readable dependency check')}
    ${card('/readyz', I_READY, 'Readiness', 'Can this instance serve traffic?')}
  </div>

  <footer class="rise" style="animation-delay:.24s">
    <span>${esc(service.name)}</span>
    <span class="sep"></span>
    <a href="/healthz">/healthz</a>
    <span class="sep"></span>
    <a href="/status">/status</a>
    <span style="margin-left:auto">&copy; 2026</span>
  </footer>
</main>
</body>
</html>`)
}

// ─── GET /status — public JSON, safe for an uptime monitor ───────────────────

type Check = { status: 'ok' | 'error' | 'disabled'; latencyMs?: number }

export const statusJson: RequestHandler = async (_req, res) => {
  const checks: Record<string, Check> = {}

  const t0 = Date.now()
  try {
    await pingDb()
    checks['database'] = { status: 'ok', latencyMs: Date.now() - t0 }
  } catch {
    // The reason is logged, never returned — an error string can name the host or the driver.
    checks['database'] = { status: 'error' }
  }

  const healthy = Object.values(checks).every(c => c.status !== 'error')

  res.status(healthy ? 200 : 503).json({
    data: {
      status: healthy ? 'ok' : 'degraded',
      version: service.version,
      env: config.NODE_ENV,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      checks,
    },
  })
}

// ─── GET /health — Basic-auth gated operator dashboard ───────────────────────

export const healthDashboard: RequestHandler = async (_req, res) => {
  let dbOk = false
  let dbMs = 0
  let dbErr = ''
  const t0 = Date.now()
  try {
    await pingDb()
    dbMs = Date.now() - t0
    dbOk = true
  } catch (e) {
    dbErr = e instanceof Error ? e.message.slice(0, 120) : 'unknown error'
  }

  const allOk = dbOk
  const dbTarget = describeDatabaseTarget(config.DATABASE_URL)

  const tlsTone: Tone = config.DB_SSL === 'verify-full' ? 'ok' : config.DB_SSL === 'require' ? 'warn' : 'bad'
  const tlsSub =
    config.DB_SSL === 'verify-full'
      ? 'Encrypted and certificate verified against DB_SSL_CA'
      : config.DB_SSL === 'require'
        ? 'Encrypted, certificate <strong>not</strong> verified &mdash; set DB_SSL=verify-full with a CA bundle'
        : 'Plaintext connection &mdash; acceptable only for a local database'

  const infraRows = [
    row('ok', 'API server', 'Express 5 &middot; Node ' + esc(process.version), badge('ok', 'Operational')),
    row(
      dbOk ? 'ok' : 'bad',
      'PostgreSQL',
      dbOk ? `${esc(dbTarget)} &middot; round-trip ${dbMs}&thinsp;ms` : esc(dbErr),
      badge(dbOk ? 'ok' : 'bad', dbOk ? 'Connected' : 'Unreachable')
    ),
    row(tlsTone, 'Database TLS', tlsSub, badge(tlsTone, `DB_SSL=${esc(config.DB_SSL)}`)),
    row('ok', 'JWT auth', 'Access + rotating refresh (jose) &middot; argon2id hashing', badge('ok', 'Ready')),
    row(
      docsAuthEnabled ? 'ok' : 'warn',
      'API docs',
      docsAuthEnabled
        ? 'Swagger UI, Redoc and the spec are password-protected'
        : 'Unprotected &mdash; set DOCS_USERNAME and DOCS_PASSWORD',
      badge(docsAuthEnabled ? 'ok' : 'warn', docsAuthEnabled ? 'Protected' : 'Open')
    ),
  ].join('')

  const sliceRows = registeredSlices.length
    ? registeredSlices
        .map(s =>
          row(
            dbOk ? 'ok' : 'bad',
            s.name,
            `<code>/api/v1${esc(s.path)}</code>`,
            badge(dbOk ? 'ok' : 'bad', dbOk ? 'Mounted' : 'Degraded')
          )
        )
        .join('')
    : `<div class="empty">No feature slices registered yet.<br/>Copy <code>src/modules/_template</code> and register it in <code>src/modules/router.ts</code>.</div>`

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>${HEAD(`${service.name} — System Health`)}<meta http-equiv="refresh" content="30"/></head>
<body>
<main>
  ${BRAND}

  <section class="rise" style="animation-delay:.05s">
    <div class="eyebrow">Operations</div>
    <h1>System <span class="thin">health.</span></h1>
    <p class="lede">Live dependency status for this instance. Refreshes every 30 seconds.</p>
    <div class="pill-row">
      <span class="pill"><span class="dot dot-${allOk ? 'ok' : 'bad'}"></span> ${allOk ? 'All systems operational' : 'Degraded'}</span>
      <span class="pill"><code>${esc(config.NODE_ENV)}</code></span>
      <span class="pill">v${esc(service.version)}</span>
      <span class="pill">&#8593; ${fmtUptime(Date.now() - startedAt)}</span>
      <span class="pill">pool max ${config.DB_POOL_MAX}</span>
    </div>
  </section>

  <div class="section-label rise" style="animation-delay:.1s">Infrastructure</div>
  <div class="panel rise" style="animation-delay:.1s">
    <div class="panel-head"><span class="dot dot-${allOk ? 'ok' : 'bad'}"></span> Dependencies</div>
    <div class="panel-body">${infraRows}</div>
  </div>

  <div class="section-label rise" style="animation-delay:.16s">Feature slices (${registeredSlices.length})</div>
  <div class="panel rise" style="animation-delay:.16s">
    <div class="panel-head"><span class="dot dot-${registeredSlices.length ? (dbOk ? 'ok' : 'bad') : 'muted'}"></span> Mounted under /api/v1</div>
    <div class="panel-body">${sliceRows}</div>
  </div>

  <div class="section-label rise" style="animation-delay:.22s">Documentation &amp; probes</div>
  <div class="grid-2 rise" style="animation-delay:.22s">
    ${card('/docs', I_SWAGGER, 'API Explorer', 'Interactive Swagger UI')}
    ${card('/redoc', I_REDOC, 'Reference', 'Redoc documentation')}
    ${card('/openapi.json', I_OPENAPI, 'OpenAPI 3.1', 'Download the spec')}
    ${card('/status', I_STATUS, 'Status JSON', 'Machine-readable check')}
  </div>

  <footer class="rise" style="animation-delay:.3s">
    <span>${esc(service.name)}</span>
    <span class="sep"></span>
    <code>${esc(process.version)}</code>
    <span class="sep"></span>
    <a href="/">Landing</a>
    <span style="margin-left:auto">&copy; 2026</span>
  </footer>
</main>
</body>
</html>`)
}
