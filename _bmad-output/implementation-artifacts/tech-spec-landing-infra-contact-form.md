---
title: 'Landing Page Infrastructure & Contact Form'
slug: 'landing-infra-contact-form'
created: '2026-02-12'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['HTML/Tailwind CSS (CDN)', 'Node.js 20.x (Lambda)', 'AWS Lambda', 'AWS API Gateway HTTP', 'AWS SES', 'Terraform ~> 5.0']
files_to_modify: ['index.html', 'assets/brand/couprLogo.png', 'infra/terraform/provider.tf', 'infra/terraform/main.tf', 'infra/terraform/lambda.tf', 'infra/terraform/variables.tf', 'infra/terraform/outputs.tf', 'lambdas/contact-form/index.js']
code_patterns: ['Static HTML with Tailwind CDN', 'Inline JS event listeners', 'FormData → Object.fromEntries pattern', 'Modal open/close with CSS transitions']
test_patterns: ['Manual testing via Playwright MCP', 'curl for Lambda endpoint']
---

# Tech-Spec: Landing Page Infrastructure & Contact Form

**Created:** 2026-02-12

## Overview

### Problem Statement

La landing page de Coupr no tiene favicon y carece de un formulario de contacto funcional. Cuando un prospecto solicita un demo, no se genera ninguna notificación. El CEO necesita recibir un email cada vez que alguien complete el formulario de "Request a Demo".

### Solution

1. Agregar el favicon de coupr.io a la landing page
2. Crear una Lambda en Node.js que reciba datos del formulario y envíe un email de notificación vía SES usando la identidad `contact@coupr.io` ya verificada en la cuenta dev
3. Exponer la Lambda mediante API Gateway HTTP con CORS habilitado
4. Desplegar toda la infraestructura con Terraform dentro del repositorio de la landing

### Scope

**In Scope:**
- Favicon de coupr.io integrado en index.html
- Lambda Node.js 20.x → recibe POST con datos del form → envía email vía SES
- API Gateway HTTP (endpoint POST /contact) con CORS
- Terraform en `infra/terraform/` con state local
- Integración del formulario en index.html con el nuevo endpoint
- Deploy en cuenta dev (009160036798), AWS provider ~> 5.0
- IAM Role con permisos ses:SendEmail + CloudWatch Logs

**Out of Scope:**
- CloudFront + S3 (hosting estático — fase posterior)
- Certificado ACM
- Migración a producción
- Integración con coupr-event-ingestor o SQS existente
- CI/CD pipeline para Terraform

## Context for Development

### Codebase Patterns

- **Proyecto estático**: HTML único (`index.html`, 63KB) con Tailwind CSS vía CDN, sin build system
- **Sin backend**: Todo es client-side, no hay package.json ni node_modules en el proyecto raíz
- **Modal existente**: El form modal está en `index.html` (líneas 948-1012) con ID `demoModal`
- **Form fields**: fullName, email, organization, role, mobile, message (6 campos, message opcional)
- **Form handler actual**: Solo hace `console.log(data)` y muestra success message — NO envía datos a ningún backend (líneas 1157-1189)
- **JS inline**: Todo el JavaScript está en `<script>` tags inline (Swiper, IntersectionObserver, scroll, modal, form)
- **Sin favicon**: No hay `<link rel="icon">` en el `<head>`, no existía archivo favicon

### Files to Reference

| File | Purpose | Status |
| ---- | ------- | ------ |
| `index.html` | Landing page — agregar favicon `<link>` + modificar form handler JS | MODIFICAR |
| `assets/brand/couprLogo.png` | Favicon descargado de coupr.io (424x399 PNG, 51KB) | YA DESCARGADO |
| `infra/terraform/provider.tf` | AWS provider ~> 5.0, backend local | CREAR |
| `infra/terraform/main.tf` | API Gateway HTTP + ruta POST /contact + CORS | CREAR |
| `infra/terraform/lambda.tf` | Lambda function + IAM role + permisos SES | CREAR |
| `infra/terraform/variables.tf` | Variables: region, recipient_email, sender_email | CREAR |
| `infra/terraform/outputs.tf` | Output: API endpoint URL | CREAR |
| `lambdas/contact-form/index.js` | Handler: parse body → ses.sendEmail() → response | CREAR |

### Technical Decisions

