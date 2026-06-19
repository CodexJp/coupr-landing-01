---
title: 'Research section: gated report library at /report/'
type: 'feature'
created: '2026-05-22'
status: 'done'
baseline_commit: 'afc81c4d76bb4a7726e672be92da74001707591c'
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad/bmm/config.yaml'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Coupr no tiene una sección pública de research/whitepapers, y el equipo necesita capturar leads cualificados (con correo corporativo) que descarguen los reportes. Hoy la única captura es el modal "Get a Demo". **Contexto operativo:** el CEO solicitó esta página en un mensaje formal con deadline 2026-05-20 10:00 AM ET, ya pasado al momento de implementar (recovering post-launch — entregar lo antes posible).

**Approach:** Agregar dos páginas estáticas nuevas servidas desde S3/CloudFront — `/report/` (lista de papers con email-gate) y `/report/consideration-moment` (detalle del primer paper) — más un link "Research" con badge "NEW" en el nav de `index.html`. La Lambda `contact-form` se extiende con un discriminador `form_type` para reutilizarla en dos nuevos formularios (unlock del gate + request del paper), notificando al `RECIPIENT_EMAIL` actual. URLs limpias se logran con una **CloudFront Function (viewer-request)** que reescribe trailing-slash y rutas sin extensión. **Gap conocido vs CEO ask:** el CEO pidió que el form envíe el PDF directamente al usuario por email transaccional; este spec entrega solo la captura del lead + notificación interna, dejando el envío al usuario para Phase 2 (requiere SES production-access verificado + PDF artifact disponible).

## Boundaries & Constraints

**Always:**
- Stack idéntico al actual: HTML5 + Tailwind CDN (mismo query string + tokens custom) + Swiper si necesario + vanilla JS inline. NO React, NO build pipeline, NO archivos `.css`/`.js` externos.
- Lambda mantiene CommonJS, AWS SDK v3, `corsHeaders` en TODA respuesta (incluso 400/500), `MAX_FIELD_LENGTH=500`, `escapeHtml()` en cualquier input que entre al HTML del email.
- `form_type` ausente o `=== 'contact'` debe preservar el comportamiento actual (backwards compat con `index.html#demoForm`).
- Blocklist de emails personales reutiliza la lista del designer (~70 dominios: gmail, hotmail/outlook/live/msn, yahoo/ymail, icloud/me/mac, aol, proton, gmx, mail.ru/yandex, qq/163, terra/uol/bol, etc.).
- Email del gate se persiste en `localStorage` key `coupr_research_email`. Sign out lo limpia y restaura el overlay.
- Página detalle del paper redirige a `/report/` si no hay unlock válido en localStorage (gate enforcement en cada navigation).

**Ask First:**
- Cambio en la **CloudFront distribution** (agregar `function_associations` viewer-request). Requiere `terraform apply` que invalida cache 5–8 min.
- Si el `CONTACT_ENDPOINT` cambia (re-creación API Gateway): actualizar también en `report/index.html:RESEARCH_ENDPOINT` y `report/consideration-moment.html:RESEARCH_ENDPOINT`.
- ⚠️ Envío del **PDF al usuario** queda **OUT OF SCOPE** de esta spec (ver Never). Si confirmás producción-access en SES + PDF disponible, abrimos Phase 2.

