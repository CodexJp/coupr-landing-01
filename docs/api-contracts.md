# Contratos de API — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

Este documento describe la API expuesta por la landing page. Actualmente hay **1 endpoint**.

## Endpoint: `POST /contact`

Recibe solicitudes de demo desde el formulario modal de la landing y dispara un email transaccional vía SES al equipo comercial.

### URLs

| Entorno | URL |
|---|---|
| Producción (en uso por `index.html:1158`) | `https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact` |
| Producción (documentado en `README.md`) | `https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact` ⚠️ |

> ⚠️ Existe una discrepancia entre el endpoint hardcoded en el frontend y el documentado en el README. La fuente de verdad operativa es `index.html:1158`. Tras cualquier `terraform destroy/apply` que recree el API Gateway, hay que actualizar el `CONTACT_ENDPOINT` en `index.html` y el README.

### Implementación

| Componente | Definido en |
|---|---|
| Recurso API Gateway | `infra/terraform/main.tf` — `aws_apigatewayv2_api.landing` (HTTP) + route `POST /contact` |
| Stage | `$default` con `auto_deploy = true` |
| Integration | `AWS_PROXY` con `payload_format_version = "2.0"` |
| Handler | `lambdas/contact-form/index.js#handler` |
| Runtime | Node.js 20.x, 128 MB, 10 s timeout |

### CORS

Definido tanto en API Gateway (`cors_configuration` en `main.tf`) como en la Lambda (response headers en `index.js`).

| Header | Valor |
|---|---|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Methods` | `POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type` |

> **Preflight**: la Lambda detecta `event.requestContext?.http?.method === "OPTIONS"` y responde 200 sin procesar el body.

### Autenticación

**Ninguna**. El endpoint es público. No requiere API key, token, ni firma.

## Esquema de Request

### Headers

```
Content-Type: application/json
```

### Body (JSON)

| Campo | Tipo | Requerido | Validación | Notas |
|---|---|---|---|---|
| `fullName` | string | ✅ | trim no vacío, max 500 chars | Truncado a 500 chars |
| `email` | string | ✅ | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` + max 500 chars | Validación básica de formato |
| `organization` | string | ✅ | trim no vacío, max 500 chars | Empresa del solicitante |
| `role` | string | ✅ | trim no vacío, max 500 chars | Cargo del solicitante |
| `mobile` | string | ✅ | trim no vacío, max 500 chars | Número de teléfono (sin validación de formato) |
| `message` | string | ❌ | max 500 chars | Mensaje libre opcional |

### Ejemplo de Request

```bash
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "organization": "Acme Inc",
    "role": "Operations Manager",
    "mobile": "+1 555 010 0123",
    "message": "Interesados en pilotos para 5 tiendas en Q3."
  }'
```

## Esquemas de Response

### 200 OK — Éxito

```json
{
  "message": "Email sent successfully"
}
```

Headers:
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 400 Bad Request — Campos requeridos faltantes

```json
{
  "message": "Missing required fields: fullName, email"
}
```

Se dispara cuando alguno de los 5 campos requeridos está ausente, es `null`, o solo contiene whitespace.

### 400 Bad Request — Email inválido

```json
{
  "message": "Invalid email address"
}
```

Se dispara cuando el campo `email` no matchea el regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.

### 500 Internal Server Error — Fallo de envío

```json
{
  "message": "Internal server error"
}
```

Se dispara cuando `SESClient.send()` falla. El error real se loguea en CloudWatch (`/aws/lambda/coupr-landing-contact-form`) con `console.error("Error sending email:", error)`.

## Flujo de Procesamiento

```text
┌─────────────────┐
│  Form submit    │  index.html (fetch POST)
│  in browser     │
└────────┬────────┘
         │ JSON body
         ▼
┌─────────────────┐
│  API Gateway v2 │  POST /contact (HTTP API)
│  CORS, Routing  │
└────────┬────────┘
         │ AWS_PROXY (payload v2.0)
         ▼
┌────────────────────────────────────────────┐
│  Lambda contact-form (Node.js 20.x)        │
│                                             │
│  1. OPTIONS? → 200 CORS preflight          │
│  2. JSON.parse(body)                        │
│  3. Validate required fields → 400 if miss │
│  4. Validate email regex → 400 if invalid  │
│  5. Truncate fields to 500 chars           │
│  6. Build HTML email (escapeHtml)          │
│  7. SESClient.send(SendEmailCommand)       │
│  8. Return 200 OK                          │
└────────┬───────────────────────────────────┘
         │ AWS SDK v3
         ▼
┌─────────────────┐
│  Amazon SES     │  From: contact@coupr.io
│  us-east-1      │  To:   var.recipient_email
└─────────────────┘
```

## Comportamiento del Email Enviado

| Campo | Valor |
|---|---|
| `Source` (From) | `process.env.SENDER_EMAIL` (default `contact@coupr.io`, identidad verificada en SES) |
| `Destination.ToAddresses` | `[process.env.RECIPIENT_EMAIL]` (única dirección) |
| `Subject` | `New Demo Request from {fullName} - {organization}` |
| `Body.Html` | Template HTML inline con tabla styled (paleta marca: primary `#E1701A`, secondary `#1A4E5E`) y logo |
| `Charset` | `UTF-8` (subject + body) |

Todo input que entra al HTML pasa por `escapeHtml()` que escapa `&<>"'`. El campo `email` y `mobile` también pasan por `encodeURIComponent` cuando se usan en `mailto:`/`tel:`.

## Seguridad

- ✅ HTTPS obligatorio (API Gateway sólo expone HTTPS).
- ✅ CORS permite cualquier origen (`*`) — necesario porque la landing se sirvió temporalmente desde Vercel durante desarrollo.
- ✅ Validación de campos requeridos y formato de email.
- ✅ Truncado a 500 chars previene payloads excesivamente grandes.
- ✅ `escapeHtml()` previene HTML injection en el email enviado.
- ⚠️ **Sin rate limiting**. Un atacante puede enviar emails ilimitados desde la misma IP.
- ⚠️ **Sin CAPTCHA / Turnstile / honeypot**. Bots pueden submitear sin obstáculo.
- ⚠️ **`Access-Control-Allow-Origin: *`** permite invocar el endpoint desde cualquier origen (no solo coupr.io).
- ⚠️ **Sin verificación de bounce/complaint**. SES enviará a cualquier dirección que el destinatario tenga configurada en `terraform.tfvars`.

## Testing Manual

```bash
# Caso éxito (esperado: 200)
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","organization":"Test Co","role":"Dev","mobile":"555-0000"}'

# Caso campos faltantes (esperado: 400)
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test"}'

# Caso email inválido (esperado: 400)
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"no-arroba","organization":"X","role":"X","mobile":"X"}'

# Preflight OPTIONS (esperado: 200 con headers CORS)
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact
```

## Outputs de Terraform Relevantes

```bash
cd infra/terraform
terraform output api_endpoint          # Base URL del API Gateway
terraform output contact_form_url      # URL completa al endpoint /contact
terraform output lambda_function_name  # Para logs (aws logs tail)
```
