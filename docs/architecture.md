# Arquitectura — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Resumen Ejecutivo

La landing page de Coupr es un **Jamstack simplificado**: un único `index.html` estático servido por CloudFront sobre S3, complementado por un **endpoint serverless** (Lambda + API Gateway v2 + SES) que procesa el formulario de captura de leads.

No hay framework de frontend, sistema de build, base de datos, sesiones, ni capa de aplicación intermedia. Todo el estado del usuario vive en memoria del navegador y se descarta tras submit.

## Patrón Arquitectónico

**Jamstack — Static + Serverless API**:
- **Pre-rendered**: el HTML no se genera dinámicamente; se sirve verbatim desde S3.
- **API-augmented**: hay una única función serverless para el caso "POST /contact".
- **CDN-distributed**: CloudFront cachea el contenido estático a nivel global.

Alternativas que se descartaron (deducible del scope del proyecto y la spec en `_bmad-output/`):
- **SSR / Next.js**: innecesario para una página única sin contenido dinámico.
- **Backend dedicado (ECS/Fargate)**: overkill para 1 endpoint y < 100 req/día esperadas.
- **Servicios de form-as-a-service** (Formspree, Netlify Forms): se eligió Lambda + SES para mantener el stack 100% en AWS y reutilizar la identidad SES ya verificada.

## Diagrama del Sistema

```text
                    Internet (HTTPS)
                          │
                          ▼
                   ┌──────────────┐
                   │   Route53    │  coupr.io (A alias), www.coupr.io (CNAME)
                   └───────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                          ▼
   ┌────────────────────┐      (form submits via fetch)
   │  CloudFront        │              │
   │  - SSL ACM         │              ▼
   │  - default TTL 5m  │      ┌──────────────────────┐
   │  - HTTPS redirect  │      │  API Gateway v2 HTTP │
   └──────┬─────────────┘      │  POST /contact       │
          │ OAC sigv4          │  CORS *              │
          ▼                    └──────────┬───────────┘
   ┌────────────────────┐                 │ AWS_PROXY (payload v2.0)
   │  S3 (private)      │                 ▼
   │  static_site bucket│      ┌──────────────────────┐
   │  - index.html      │      │  Lambda              │
   │  - assets/         │      │  contact-form        │
   └────────────────────┘      │  Node.js 20.x        │
                               │  128 MB / 10 s       │
                               └──────────┬───────────┘
                                          │ AWS SDK v3
                                          ▼
                               ┌──────────────────────┐
                               │  Amazon SES          │
                               │  contact@coupr.io →  │
                               │  RECIPIENT_EMAIL     │
                               └──────────────────────┘

   Observabilidad: CloudWatch Logs (/aws/lambda/coupr-landing-contact-form, retention 14d)
   Region: us-east-1   |   Cuenta: 009160036798 (dev)
```

## Componentes

### 1. Capa de Entrega (CDN + DNS)

| Componente | Recurso | Configuración clave |
|---|---|---|
| DNS | `aws_route53_record.root` (A alias), `aws_route53_record.www` (CNAME) | Zona `coupr.io` ya existente |
| CDN | `aws_cloudfront_distribution.static_site` | `default_root_object = "index.html"`, `min_ttl=0`, `default_ttl=300`, `max_ttl=86400`, `compress=true`, custom error 403→200 `/index.html` (SPA-style fallback), `viewer_protocol_policy = "redirect-to-https"`, `minimum_protocol_version = "TLSv1.2_2021"` |
| TLS | ACM cert pre-existente (us-east-1) referenciado por ARN | `sni-only` |
| Auth a S3 | `aws_cloudfront_origin_access_control` | sigv4, S3 bucket policy restringe a `AWS:SourceArn = distribution_arn` |

### 2. Capa de Almacenamiento Estático

| Componente | Recurso | Configuración |
|---|---|---|
| Bucket | `aws_s3_bucket.static_site` (nombre `coupr-landing-static-009160036798`) | Sin versionado, sin replicación |
| Bloqueo público | `aws_s3_bucket_public_access_block.static_site` | Los 4 booleans en `true` |
| Bucket policy | `aws_s3_bucket_policy.static_site` | Permite `s3:GetObject` solo a CloudFront vía SourceArn |

### 3. Capa de API (HTTP)

| Componente | Recurso | Configuración |
|---|---|---|
| API | `aws_apigatewayv2_api.landing` | Protocol type HTTP, CORS `*` POST/OPTIONS Content-Type |
| Stage | `aws_apigatewayv2_stage.default` | `$default` con `auto_deploy=true` |
| Integration | `aws_apigatewayv2_integration.contact_form` | `AWS_PROXY`, `payload_format_version = "2.0"` |
| Route | `aws_apigatewayv2_route.post_contact` | `route_key = "POST /contact"` |
| Permission | `aws_lambda_permission.apigw` | Permite a APIGW invocar la Lambda |