**Never:**
- NO tocar `index.html` fuera del nav (líneas 398-407) y el footer Product column (líneas 898-901). Hero, formulario demo, modal y scripts existentes no se modifican.
- NO crear archivos `.css` o `.js` separados — todo CSS/JS inline en cada HTML.
- NO enviar email AL usuario que llenó el form en Phase 1 (CEO lo pidió pero requiere SES production-access verificado + PDF artifact, ninguno confirmado al implementar). Solo notificación a `RECIPIENT_EMAIL`. UI muestra "The paper is on its way." (mensaje optimista; el envío real del PDF se gestiona manual desde la notificación interna hasta cerrar Phase 2).
- NO `package.json` ni `node_modules` en `lambdas/contact-form/` (rompe el archive_file pattern).
- NO subir el PDF a S3 en esta entrega — Phase 2 cuando exista.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Visita `/report/` sin unlock previo | `localStorage['coupr_research_email']` vacío | Overlay gate visible, body scroll bloqueado, lista de papers detrás | N/A |
| Submit gate con email corporativo válido | `juan@empresa.com` | Guarda en localStorage, oculta overlay, POST a Lambda con `form_type='research-access'`, badge "Access granted to <email>" visible | Si POST falla: igual desbloquea (no romper UX por backend caído). Log a console. |
| Submit gate con email free-provider | `juan@gmail.com` | Error inline rojo: "We can't accept personal email addresses (gmail.com). Please use your corporate email." Form NO submit. | N/A |
| Submit gate con email malformado | `juan@empresa` | Error inline: "Please enter a valid email address." | N/A |
| Visita `/report/consideration-moment` sin unlock | `localStorage['coupr_research_email']` vacío | Redirect inmediato (`location.replace`) a `/report/`, guarda destino en `sessionStorage['coupr_research_redirect']` para retornar tras unlock | N/A |
| Submit "Send me the paper" con todos los campos | `{name, email corporativo, company, role?, note?}` | POST a Lambda con `form_type='research-paper-request'`. Hide form, show "The paper is on its way." (UI optimista — sin enviar PDF aún). | Si POST falla: fallback `mailto:hello@coupr.io` prellenado. |
| Submit "Send me the paper" con email free | `{email: 'x@gmail.com'}` | Status err inline: "Please use your corporate email — personal providers aren't accepted." | N/A |
| Visita directa `/report` (sin slash) | URL exacta | CloudFront Function NO maneja este caso → S3 404 → `custom_error_response` → `/index.html` (landing). | Aceptable: usuarios llegan via nav que tiene `/report/`. Documentado. |
| Lambda recibe `form_type='research-access'` con email faltante | `{form_type:'research-access'}` | 400 con `{message: 'Missing email'}` + CORS headers | N/A |
| Lambda recibe `form_type` desconocido | `{form_type:'foo', email:'x@y.com'}` | 400 con `{message: 'Unsupported form_type'}` + CORS headers | N/A |

</frozen-after-approval>

## Code Map

- `index.html` — nav (líneas 398-407) + footer Product column (líneas 898-901). Editar SOLO esos 2 bloques.
- `report/index.html` — **NUEVO**. Página lista con email gate, layout `index` (lista editorial). Basado en `/Users/jairopolo/Downloads/Coupr Landing/Reports.html` (limpiar tweaks panel + variantes de layout no usadas).
- `report/consideration-moment.html` — **NUEVO**. Detalle del paper con form. Basado en `/Users/jairopolo/Downloads/Coupr Landing/Report - Consideration Moment.html`.
- `lambdas/contact-form/index.js` — agregar discriminador `form_type` + 2 nuevos paths de validación/email-body. NO romper el path actual.
- `infra/terraform/cloudfront.tf` — agregar `aws_cloudfront_function` (viewer-request) + `function_associations` en `default_cache_behavior`.
- `infra/terraform/cloudfront-function.js` — **NUEVO**. JS de la function (referenciado vía `file()`).
- `_bmad-output/project-context.md` — actualizar regla "editar solo index.html" para reflejar que `report/*.html` también son válidos.

## Tasks & Acceptance

