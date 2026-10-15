import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import express, { type Express, type RequestHandler } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { config, docsAuthEnabled, isProduction } from '../config/index.js'
import { service } from '../service.js'
import { logger } from '../logging/index.js'
import { basicAuth } from '../auth/basic-auth.js'
import { buildOpenApiDocument } from './registry.js'

/**
 * Mounts the generated spec plus two readers:
 *
 *   /openapi.json  the OpenAPI 3.1 document (source of truth; also feeds `openapi-typescript`
 *                  on the frontend so client types match the backend exactly)
 *   /docs          Swagger UI — interactive "try it out" explorer
 *   /redoc         Redoc — clean reference documentation
 *
 * All three sit behind HTTP Basic auth once DOCS_USERNAME and DOCS_PASSWORD are set. In
 * production without those credentials they are not mounted at all: a complete, unauthenticated
 * map of every endpoint and payload shape is reconnaissance handed to an attacker. Development
 * leaves them open so nobody has to type a password fifty times a day.
 */

// Redoc is served from the installed package, never a CDN — a compromised CDN would be running
// script on this origin.
const requireFrom = createRequire(import.meta.url)

function redocBundleDir(): string | null {
  try {
    return dirname(requireFrom.resolve('redoc/bundles/redoc.standalone.js'))
  } catch {
    return null
  }
}

/** Quote a value for a CSS `content:` property — a service name must not break out of it. */
const cssString = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const swaggerCss = `
  .swagger-ui .topbar{background:#0a0a0a;border-bottom:1px solid rgba(255,255,255,.1);padding:12px 0}
  .swagger-ui .topbar .download-url-wrapper{display:none}
  .swagger-ui .topbar-wrapper img{display:none}
  .swagger-ui .topbar-wrapper::before{
    content:${cssString(service.name)};color:#fafafa;font-weight:600;font-size:.95rem;
    padding-left:1.25rem;font-family:Inter,system-ui,sans-serif;letter-spacing:-.02em;
  }
  .swagger-ui .topbar-wrapper::after{
    content:'API Explorer';color:rgba(250,250,250,.45);font-size:.75rem;
    padding-left:.6rem;font-family:Inter,system-ui,sans-serif;
  }
  .swagger-ui .info .title{font-family:Inter,system-ui,sans-serif;letter-spacing:-.025em}
  .swagger-ui .btn.authorize{border-color:#0a0a0a;color:#0a0a0a}
  .swagger-ui .btn.authorize svg{fill:#0a0a0a}
`

/**
 * The global helmet policy is `script-src 'self'`, which is right for the API but too tight for
 * these two viewers: Redoc spawns its search worker from a blob URL, and both pull the webfont
 * from Google. Widening it *only* on the doc routes keeps the API's policy strict. These pages
 * render a static spec and sit behind Basic auth, so the extra surface is small and contained.
 */
const docsCsp = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'blob:'],
    workerSrc: ["'self'", 'blob:'],
    childSrc: ["'self'", 'blob:'],
    styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
    fontSrc: ["'self'", 'https:', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
  },
})

export function mountDocs(app: Express): void {
  const guards: RequestHandler[] = docsAuthEnabled
    ? [basicAuth(config.DOCS_USERNAME as string, config.DOCS_PASSWORD as string, `${service.name} API Docs`)]
    : []

  if (isProduction && !docsAuthEnabled) {
    logger.warn('DOCS_USERNAME/DOCS_PASSWORD are unset in production — /docs, /redoc and /openapi.json are disabled')
    return
  }
  if (!docsAuthEnabled) {
    logger.warn('API docs are unprotected — set DOCS_USERNAME and DOCS_PASSWORD to require a login')
  }

  const doc = buildOpenApiDocument()

  const bundleDir = redocBundleDir()
  if (bundleDir) {
    app.use('/vendor', express.static(bundleDir, { maxAge: '1d', immutable: true }))
  } else {
    logger.warn('redoc bundle not resolvable from node_modules — /redoc will not render')
  }

  app.get('/openapi.json', ...guards, (_req, res) => {
    res.json(doc)
  })

  app.use(
    '/docs',
    ...guards,
    docsCsp,
    swaggerUi.serve,
    swaggerUi.setup(doc, {
      customSiteTitle: `${service.name} — API Docs`,
      customCss: swaggerCss,
      swaggerOptions: {
        persistAuthorization: true, // keep the bearer token across reloads
        filter: true,
        docExpansion: 'list',
        tryItOutEnabled: true,
      },
    })
  )

  app.get('/redoc', ...guards, docsCsp, (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${service.name} &mdash; API Reference</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"/>
  <style>body{margin:0}</style>
</head>
<body>
  <redoc
    spec-url="/openapi.json"
    expand-responses="200,201"
    hide-download-button="true"
    theme='{"colors":{"primary":{"main":"#0a0a0a"}},"typography":{"fontFamily":"Inter,ui-sans-serif,system-ui,sans-serif","headings":{"fontFamily":"Inter,ui-sans-serif,system-ui,sans-serif","fontWeight":"600"}},"sidebar":{"backgroundColor":"#fafafa"}}'
  ></redoc>
  <script src="/vendor/redoc.standalone.js"></script>
</body>
</html>`)
  })
}
