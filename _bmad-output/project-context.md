---
project_name: 'Coupr Landing Page'
user_name: 'Jairopolo'
date: '2026-05-21'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: 'complete'
rule_count: 90
optimized_for_llm: true
---

# Project Context for AI Agents

_Reglas y patrones críticos que los agentes de IA deben seguir al implementar código en este proyecto. Foco en detalles no obvios que podrían pasarse por alto._

---

## Technology Stack & Versions

### Frontend (entregado por CloudFront desde S3)
- **HTML5** single file (`index.html`, 1231 LOC). NO hay framework, NO hay JSX/TSX, NO hay React.
- **Tailwind CSS via CDN runtime** (`https://cdn.tailwindcss.com?plugins=forms,typography,container-queries`). Config inline en `index.html:18-41` define los design tokens.
- **Swiper.js v11** vía `cdn.jsdelivr.net/npm/swiper@11`. Init manual en `<script>` inline.
- **Vanilla JavaScript ES2017+** (async/await soportado). Todo el JS vive inline en `<script>` al final del `<body>` (líneas 1017-1229).
- **Google Fonts**: Inter + Space Grotesk + Material Symbols Outlined.

### Backend (Lambda)
- **Node.js 20.x** (runtime AWS Lambda). NO bumpear a 22.x sin verificar disponibilidad del runtime en `us-east-1`.
- **`@aws-sdk/client-ses`** — incluido en el runtime. NO agregar `package.json` ni `node_modules` a `lambdas/contact-form/`.
- **CommonJS** (`require`, `exports.handler`). NO usar `import`/ESM.

### Infraestructura
- **Terraform** `>= 1.0`. AWS Provider `hashicorp/aws ~> 5.0`. Backend `local`.
- **AWS Services**: S3, CloudFront (OAC sigv4), Route53 (zone `coupr.io`, zone ID `Z0763905XREAJRPN21B0`), API Gateway v2 HTTP, Lambda, SES, IAM, CloudWatch Logs (retention 14d), ACM.
- **Región única**: `us-east-1`. **Cuenta única**: dev `009160036798`.

### Design Tokens (de `tailwind.config` inline)
- `primary=#E1701A` (CTAs, acentos)
- `secondary=#1A4E5E` (cards oscuras, mission)
- `off-white=#F8F8F8` (bg body)
- `pure-white=#FFFFFF` (cards)
- `slate-subtle=#E5E7EB` (borders)
- `text-main=#1F2937`, `text-muted=#6B7280`
- `font.sans=Inter`, `font.display=Space Grotesk`
- `borderRadius.custom=1.5rem`

### Constraints críticos
- ACM cert obligatorio en `us-east-1` para CloudFront.
- API Gateway v2 HTTP (no REST) — elegido por costo.
- Tailwind via CDN se ejecuta en navegador — NO depender de funcionalidad post-build.

### Stack ausente (intencional)
- ❌ NO `package.json` en raíz, NO `node_modules`, NO build pipeline.
- ❌ NO TypeScript, NO testing framework, NO CI/CD, NO `.env`.

---

## Critical Implementation Rules

### Language-Specific Rules

#### HTML / CSS / Vanilla JS (frontend)
- **Editar `index.html` (landing principal) o archivos bajo `report/*.html` (sección Research gated)** para cambios de frontend. NO crear nuevos `.css` ni `.js` separados — todo el CSS/JS de cada página vive inline dentro de su `.html`. Si necesitás un tercer scope distinto a landing/research, abrir decisión de arquitectura antes.
- **URL rewriting via CloudFront Function**: `infra/terraform/cloudfront-function.js` reescribe `/foo/` → `/foo/index.html` y `/foo` → `/foo.html`. Esto habilita URLs limpias (`/report/`, `/report/consideration-moment`). Si agregás una nueva subdirectory con index, funciona automático. Si agregás una nueva ruta extensionless al root, también — sin tocar Terraform.
- **JS inline en un único `<script>`** al final del `<body>` (líneas 1017-1229). NO mover a archivos externos; el orden de ejecución actual depende de que los nodos DOM ya existan.
- **Selectores con IDs**: solo hay 4 IDs en uso (`process`, `mission`, `retailer`, `testimonials`, `demoModal`, `demoForm`). El smooth scroll handler intercepta cualquier `a[href^="#"]`.
- **Atributos del `<video>` hero son obligatorios**: `autoplay loop muted playsinline`. Sin `muted` y `playsinline`, autoplay falla en iOS/Android.
- **Tailwind classes mobile-first**: clases base = mobile, breakpoints con `md:`/`lg:`/`xl:` para tamaños mayores. Ejemplo: `text-3xl lg:text-7xl`.
- **Patrón animaciones**: agregar clase `animate-on-scroll` activa el observer. Opcionalmente `animate-delay-{1..4}`, `animate-from-left|right`, `animate-scale`. El IntersectionObserver dispara a `threshold: 0.1` con `rootMargin: '0px 0px -50px 0px'`.
- **Material Symbols**: usar `<span class="material-symbols-outlined">icon_name</span>`. Lista de iconos en uso documentada en `docs/ui-component-inventory.md`.