**Execution:**
- [x] `infra/terraform/cloudfront-function.js` — Crear con lógica: si URI termina en `/`, append `index.html`; si no tiene extensión, append `.html`; sino, pasar tal cual.
- [x] `infra/terraform/cloudfront.tf` — Agregar `resource "aws_cloudfront_function"` (runtime `cloudfront-js-2.0`) + `function_associations { event_type = "viewer-request", function_arn = ... }` en `default_cache_behavior`.
- [x] `lambdas/contact-form/index.js` — Refactor: dispatcher por `form_type` (default `'contact'`), extraer `sendDemoEmail()`, agregar `sendResearchAccessEmail()` y `sendResearchPaperRequestEmail()`. Mantener `REQUIRED_FIELDS`/`MAX_FIELD_LENGTH`/`escapeHtml`/`corsHeaders` shared.
- [x] `report/index.html` — Crear. Copiar de design source, remover bloque "tweaks panel" (líneas ~648-679, ~821-895), remover variantes de layout (`magazine`/`bento`), dejar solo `index`. Fijar `CONTACT_ENDPOINT` apuntando al mismo API Gateway URL. Reemplazar `Coupr Landing.html` por `/` y `Reports.html` por `/report/` y `Report - Consideration Moment.html` por `/report/consideration-moment` en todos los `href`. Cambiar fuente del favicon a `/assets/brand/favicon.svg` (relativo a root).
- [x] `report/consideration-moment.html` — Crear similar. Limpiar refs a paths con espacios, normalizar a `/report/` y `/report/consideration-moment`. POST a `CONTACT_ENDPOINT` con `form_type='research-paper-request'` + `paper_id='consideration-moment'`.
- [x] `index.html` línea 406 — Insertar después del link `Stories` un nuevo `<a>` con texto "Research", `href="/report/"`, + un `<span>` badge "NEW" con clases `ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black tracking-widest uppercase rounded`. Asegurar que el smooth-scroll handler (línea 1116) NO intercepte (NO empieza con `#`).
- [x] `index.html` línea 900 — Agregar `<li><a class="hover:text-primary transition-colors" href="/report/">Research</a></li>` al final del Product column.
- [x] `_bmad-output/project-context.md` — Actualizar sección "HTML / CSS / Vanilla JS (frontend)" regla 1: aclarar que ahora `report/*.html` también es válido + agregar regla nueva sobre el CloudFront Function URL rewrite.

**Acceptance Criteria:**
- Given un visitor en `/`, when click en "Research" del nav, then navega a `/report/` (URL limpia, sin `.html`).
- Given un visitor en `/report/` sin localStorage, when la página carga, then ve el overlay gate y el contenido detrás está visible pero no interactuable.
- Given el gate con email `juan@gmail.com`, when submit, then aparece error inline rojo y NO se hace POST a Lambda.
- Given el gate con email `juan@coupr.io`, when submit, then localStorage guarda el email, overlay se oculta, badge "Access granted to juan@coupr.io" aparece, y la Lambda recibe `{form_type:'research-access', email:'juan@coupr.io'}`.
- Given un visitor unlocked, when click en el card "Measuring the Consideration Moment", then navega a `/report/consideration-moment` y ve el paper completo sin gate.
- Given un visitor SIN unlock que tipea directo `/report/consideration-moment`, when la página carga, then es redirigido inmediatamente a `/report/` con sessionStorage marcado para retornar.
- Given el form "Send me the paper" llenado correctamente, when submit, then POST a Lambda con `form_type='research-paper-request'`, UI muestra "The paper is on its way.", y el `RECIPIENT_EMAIL` recibe un email con todos los campos.
- Given el demo form existente del landing, when submit, then sigue funcionando EXACTAMENTE igual que antes (regression test).
- Given un `terraform apply`, when se recrea la distribution, then la URL `coupr.io/report/` resuelve a la página (no al landing fallback).

## Spec Change Log

- **2026-05-22 — UI copy deviation from design (user-directed).** Removed the PDF page count metadata from both `report/index.html` (was "May 2026 · 38 pages" → now just "May 2026") and `report/consideration-moment.html` (was "PDF · 38 pages" → now just "PDF"). Reason: el PDF actual subido a S3 tiene un número de páginas distinto al del placeholder original del designer (38), y el usuario prefiere no exponer ese metadato hasta que el PDF definitivo esté en su lugar. Esto rompe la regla "NO cambiar copy textual" de la sección Design Fidelity, pero es una instrucción directa del usuario que prevalece. Cuando el PDF definitivo esté listo, se puede restaurar el page count actualizado al número correcto.