- **Cuenta AWS**: Dev (009160036798) — SES identity y Route53 ya existen ahí
- **State backend**: Local (`terraform.tfstate` en disco, consistente con dev existente)
- **AWS Provider**: ~> 5.0 (consistente con dev en coupr-iac)
- **Runtime**: Node.js 20.x — AWS SDK v3 incluido en runtime, no necesita dependencias externas
- **SES Identity**: `contact@coupr.io` ya verificada en dev
- **Route53 Zone**: `coupr.io` pública — Zone ID `Z0763905XREAJRPN21B0`
- **Tags obligatorios**: `Environment=dev, Terraform=true, Project=coupr, Owner=DevOps`
- **CORS**: Habilitado con `Access-Control-Allow-Origin: *` (la landing se sirve desde Vercel actualmente)
- **Favicon**: PNG de coupr.io (`assets/brand/couprLogo.png`), referenciado con `<link rel="icon">`
- **Lambda packaging**: Zip del directorio `lambdas/contact-form/` — sin layers ni Docker
- **AWS SDK v3**: Incluido en Node.js 20.x runtime de Lambda, no necesita bundling

### Anchor Points en index.html

- **Head section** (línea 5-7): Agregar `<link rel="icon">` después de `<title>`
- **Form element** (línea 981): `<form id="demoForm">` — 6 campos existentes
- **Form handler JS** (línea 1157-1189): `document.getElementById('demoForm').addEventListener('submit', ...)` — reemplazar `console.log` con `fetch()` al endpoint
- **Success message** (línea 1171-1179): Ya existe UI de confirmación, se mantiene

## Implementation Plan

### Tasks

- [ ] Task 1: Agregar favicon a index.html
  - File: `index.html`
  - Action: Agregar `<link rel="icon" type="image/png" href="assets/brand/couprLogo.png">` en el `<head>`, después de la línea `<title>Coupr - Intelligent Retail Assistant</title>`
  - Notes: El archivo `assets/brand/couprLogo.png` ya está descargado. Es el mismo ícono que usa coupr.io en producción.

- [ ] Task 2: Crear código de la Lambda contact-form
  - File: `lambdas/contact-form/index.js`
  - Action: Crear handler que:
    1. Parsee el body del evento (API Gateway HTTP payload format 2.0)
    2. Extraiga campos: fullName, email, organization, role, mobile, message
    3. Valide campos requeridos (fullName, email, organization, role, mobile)
    4. Construya HTML email con los datos del formulario formateado profesionalmente
    5. Envíe email vía SES (`@aws-sdk/client-ses` — incluido en runtime):
       - From: `contact@coupr.io`
       - To: variable de entorno `RECIPIENT_EMAIL`
       - Subject: `"New Demo Request from {fullName} - {organization}"`
       - Body: HTML con tabla de datos del formulario
    6. Retorne response con CORS headers (`Access-Control-Allow-Origin: *`)
    7. Maneje errores con respuesta JSON apropiada
  - Notes: AWS SDK v3 viene incluido en Node.js 20.x runtime. Import: `{ SESClient, SendEmailCommand } from "@aws-sdk/client-ses"`. El handler debe soportar el OPTIONS preflight (CORS) retornando 200 con headers.

- [ ] Task 3: Crear Terraform provider config
  - File: `infra/terraform/provider.tf`
  - Action: Crear configuración con:
    - `terraform.required_providers.aws` source `hashicorp/aws` version `~> 5.0`
    - `terraform.required_version` >= 1.0
    - `terraform.backend "local"` con path `terraform.tfstate`
    - `provider "aws"` con region `var.aws_region`
    - Default tags: `Environment=dev, Terraform=true, Project=coupr, Owner=DevOps`
  - Notes: Consistente con convenciones de coupr-iac ambiente dev.

- [ ] Task 4: Crear Terraform variables
  - File: `infra/terraform/variables.tf`
  - Action: Definir variables:
    - `aws_region` (string, default: `"us-east-1"`)
    - `recipient_email` (string, sensitive, sin default — email del CEO)
    - `sender_email` (string, default: `"contact@coupr.io"`)
    - `project_name` (string, default: `"coupr-landing"`)
    - `environment` (string, default: `"dev"`)
  - Notes: `recipient_email` no tiene default por seguridad — se pasa via `terraform.tfvars` o `-var`.