### 4. Capa de Cómputo Serverless

| Componente | Recurso | Configuración |
|---|---|---|
| Function | `aws_lambda_function.contact_form` | Runtime `nodejs20.x`, handler `index.handler`, 128 MB, 10 s, env `SENDER_EMAIL`/`RECIPIENT_EMAIL` |
| Packaging | `data.archive_file.contact_form` | Re-zipea `lambdas/contact-form/` en cada apply (vía `source_code_hash`) |
| IAM role | `aws_iam_role.contact_form_lambda` | Assume role `lambda.amazonaws.com` |
| IAM policy SES | `aws_iam_role_policy.contact_form_ses` | `ses:SendEmail`, `ses:SendRawEmail` sobre `arn:aws:ses:us-east-1:*:identity/*` |
| IAM policy logs | `aws_iam_role_policy_attachment.lambda_basic` | `AWSLambdaBasicExecutionRole` (CloudWatch Logs) |
| Logs | `aws_cloudwatch_log_group.contact_form` | Retention 14 días |

### 5. Capa de Email

| Componente | Recurso | Configuración |
|---|---|---|
| SES identity | Ya existente (no en Terraform) | `contact@coupr.io` verificada en us-east-1 cuenta dev |
| Send command | `SendEmailCommand` (AWS SDK v3) | HTML body con template inline, charset UTF-8 |

## Flujo de Datos

### Flujo A: Render del sitio (GET)

```text
1. Usuario navega a https://coupr.io
2. Route53 resuelve a CloudFront alias
3. CloudFront chequea caché:
   - HIT  → sirve desde edge location (<300 ms RTT típico)
   - MISS → request a S3 vía OAC firmado
4. S3 retorna index.html (+ assets en requests subsiguientes)
5. Navegador:
   - Carga HTML
   - Descarga Tailwind CDN, Swiper CDN, Google Fonts (paralelo)
   - Ejecuta JS inline al final (Swiper init, IntersectionObserver, listeners)
   - Reproduce hero-video.mp4 (autoplay muted)
```

### Flujo B: Submit del formulario (POST)

```text
1. Usuario completa el modal #demoForm (5 campos requeridos + 1 opcional)
2. JS (index.html:1161-1228):
   - Previene default del submit
   - FormData → Object.fromEntries
   - Disable button, "Sending..."
   - fetch(CONTACT_ENDPOINT, { method: 'POST', body: JSON, headers: Content-Type })
3. API Gateway recibe → invoca Lambda (AWS_PROXY)
4. Lambda:
   a. Detecta OPTIONS → 200 CORS preflight (no aplica en POST normal)
   b. Parse JSON body
   c. Valida 5 campos requeridos (no vacíos tras trim) → 400 si faltan
   d. Valida regex de email → 400 si no matchea
   e. Trunca todos los campos a 500 chars
   f. Construye HTML email (escapeHtml para cada campo)
   g. SESClient.send(SendEmailCommand) hacia RECIPIENT_EMAIL
   h. Return 200 con { message: "Email sent successfully" }
5. SES envía el email (delivery típica < 5 s)
6. JS recibe response:
   - 200 → reemplaza form HTML con success state (check icon + thank you)
   - error → muestra mensaje rojo, re-habilita botón
7. 3 s después, cierra modal y restaura form HTML original
```

## Decisiones Arquitectónicas Clave

| Decisión | Razón | Trade-off |
|---|---|---|
| Sin build pipeline para frontend | Single HTML simple; cambios son inmediatos | Tailwind compile en navegador agrega ~50ms al TTI; sin tree-shaking → CSS payload mayor |
| Tailwind via CDN runtime | Sin Node/npm en repo; setup trivial | Latencia adicional + dependencia de CDN externa; no se puede customizar tema completo |
| Lambda Node.js 20.x | AWS SDK v3 incluido; sin necesidad de bundling | Atado al ciclo de deprecación del runtime AWS |
| `@aws-sdk/client-ses` desde runtime | Cero dependencias en zip | No control de versión del SDK |
| API Gateway v2 HTTP (no REST) | Más barato, simpler para single endpoint | Menos features (no usage plans, API keys, etc.) |
| Terraform state local | Setup mínimo; equipo de 1-2 personas | Riesgo de pérdida; conflicto si crecen colaboradores |
| `Access-Control-Allow-Origin: *` | Permitir que la landing se sirviera desde Vercel durante desarrollo | Cualquier sitio puede invocar el endpoint |
| Sin separación dev/prod | Optimización para velocidad de delivery | Riesgo: un `terraform destroy` impacta producción |
| Endpoint hardcoded en `index.html` | Sin sistema de templates / variables de build | Hay que actualizar manualmente tras cualquier re-creación del API Gateway |
| Custom error 403 → 200 /index.html | SPA-style fallback (todas las rutas regresan el landing) | Oculta errores reales 403 de S3 |