- **2026-05-22 — Sign-out trap fix (UX gap not en el design original).** Reportado durante testing local: al hacer Sign out en `/report/`, el gate-overlay vuelve a cubrir todo y el nav queda detrás del overlay (z-50 < z-90), dejando al usuario sin escape salvo autenticarse de nuevo. Agregado un link discreto `← Back to coupr.io` debajo del gate-card, dentro del overlay, visible sobre el backdrop oscuro. Esto NO está en el design original de Claude Design pero es una mejora de UX necesaria para usuarios que deciden no entregar su email.

- **2026-05-22 — URLs internas con `.html` para compatibilidad local-dev.** El designer source usaba `Report - Consideration Moment.html` (con `.html`) como href. La spec lo había normalizado a `/report/consideration-moment` (clean URL via CloudFront Function rewrite). Pero `python3 -m http.server` no hace rewrite, lo que produce 404 al navegar localmente. Volvemos a `/report/consideration-moment.html` (con extensión) en los hrefs internos. La CloudFront Function sigue activa: en producción, ambas URLs funcionan (`/report/consideration-moment` y `/report/consideration-moment.html`). KEEP: los metadatos `og:url` y el `source` field del lead siguen usando la URL limpia (sin `.html`) porque no son hyperlinks navegables.

- **2026-05-22 — Sign out + click-outside redirige a Home (user-directed UX).** `signOutResearch()` antes solo limpiaba localStorage y restablecía el overlay (dejando al usuario en `/report/` con el gate cerrado, sin claro camino de salida si no quería volver a entrar). Ahora redirige a `/` después del cleanup. Adicionalmente, click sobre el backdrop del overlay (cualquier área fuera del `.gate-card`) también navega a `/`. Esto refuerza la salida limpia para visitantes que decidieron no autenticarse, y se alinea con el patrón estándar de "click-outside cierra modal" que los usuarios esperan. El link `← Back to coupr.io` permanece como tercera vía de escape explícita.

- **2026-05-29 — Phase 2: auto-send del paper al lead vía SES con fallback de sandbox (Resend descartado).** Investigación confirmó: la landing usa SES (cuenta dev 009160036798, sandbox, 200/día); `coupr.io` está verificado en Resend pero esa cuenta la administra el equipo del producto principal (no la landing) y su API key no está en ninguna cuenta AWS accesible. Decisión del usuario: quedarse en SES, independiente. Implementado en `lambdas/contact-form/index.js`: el flow `research-paper-request` ahora (1) intenta enviar al lead un email con botón "Download the paper (PDF)" apuntando a `https://coupr.io/report/papers/coupr-report.pdf` vía SES desde `SENDER_EMAIL` (contact@coupr.io, único verificado; noreply@ está Failed en SES); (2) envía notificación interna a `RESEARCH_NOTIFY_EMAIL` (env var = julian@coupr.io, identidad verificada) con banner de estado ✅/⚠️. **Fallback inteligente:** en sandbox el envío al lead externo falla (recipient no verificado) → se captura, la notificación a Julian lleva ⚠️ "send manually" + link, y devuelve 200. Cuando AWS apruebe SES production access, el envío al lead se activa solo SIN redeploy. Si lead Y notificación fallan → 500 (retry). Refactor: `sendEmail({to,...})` ahora acepta destinatario explícito (default RECIPIENT_EMAIL preserva contact/research-access sin cambios); helpers `wrapEmail`/`row`/`buildLeadEmail` extraídos. Testeado en prod: `jairo@coupr.io` (verificado) → "Paper sent" + email real entregado; `test-lead@example.com` (externo) → "Paper request received" (fallback OK). PENDIENTE: escalar la denegación automática de SES production access (CaseId 178006379400785) por el AWS Support Center para que el auto-send funcione con leads externos reales. Resend (catálogo `PAPER_PDFS`/`PAPER_TITLES`) quedó descartado; el código no tiene dependencias de Resend.