- [ ] Task 5: Crear Terraform Lambda + IAM
  - File: `infra/terraform/lambda.tf`
  - Action: Crear recursos:
    1. `data "archive_file" "contact_form"` — zip de `../../lambdas/contact-form/`
    2. `aws_iam_role "contact_form_lambda"` — assume role policy para Lambda service
    3. `aws_iam_role_policy "contact_form_ses"` — permisos `ses:SendEmail`, `ses:SendRawEmail` sobre `arn:aws:ses:us-east-1:009160036798:identity/coupr.io`
    4. `aws_iam_role_policy_attachment "lambda_basic"` — `AWSLambdaBasicExecutionRole` para CloudWatch Logs
    5. `aws_lambda_function "contact_form"`:
       - function_name: `${var.project_name}-contact-form`
       - runtime: `nodejs20.x`
       - handler: `index.handler`
       - memory_size: 128
       - timeout: 10
       - filename: data.archive_file output
       - source_code_hash: data.archive_file output
       - environment variables: `RECIPIENT_EMAIL`, `SENDER_EMAIL`
    6. `aws_lambda_permission "apigw"` — permitir invocación desde API Gateway
    7. `aws_cloudwatch_log_group` — `/aws/lambda/${function_name}` con retention 14 días
  - Notes: El zip se genera automáticamente con `archive_file` data source. No necesita build step manual.

- [ ] Task 6: Crear Terraform API Gateway
  - File: `infra/terraform/main.tf`
  - Action: Crear recursos:
    1. `aws_apigatewayv2_api "landing"`:
       - name: `${var.project_name}-api`
       - protocol_type: `HTTP`
       - cors_configuration: allow_origins `["*"]`, allow_methods `["POST", "OPTIONS"]`, allow_headers `["Content-Type"]`
    2. `aws_apigatewayv2_stage "default"`:
       - name: `$default`
       - auto_deploy: true
    3. `aws_apigatewayv2_integration "contact_form"`:
       - integration_type: `AWS_PROXY`
       - integration_uri: Lambda invoke ARN
       - payload_format_version: `"2.0"`
    4. `aws_apigatewayv2_route "post_contact"`:
       - route_key: `"POST /contact"`
       - target: integration
  - Notes: CORS se configura a nivel de API Gateway. El stage `$default` con auto_deploy evita necesidad de deployment resource.

- [ ] Task 7: Crear Terraform outputs
  - File: `infra/terraform/outputs.tf`
  - Action: Crear outputs:
    - `api_endpoint` — URL del API Gateway (`aws_apigatewayv2_api.landing.api_endpoint`)
    - `contact_form_url` — URL completa del endpoint (`${api_endpoint}/contact`)
    - `lambda_function_name` — nombre de la Lambda
    - `lambda_function_arn` — ARN de la Lambda
  - Notes: `contact_form_url` es el valor que se usará en el `fetch()` del form handler en index.html.

- [ ] Task 8: Crear terraform.tfvars.example
  - File: `infra/terraform/terraform.tfvars.example`
  - Action: Crear archivo ejemplo:
    ```
    recipient_email = "ceo@coupr.io"
    ```
  - Notes: El archivo real `terraform.tfvars` no se commitea (agregar a .gitignore). El example sirve de referencia.

- [ ] Task 9: Actualizar .gitignore
  - File: `.gitignore`
  - Action: Agregar al final:
    ```
    # Terraform
    infra/terraform/.terraform/
    infra/terraform/terraform.tfstate
    infra/terraform/terraform.tfstate.backup
    infra/terraform/terraform.tfvars
    infra/terraform/.terraform.lock.hcl

    # Lambda zip artifacts
    infra/terraform/*.zip
    ```
  - Notes: Proteger state, tfvars (contiene email del CEO), y archivos generados.

- [ ] Task 10: Modificar form handler en index.html
  - File: `index.html`
  - Action: Reemplazar el form handler JS actual (líneas 1157-1189) con:
    1. Obtener el endpoint URL (definirla como constante al inicio del script — se actualiza post-deploy)
    2. En el submit handler:
       - Deshabilitar botón submit y mostrar estado "Sending..."
       - Recoger datos con `FormData` → `Object.fromEntries`
       - `fetch(ENDPOINT_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) })`
       - Si respuesta OK: mostrar success message existente
       - Si error: mostrar mensaje de error, re-habilitar botón
    3. Mantener el success message y auto-close existentes
  - Notes: El endpoint URL se configurará como constante JS. Después del `terraform apply`, se obtiene de los outputs y se actualiza manualmente en el HTML. Agregar loading state y error handling que no existían antes.

- [ ] Task 11: Deploy y verificación
  - Action: Secuencia de deploy:
    1. `cd infra/terraform && terraform init`
    2. Crear `terraform.tfvars` con el email del CEO
    3. `terraform plan` — verificar recursos a crear
    4. `terraform apply` — desplegar infraestructura
    5. Copiar output `contact_form_url` al JS de `index.html`
    6. Probar con `curl -X POST <endpoint> -H "Content-Type: application/json" -d '{"fullName":"Test","email":"test@test.com","organization":"Test Co","role":"CTO","mobile":"555-0000"}'`
    7. Verificar recepción del email
    8. Probar formulario desde la landing page en navegador
  - Notes: Task manual que requiere credenciales AWS y email del CEO.