#### Node.js 20.x (Lambda)
- **CommonJS solamente**: `const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses")`. NUNCA `import`.
- **Export del handler**: `exports.handler = async (event) => { ... }`. El nombre `handler` está hardcoded en Terraform (`handler = "index.handler"`).
- **Event format**: API Gateway v2 HTTP usa `payload_format_version = "2.0"`. Acceso a método con `event.requestContext?.http?.method` (NO `event.httpMethod`).
- **Body parsing**: el body puede llegar como string JSON. Patrón obligatorio: `typeof event.body === "string" ? JSON.parse(event.body) : event.body`.
- **Response shape**: SIEMPRE devolver `{ statusCode, headers, body: JSON.stringify(...) }`. Si falta `body` o no es string, API Gateway responde 502.
- **Headers CORS** SIEMPRE incluidos en TODA respuesta (incluyendo errores 400/500) — definidos en const `corsHeaders` top-level.
- **NO usar `fetch` global** — Node 20 lo soporta pero el patrón del proyecto es AWS SDK v3 nativo.

### Framework-Specific Rules

#### Tailwind CDN runtime
- **NO usar `@apply` fuera de `<style type="text/tailwindcss">`**. La directiva sólo funciona dentro del bloque inline declarado en `index.html:42-385`.
- **Custom utilities** definidas en `<style type="text/tailwindcss">`: `modular-grid`, `floating-element`, `glass-panel`, `asymmetric-border`, `swiper-carousel`, `scroll-hint`, `animate-on-scroll` + variants, `hero-mockup-frame`, `modal-overlay`, `modal-container`, `modal-content`, `marquee-container`, `marquee-content`, `marquee-item`, `marquee-dot`, `feature-image-container`. Reutilizar estas en lugar de crear nuevas.
- **`tailwind.config = {...}` en script inline** debe declararse ANTES de cualquier elemento que use los tokens custom (`primary`, `secondary`, etc.). Está en líneas 18-41, correcto.
- **Plugins activos vía query string**: `?plugins=forms,typography,container-queries`. Si necesitas otro plugin, agregar al query string del CDN.

#### Swiper.js v11
- **Inicialización**: `new Swiper('.swiper-selector', { ...config })` en el `<script>` al final, DESPUÉS de cargar `swiper-bundle.min.js`.
- **Dos instancias activas**: `.swiper-carousel` (screenshots, autoplay 4s, navegación con flechas) y `.swiper-testimonials` (testimonios, autoplay 5s, sin flechas, loop).
- **Breakpoints en config**: usar el objeto `breakpoints: { 640: {...}, 768: {...}, 1024: {...}, 1400: {...} }` dentro de la config del Swiper, NO clases responsive Tailwind para slides.
- **Pagination customizada**: los bullets usan `width: 40px; height: 4px` (línea estilo barra), activo `width: 60px; background: #E1701A`. Definido en `<style>` inline.

#### AWS SDK v3 (en Lambda)
- **Instanciar el client fuera del handler** para reutilización entre invocaciones (warm starts): `const ses = new SESClient();` a nivel top-level.
- **Region implícita** desde la env var de Lambda — NO pasar `region` al constructor.
- **Comando + send pattern**: `await ses.send(new SendEmailCommand({ ... }))`. NUNCA usar el método deprecated `ses.sendEmail()`.
- **Charset siempre UTF-8** para Subject y Body (presente en código actual).