- **2026-05-22 — Modal de confirmación post-submit + remove mailto fallback (user-directed UX).** El form "Send me the methodology paper" antes hacía `formCard.style.display='none'` + mostraba un `<section class="post-submit">` inline debajo. Reemplazado por un **modal overlay** centrado (clase `.confirm-modal`) con icono `mark_email_read`, título "Thank you!", body explicativo, y botón close (X). Cierra con: X, click-outside, ESC. Al cerrar resetea el form para permitir reenvío. Esto alinea visualmente con el flujo de Get a Demo del landing principal (modal con confirmación). Adicionalmente removido el fallback `mailto:` del `.catch()` — antes abría Outlook ante cualquier error 4xx/5xx de la Lambda, lo cual generaba UX confusa (especialmente mientras la Lambda actualizada no estaba deployada). Ahora muestra "Something went wrong. Please try again or write to hello@coupr.io." inline en el status del form. Si el endpoint cae, leads se pierden — accepted risk por mejor UX. La integridad de la entrega depende ahora 100% del uptime del Lambda+API Gateway.

## Design Notes

### Design Fidelity (mandatorio — leer antes de tocar el HTML)

**Política base:** los HTMLs `/Users/jairopolo/Downloads/Coupr Landing/Reports.html` y `/Users/jairopolo/Downloads/Coupr Landing/Report - Consideration Moment.html` son la fuente de verdad visual. **Copiarlos verbatim como punto de partida**. NO reescribir markup, CSS, ni copy desde cero usando los screenshots — los screenshots son referencia visual, no spec.

**Cambios PERMITIDOS sobre el design source (whitelist exhaustiva):**

1. **Remover panel de tweaks** (solo en `Reports.html`): bloques `<div class="tweaks-panel">` (~líneas 648-679) + el código JS de tweaks UI (~líneas 821-895). Solo en design `Reports.html`; el detalle no lo tiene.
2. **Remover variantes de layout no usadas** (solo en `Reports.html`): secciones `<section class="layout-variant layout-magazine">` (~líneas 422-455) y `<section class="layout-variant layout-bento">` (~líneas 457-497). Dejar solo `layout-index`.
3. **Limpiar CSS muerto**: las definiciones `body[data-layout="magazine"] ...`, `body[data-layout="bento"] ...`, `.layout-variant` que se vuelven dead code tras 2. Mantener solo `body[data-layout="index"] .layout-index { display: block }` o equivalente; si solo queda index, simplificar a `.layout-index { display: block }`.
4. **Eliminar variantes de gate-style no usadas** (solo en `Reports.html`): el bloque `.gate-pitch` (~líneas 552-568) que solo se muestra cuando `gateStyle === 'split'`. Dejar solo el gate "overlay" (default).
5. **Limpiar CSS muerto del gate**: `body[data-gate-style="blur"] ...` y la clase `.gate-card-split`. Default `data-gate-style="overlay"` queda implícito.
6. **Atributos del `<body>`**: cambiar `data-gate-style="overlay" data-layout="magazine"` a solo `data-gate-unlocked="false"`. Sacar `data-layout` y `data-gate-style` ya que sus únicos consumidores eran las variantes removidas.
7. **Reemplazar paths/URLs** (TODO):
   - `Coupr Landing.html` → `/` (root del sitio Coupr)
   - `Coupr Landing.html#process` → `/#process`
   - `Coupr Landing.html#mission` → `/#mission`
   - `Coupr Landing.html#retailer` → `/#retailer`
   - `Coupr Landing.html#testimonials` → `/#testimonials`
   - `Reports.html` → `/report/`
   - `Report - Consideration Moment.html` → `/report/consideration-moment`
   - `assets/brand/favicon.svg` → `/assets/brand/favicon.svg`