### Acceptance Criteria

- [ ] AC 1: Given la landing page cargada en un navegador, when se inspecciona la pestaña del navegador, then se muestra el ícono de Coupr (couprLogo.png) como favicon.

- [ ] AC 2: Given un usuario en la landing page, when llena el formulario con datos válidos (fullName, email, organization, role, mobile) y hace click en "Request a Demo", then el botón muestra estado de loading, se envía la data al endpoint, y se muestra el mensaje de éxito "Thank you! We'll be in touch within 24 hours".

- [ ] AC 3: Given un formulario enviado exitosamente, when la Lambda procesa el request, then el CEO recibe un email desde `contact@coupr.io` con subject "New Demo Request from {fullName} - {organization}" y body HTML con todos los campos del formulario.

- [ ] AC 4: Given un usuario que envía el formulario con campos requeridos faltantes, when la Lambda recibe el request, then retorna error 400 con mensaje descriptivo y el formulario muestra un mensaje de error al usuario sin perder los datos ingresados.

- [ ] AC 5: Given la landing servida desde Vercel (dominio diferente), when el formulario hace POST al API Gateway, then no hay errores de CORS y la request se completa exitosamente.

- [ ] AC 6: Given la infraestructura desplegada con Terraform, when se ejecuta `terraform plan`, then no hay cambios pendientes (state consistente con la realidad).

- [ ] AC 7: Given el endpoint de la API, when se envía un POST con `curl` y payload JSON válido, then la respuesta es 200 con body `{"message":"Email sent successfully"}` y el email llega al destinatario.

- [ ] AC 8: Given un error en SES (ej: throttling), when la Lambda falla al enviar email, then retorna error 500 con mensaje genérico y loguea el error detallado en CloudWatch.

## Additional Context

### Dependencies

- **Pre-existentes en cuenta dev (009160036798)**:
  - Identidad SES `contact@coupr.io` verificada
  - Zona Route53 `coupr.io` pública (Zone ID: `Z0763905XREAJRPN21B0`)
- **Herramientas locales requeridas**:
  - AWS CLI configurado con credenciales de la cuenta dev
  - Terraform >= 1.0 instalado
- **Runtime**:
  - Node.js 20.x en AWS Lambda (incluye AWS SDK v3 — no se necesita npm install)

### Testing Strategy

- **Favicon**: Verificación visual en navegador (tab icon) + inspección del `<head>` HTML
- **Lambda unitaria**: `curl -X POST` al endpoint con payload JSON de prueba → verificar respuesta 200 y recepción de email
- **Validación de campos**: `curl` con campos faltantes → verificar respuesta 400 con mensaje de error
- **CORS**: Abrir la landing en navegador (desde Vercel domain), enviar formulario, verificar en DevTools Network que no hay errores CORS
- **Error handling**: Enviar request con email inválido o campo corrupto → verificar que la Lambda no crashea y retorna error apropiado
- **Terraform**: `terraform plan` post-deploy debe mostrar "No changes"
- **Email formato**: Verificar que el email recibido tiene formato HTML legible con todos los campos del formulario

### Notes

- **Riesgo: SES sandbox en dev** — Si SES en dev está en sandbox, solo puede enviar a emails verificados. El email del CEO debe estar verificado como destinatario, o hay que solicitar salida de sandbox.
- **Post-deploy manual**: Después del `terraform apply`, hay que copiar manualmente la URL del endpoint al JS de `index.html` y hacer commit/push para que Vercel lo despliegue.
- **Sin package.json en Lambda**: AWS SDK v3 viene incluido en Node.js 20.x runtime, no se necesita `npm install` ni dependencias externas. El directorio `lambdas/contact-form/` solo necesita `index.js`.
- **Favicon como PNG**: El favicon es PNG (no .ico). Los navegadores modernos soportan PNG como favicon sin problemas.
- **Evolución futura**: En una fase posterior se puede agregar CloudFront + S3 para servir la landing como static site desde AWS, eliminando la dependencia de Vercel.

## Review Notes

- Adversarial review completado
- Findings: 14 total, 7 corregidos, 7 skipped (by design / out of scope / noise)
- Resolution approach: auto-fix
- Fixes aplicados: SES ARN dinámico (región + account_id), var.environment en provider tags, validación de email en Lambda, truncado de campos (max 500 chars), URL-encoding en mailto/tel hrefs, placeholder genérico en tfvars.example