#### Terraform AWS Provider ~> 5.0
- **Naming convention** obligatorio: `${var.project_name}-<resource>` (ej: `coupr-landing-contact-form`, `coupr-landing-static-${account_id}`).
- **`default_tags`** ya configurados en `provider.tf` (Environment, Terraform, Project, Owner). NO agregar tags manualmente en cada resource — heredan automáticamente.
- **`source_code_hash`** en `aws_lambda_function`: SIEMPRE usar `data.archive_file.contact_form.output_base64sha256`. Sin esto Terraform no detecta cambios en el código.
- **`archive_file`** zipea automáticamente `lambdas/contact-form/` en cada `terraform plan/apply`. NO empaquetar manualmente.
- **CloudFront `default_root_object = "index.html"`** + custom error 403→200 `/index.html` actúa como SPA fallback. Asume comportamiento de single-page.
- **Variables sensitive**: `recipient_email` está marcada `sensitive = true`. Cualquier nueva variable con info personal debe seguir el patrón.

### Testing Rules

- **NO hay tests automatizados** ni framework instalado. Si introduces tests, requiere decisión de arquitectura previa (Vitest? Jest? Playwright?).
- **Smoke tests con `curl`** son el contrato actual (documentados en `docs/development-guide.md` y `README.md`):
  - Health check sitio: `curl -s -o /dev/null -w "%{http_code}\n" https://coupr.io` → 200
  - Preflight OPTIONS endpoint: `curl ... -X OPTIONS https://<api>/contact` → 200
  - Submit válido: `curl -X POST ... -d '{"fullName":"Test",...}'` → 200
  - Submit inválido: `curl -X POST ... -d '{"fullName":"Test"}'` → 400
- **Testing manual del frontend** vía Playwright MCP (`.playwright-mcp/` ignorado en git) — NO hacer screenshots commiteados.
- **Email real al enviar curl exitoso** — usar `recipient_email` de testing si quieres validar sin alertar al destinatario de producción. NUNCA hacer load testing al endpoint sin coordinar (dispara emails reales y eventualmente costos SES).
- **Si agregas tests Lambda offline**, simular event con `event.requestContext.http.method = 'POST'` y `event.body = JSON.stringify({...})`.

### Code Quality & Style Rules

#### Naming
- **Archivos Terraform**: `<dominio>.tf` (`main.tf` para API Gateway, `cloudfront.tf` para S3/CDN/DNS, `lambda.tf` para compute, `provider.tf` para meta, `variables.tf`, `outputs.tf`).
- **Recursos AWS**: prefijo `${var.project_name}-` (default `coupr-landing`).
- **Variables Terraform**: snake_case con `description` obligatorio y `type` declarado.
- **Assets**: `kebab-case.ext` para nuevos archivos. Los archivos existentes con espacios (`Map Landing.jpg`, etc.) son legado — al renombrar, actualizar referencias en `index.html`.
- **JS variables/functions**: camelCase (ver `openModal`, `closeModal`, `CONTACT_ENDPOINT`).
- **CSS custom classes**: kebab-case (`animate-on-scroll`, `feature-image-container`).

#### Code organization
- **HTML structure (`index.html`)** orden canónico:
  1. `<head>`: meta + favicon + Tailwind CDN + Google Fonts + Swiper CSS + `tailwind.config` script + `<style type="text/tailwindcss">` inline.
  2. `<body>`: `<nav>` → `<main>` (header + sections) → `<footer>` → `#demoModal` overlay/container → `<script src="swiper">` → `<script>` inline.
- **Lambda single-file**: `lambdas/contact-form/index.js` contiene TODO (constants, handler, helpers). NO split en submódulos (rompería el zip pattern).
- **Terraform por servicio AWS**: agrupar resources del mismo servicio en el mismo `.tf` (todos los recursos S3/CloudFront/Route53 en `cloudfront.tf`).

#### Documentation
- **JSDoc / comments**: el código actual NO usa JSDoc. NO agregar a menos que se justifique con WHY no obvio.
- **Comments en Terraform**: usar `#` para WHY-comments. Recursos AWS tienen nombres descriptivos suficientes.
- **README.md** es la fuente operativa principal. Cualquier cambio de procedimiento se refleja ahí.
- **Docs generados** viven en `docs/` (regenerables via `/bmad-document-project`). NO editar a mano — se sobreescriben.