8. **Wire del endpoint real**: el placeholder `window.COUPR_LEAD_ENDPOINT || '/api/lead'` se reemplaza por la constante real del proyecto (mismo URL que `CONTACT_ENDPOINT` en `index.html:1158`). Para el form del paper, agregar `form_type: 'research-paper-request'` + `paper_id: 'consideration-moment'` al body del POST. Para el unlock gate, agregar `form_type: 'research-access'` + el POST que hoy está comentado en el design (líneas ~797-804) se activa.
9. **Remover host-protocol del designer**: todo `window.parent.postMessage(...)` y los listeners `__activate_edit_mode`/`__deactivate_edit_mode`/`__edit_mode_dismissed`/`__edit_mode_available`. No aplica fuera del entorno de Claude Design.
10. **Demo CTA del nav**: `document.getElementById('ctaDemoBtn')` actualmente redirige a `Coupr Landing.html#` — cambiar a `/#contact` o reemplazar el botón con un `<a href="/#contact">` directo. (Nota: el modal `openModal()` solo existe en el landing main; desde `/report/` no podemos abrirlo, solo navegar.)
11. **Newsletter form** (en `Reports.html`): actualmente solo muestra "Subscribed ✓" sin backend. Mantener ese comportamiento placeholder; agregar TODO comment en el spec change log para considerar wiring en Phase 2.

**NO PERMITIDO** (drift creativo a evitar):

- ❌ NO simplificar custom CSS con Tailwind utilities ("ahorrar líneas"). Las clases como `.thumb-grid`, `.stat-card`, `.lead-card`, `.tldr`, `.pull-quote`, `.index-row`, `.gate-overlay`, `.paper-body`, `.paper-grain`, `.toc` se preservan tal cual.
- ❌ NO omitir Google Fonts adicionales del detail (`Source Serif 4`). El detail usa serif para el cuerpo del paper; es intencional.
- ❌ NO omitir el `paper-cream: #FAF6F0` del tailwind config del detail.
- ❌ NO cambiar copy textual (ni siquiera "ajustes menores"): "Unlock Research", "Access granted to <email>", "Sign out", "Send me the paper", "Get the full paper", "The paper is on its way.", "The state of in-store retail.", "Measuring the Consideration Moment.", el pull-quote sobre `session_id`, y la "Suggested Citation" se conservan verbatim.
- ❌ NO cambiar tipografía: h1 del detail es `font-display font-bold ... text-7xl ... tracking-tighter` con `<span class="text-primary italic">Consideration</span>`. Misma jerarquía para el hero de `/report/`.
- ❌ NO omitir hover states ni transitions: `.report-card:hover { transform: translateY(-4px) }`, `.thumb-cta` background swap on parent hover, `.index-row:hover { padding-left: 1rem }` + arrow translateX/recolor, `.stat-card:hover { transform: translateY(-3px); box-shadow: ... }`.
- ❌ NO omitir animaciones staggered: `.animate-on-scroll` + `.animate-delay-1/2/3/4` con IntersectionObserver threshold 0.1 / rootMargin `0px 0px -50px 0px` (mismo patrón que `index.html`).
- ❌ NO omitir backdrop-filter blur del gate-overlay (`backdrop-filter: blur(14px)` + `-webkit-backdrop-filter` para Safari).
- ❌ NO refactorizar el `index-row` grid (`grid-template-columns: 60px 1.5fr 2fr 1fr auto` desktop / `40px 1fr auto` mobile) a flexbox.

**Inventory de elementos críticos** (chequear que todos quedan en la implementación):

- `/report/` debe tener: nav con badge "NEW" en Research / hero con eyebrow + h1 split + 3 stats / filter chips (All Reports + Methodology) / index row 01 hover-able / placeholder row 02 disabled "More papers coming this quarter" / newsletter dark teal card / footer estándar / gate overlay con backdrop blur / formulario gate con validation inline rojo / badge "Access granted to <email>" + sign out.
- `/report/consideration-moment` debe tener: nav con `← All Reports` reemplazando el demo CTA / breadcrumb Research › Methodology Paper / hero masthead con eyebrow + h1 split italic + sub serif italic + meta sidebar (4 dl items) / opening 2 paragraphs en serif / 2 stat cards con orange left border / info note con material icon / pull-quote teal con left border / TLDR card cream con 5 numbered items / Suggested Citation con COPY button / lead-card dark con form completo / post-submit success state / footer note serif / footer estándar.

### Patrón CloudFront Function (subdir indexing + extensionless URLs):

```js
function handler(event) {
  var req = event.request;
  var uri = req.uri;
  if (uri.endsWith('/')) {
    req.uri += 'index.html';
  } else if (!/\.[a-z0-9]+$/i.test(uri)) {
    req.uri += '.html';
  }
  return req;
}
```