## Seguridad

| Vector | Mitigación actual | Gap |
|---|---|---|
| MITM | TLS 1.2+ obligatorio en CloudFront | — |
| Acceso directo a S3 | Bucket privado + OAC | — |
| HTML injection en email | `escapeHtml()` en Lambda | — |
| Payload excesivo | Truncado 500 chars/campo | Sin límite a tamaño del body global |
| Email malformado | Regex validation | Regex débil — acepta `a@b.c` |
| Spam / bots | — | ⚠️ Sin CAPTCHA / honeypot / rate limit |
| Abuso del endpoint | — | ⚠️ Sin throttling en API Gateway / Lambda concurrency |
| CSRF | N/A (sin cookies, sin sesión) | — |
| XSS reflejado | El sitio no procesa input del usuario en el HTML | — |
| State Terraform | `terraform.tfvars` gitignored | ⚠️ State `.tfstate` solo local — pérdida posible |
| Secrets en Lambda | Env vars (no en código) | ⚠️ Sin rotation; visibles en console a quien tenga GetFunctionConfiguration |

## Performance

| Métrica | Estado actual estimado | Bottleneck |
|---|---|---|
| LCP | ~3-4 s (con video del hero) | `hero-video.mp4` (13 MB) |
| CLS | Bajo (layout fijo) | — |
| Total transferred (first load) | ~32 MB (peso de assets) | Video 13 MB + 3 SVGs 15 MB |
| API latency (cold start Lambda) | 500-1200 ms | Node.js 20.x cold start típico |
| API latency (warm) | 50-200 ms | SES + network |

Optimizaciones recomendadas (ver `asset-inventory.md` para detalle):
- Comprimir el video del hero (13 MB → 4-6 MB).
- Re-exportar SVGs pesados a WebP/AVIF (15 MB total → ~300 KB).
- Agregar `loading="lazy"` a `<img>` below-the-fold.
- Considerar Lambda Provisioned Concurrency si tasa de submit crece (descarta cold start).

## Observabilidad

| Capa | Mecanismo | Retention |
|---|---|---|
| Lambda runtime | `console.log/error` → CloudWatch Logs | 14 días (configurado) |
| Lambda invocations / errors | CloudWatch Metrics (gratis) | 15 meses |
| API Gateway | CloudWatch Metrics (Count, 4xx, 5xx, Latency) | 15 meses |
| CloudFront | CloudWatch Metrics + access logs (deshabilitados) | — |
| SES | CloudWatch Metrics + bounce/complaint notifications (no configurado) | — |

⚠️ **No hay alarmas configuradas**. Ningún incidente generará notificación proactiva al equipo.

## Escalabilidad

| Componente | Límite actual | Headroom |
|---|---|---|
| CloudFront | Global, sin límite práctico para este tamaño | Sobra para miles de visitas/día |
| Lambda concurrency | Default account limit (1000) | Más que suficiente |
| API Gateway HTTP | Default 10,000 req/s por cuenta/region | Sobra |
| SES sandbox | 200 emails/24h (si en sandbox) | ⚠️ Requiere "production access" si supera; revisar estado en SES console |

## Multi-tenancy / Aislamiento

No aplica. Es un sitio single-tenant para una empresa.

## Disaster Recovery

| Escenario | RTO actual | Plan |
|---|---|---|
| S3 borrado accidentalmente | ~10 min | `terraform apply` + re-sync de archivos (asumiendo state intacto) |
| State Terraform corrupto/perdido | Horas | Importar manualmente cada recurso (`terraform import ...`) |
| CloudFront distribution borrada | ~30-45 min (propagación) | `terraform apply` |
| Lambda código corrupto | < 5 min | `terraform apply` re-empaqueta el código del repo |
| Cuenta AWS comprometida | — | ⚠️ Sin plan documentado |
| SES bloquea envíos | Días | Solicitar production access; mientras tanto, fallback a otro provider |

## Referencias Cruzadas

- Listado completo de recursos AWS: ver [`deployment-guide.md`](./deployment-guide.md).
- Contratos del endpoint POST /contact: ver [`api-contracts.md`](./api-contracts.md).
- Detalle de archivos y entry points: ver [`source-tree-analysis.md`](./source-tree-analysis.md).
- Componentes UI de la landing: ver [`ui-component-inventory.md`](./ui-component-inventory.md).
- Spec original de la infra del contact form: ver [`../_bmad-output/implementation-artifacts/tech-spec-landing-infra-contact-form.md`](../_bmad-output/implementation-artifacts/tech-spec-landing-infra-contact-form.md).