#### Constants
- **`MAX_FIELD_LENGTH = 500`** (Lambda): truncado anti-abuso. NO subir sin reevaluar costos SES.
- **`REQUIRED_FIELDS`** (Lambda): array fuente de verdad para validación. Sincronizar con form fields en `index.html:983-1006`.
- **`CONTACT_ENDPOINT`** (`index.html:1158`): URL del API Gateway. Ver "Critical Don't-Miss Rules".

### Development Workflow Rules

#### Git
- **Mensajes en inglés, imperativo**: `Add ...`, `Improve ...`, `Fix ...`, `Remove ...` (basado en historial).
- **Cambios atómicos por feature/fix**. NO mezclar refactor de frontend con cambios de infra en mismo commit.
- **NO commit automatizado**: el usuario decide cuándo committear. Agente NUNCA invoca `git commit` sin instrucción explícita.
- **Branch policy**: no documentada — asumir trunk-based en `main` salvo instrucción contraria.

#### Archivos NO commiteables (gitignored, NO incluir en deploys)
- `infra/terraform/.terraform/`, `infra/terraform/terraform.tfstate{,.backup}`, `infra/terraform/terraform.tfvars`, `infra/terraform/.terraform.lock.hcl`, `infra/terraform/*.zip`
- `.claude/`, `.cursor/`, `.vscode/`, `.idea/`, `.playwright-mcp/`
- `node_modules/`, `.env*`, `*.log`, `.DS_Store`

#### Deploy del frontend (manual)
Secuencia obligatoria:
```bash
aws s3 sync . s3://$(terraform -chdir=infra/terraform output -raw s3_bucket_name) \
  --exclude ".git/*" --exclude "_bmad/*" --exclude "_bmad-output/*" \
  --exclude "infra/*" --exclude "lambdas/*" --exclude "docs/*" \
  --exclude ".claude/*" --exclude ".playwright-mcp/*" \
  --exclude ".DS_Store" --exclude "*.md" --exclude ".gitignore"

aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```
- Lista de `--exclude` es exhaustiva y orden-independiente, pero CRÍTICA para no subir secretos o artefactos.
- `*.md` excluido: NO subir docs a producción.

#### Deploy de Lambda (Terraform-driven)
- Editar `lambdas/contact-form/index.js` → `cd infra/terraform && terraform apply`.
- Terraform detecta cambio via `source_code_hash` automáticamente.
- NO empaquetar manualmente con `zip` ni subir vía `aws lambda update-function-code` — rompe el state.

#### Deploy de infra
- SIEMPRE `terraform plan` antes de `apply`.
- Si cambia el API Gateway (recreación), ACTUALIZAR `CONTACT_ENDPOINT` en `index.html:1158`.
- Verificar `aws sts get-caller-identity --query Account --output text` == `009160036798` ANTES de cualquier apply.

### Critical Don't-Miss Rules

#### Endpoint drift (alta prioridad)
- ⚠️ El endpoint del API Gateway está **hardcoded** en `index.html:1158` como `CONTACT_ENDPOINT`.
- Si haces `terraform destroy && terraform apply` (o recreas el API Gateway), AWS genera un nuevo subdomain (`<random>.execute-api.us-east-1.amazonaws.com`).
- DESPUÉS de cada apply que toque API Gateway: copiar `terraform output contact_form_url` → pegar en `index.html:1158` → deploy frontend.
- README.md también lista el endpoint en ejemplos de curl — actualizar simultáneamente.

#### Seguridad del Lambda handler
- ⚠️ **TODO input de usuario al HTML del email debe pasar por `escapeHtml()`**. Está aplicado a `fullName`, `email`, `organization`, `role`, `mobile`, `message`. Cualquier campo nuevo agregado debe escaparse explícitamente.
- ⚠️ `encodeURIComponent` se usa adicionalmente para email y mobile cuando se inyectan en `mailto:`/`tel:` URLs.
- ⚠️ **Truncar siempre a `MAX_FIELD_LENGTH`** (500 chars) antes de meter al HTML.
- ⚠️ Validar email con regex ANTES de pasar a SES — SES también valida pero queremos retornar 400 al cliente, no 500.