Esto resuelve `/report/ → /report/index.html` y `/report/consideration-moment → /report/consideration-moment.html`. Pasa request a S3 con el path corregido. NO toca `/` (root) — `default_root_object` sigue funcionando.

**Patrón Lambda dispatcher (preserva backwards-compat):**

```js
const formType = body.form_type || 'contact';
if (formType === 'contact') return sendDemoEmail(body);
if (formType === 'research-access') return sendResearchAccessEmail(body);
if (formType === 'research-paper-request') return sendResearchPaperRequestEmail(body);
return { statusCode: 400, ..., body: JSON.stringify({ message: 'Unsupported form_type' }) };
```

Cada función arma su propio `htmlBody` con `escapeHtml` aplicado a TODO input y envía con `SendEmailCommand` a `RECIPIENT_EMAIL`. Reusar el mismo header `#1A4E5E` + bar `#E1701A` del template existente.

**Gate enforcement en página detalle:**

IIFE al top del script (antes que cualquier otra lógica): lee localStorage, valida con la misma `isCorporateEmail()`, si falla `location.replace('/report/')` + guarda `sessionStorage['coupr_research_redirect']`.

## Verification

**Commands:**
- `cd infra/terraform && terraform fmt -check && terraform validate` — expected: success.
- `cd infra/terraform && terraform plan` — expected: 1 new `aws_cloudfront_function` + 1 modification a `aws_cloudfront_distribution`. Sin sorpresas en otros recursos.
- `node -e "const h = require('./lambdas/contact-form'); h.handler({requestContext:{http:{method:'POST'}},body:JSON.stringify({form_type:'research-access',email:'a@b.com'})}).then(r => console.log(r.statusCode, r.body))"` — expected: `200 {"message":"..."}` (después de implementación; usar `AWS_PROFILE` válido o mockear `ses.send`).
- `curl -sS -X POST $CONTACT_ENDPOINT -H "Content-Type: application/json" -d '{"form_type":"research-access","email":"test@coupr.io"}' -w "\n%{http_code}\n"` — expected: `200`. Hacer post-deploy.
- `curl -sS -o /dev/null -w "%{http_code}\n" https://coupr.io/report/` — expected: `200` (post-deploy + invalidation).
- `curl -sS -o /dev/null -w "%{http_code}\n" https://coupr.io/report/consideration-moment` — expected: `200`.

**Manual checks:**
- **Design fidelity check (CRÍTICO antes de marcar step-03 done):** abrir lado-a-lado los HTMLs del design source (`/Users/jairopolo/Downloads/Coupr Landing/Reports.html` y `Report - Consideration Moment.html`) en una tab y la implementación local en otra. Comparar pixel-by-pixel los 7 screenshots originales contra el resultado: hero typography, stats banner, filter chips, index row hover, gate overlay backdrop blur, paper hero, stat cards orange border, pull-quote teal, TLDR cream card, Suggested Citation, lead-card dark grid pattern. Cualquier desviación visible = volver a copiar del source.
- Browser real (Chrome + Safari iOS): visitar `/report/`, validar overlay + scroll lock, submit con gmail → ver error, submit con corporativo → ver unlock + badge.
- Navegación: click en card → llega a `/report/consideration-moment`. Back button funciona. Sign out limpia localStorage.
- Animaciones: scrollear lentamente en ambas páginas — verificar que los elementos aparecen con stagger (delays 1-4) según diseño, no todos a la vez.
- Hover states: pasar sobre el index-row → padding-left aumenta + arrow se vuelve naranja con translateX. Pasar sobre stat-card del detail → translateY -3px + shadow. Pasar sobre report-card → translateY -4px.
- Email recibido en `RECIPIENT_EMAIL`: contenido renderiza correctamente, escapeHtml aplicado, no XSS posible con payload `"><script>alert(1)</script>` en cualquier campo.
- Cache invalidation post-deploy: `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"` y verificar status Completed antes de declarar done.