#### CORS y rate limiting
- ⚠️ **CORS `*`** definido en API Gateway Y en Lambda response headers. Es intencional (la landing se sirvió desde Vercel durante desarrollo) pero significa que cualquier sitio puede invocar el endpoint.
- ⚠️ **NO HAY rate limiting**. Si agregas alarma `5xxError > N`, también considera Lambda `reserved_concurrent_executions` como circuit breaker.
- ⚠️ **NO HAY CAPTCHA/honeypot/Turnstile**. Bots pueden submitear el form sin obstáculo. Si crecen los emails spam, agregar Cloudflare Turnstile o reCAPTCHA invisible en el form.

#### Terraform state
- ⚠️ **Backend `local`**: el `terraform.tfstate` vive en disco del developer. Si se pierde → reconstruir con `terraform import` para cada recurso.
- ⚠️ **NO trabajar desde múltiples máquinas** sobre el state actual — riesgo de race conditions/divergencia.
- ⚠️ Si agregas un nuevo developer, recomendación: migrar state a S3 backend + DynamoDB lock ANTES de operaciones concurrentes.

#### Assets pesados
- ⚠️ `assets/media/discover.svg` (7.4 MB), `explore.svg` (5.9 MB), `ask.svg` (2.0 MB) son anómalamente grandes — probablemente con bitmaps embedidos.
- ⚠️ `hero-video.mp4` pesa 13 MB y se descarga sin lazy load.
- Al reemplazarlos: re-exportar como WebP/AVIF o limpiar el SVG con SVGO agresivo. Mantener filenames idénticos para evitar editar `index.html`.

#### CloudFront cache TTL
- ⚠️ `default_ttl=300` (5 min). Tras deploy, el cambio puede no verse inmediatamente.
- SIEMPRE crear invalidation `--paths "/*"` después de un `s3 sync`.
- Verificar con `aws cloudfront list-invalidations --distribution-id <id>` que Status: Completed.

#### Lambda zip integrity
- ⚠️ NO agregar `package.json` ni `node_modules` a `lambdas/contact-form/` — el `archive_file` zipea TODO el directorio y rompería el handler (no encontraría `index.handler`).
- Si necesitas dependencias externas: crear un Lambda Layer separado (cambio de arquitectura, no decisión menor).

#### Email destinatario
- ⚠️ `recipient_email` se setea via `terraform.tfvars` (gitignored). Cambio de destinatario requiere `terraform apply` para propagar a env var de Lambda.
- ⚠️ `sender_email` default = `contact@coupr.io` (verificada en SES dev). Si cambias el sender, debes verificar nueva identidad en SES o usar dominio verificado (`coupr.io`).

#### Smooth scroll handler
- ⚠️ El handler intercepta TODOS los `<a href="#...">` clicks (`index.html:1116-1132`). Si agregas un link interno que NO debe activar smooth scroll, usar `<button>` o un atributo `data-no-scroll` con un check en el handler.

#### Modal accessibility
- ⚠️ El modal actual NO tiene `role="dialog"`, `aria-modal="true"`, ni focus trap. Si agregas elementos focusables fuera del modal, considerarlo en una iteración A11Y futura.

#### Hot-paths frágiles
- ⚠️ Línea 1158 de `index.html`: `CONTACT_ENDPOINT`. Mover/reformatear este bloque rompe deploys.
- ⚠️ `index.html:9` carga Tailwind CDN. Si el CDN falla, el sitio se ve sin estilos (no hay fallback).
- ⚠️ `lambda.tf` `source_dir = "${path.module}/../../lambdas/contact-form"` — el path relativo es frágil; mover `lambdas/` o `infra/terraform/` rompe el archive.

---

## Usage Guidelines

**Para agentes de IA:**
- Leer este archivo ANTES de implementar cualquier código.
- Seguir TODAS las reglas exactamente como están documentadas.
- En caso de duda, preferir la opción más restrictiva.
- Si surge un patrón nuevo durante implementación, proponerlo para agregar aquí.

**Para humanos:**
- Mantener este archivo lean y enfocado en lo que los agentes necesitan.
- Actualizar cuando cambie el stack tecnológico (especialmente Node runtime, Terraform provider, plugins de Tailwind).
- Revisar trimestralmente para eliminar reglas que se vuelvan obvias.
- Si se introduce build pipeline / CI / TypeScript / tests automatizados → reescribir secciones afectadas en bloque.

**Última actualización:** 2026-05-21
