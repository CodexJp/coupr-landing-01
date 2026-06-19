# Guía de Desarrollo — Coupr Landing Page

> Generado: 2026-05-21 | Modo: full_rescan | Nivel: exhaustive

## Prerrequisitos

| Herramienta | Versión | Por qué |
|---|---|---|
| Navegador moderno | Chrome / Firefox / Safari | Edición y prueba visual |
| Editor de código | VS Code (recomendado) | Edición del proyecto |
| Terraform | `>= 1.0` | Gestión de infraestructura AWS |
| AWS CLI | v2 | Deploy a S3 e invalidación de CloudFront |
| Credenciales AWS | Acceso a cuenta dev `009160036798` | Aplicar cambios de infra |
| Python 3 (opcional) | Cualquier 3.x | Servir el HTML localmente |

> **Nota**: No se requiere Node.js local. El proyecto no tiene `package.json`. La Lambda corre con el runtime de Node.js 20.x de AWS.

## Setup Inicial

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd landingpage
```

### 2. Configurar AWS CLI (si necesitas deploy de infra)

```bash
aws configure
# AWS Access Key ID:     <de la cuenta dev>
# AWS Secret Access Key: <de la cuenta dev>
# Default region:        us-east-1
# Default output format: json
```

Verifica que estás en la cuenta correcta:

```bash
aws sts get-caller-identity --query Account --output text
# Esperado: 009160036798
```

### 3. Configurar Terraform (sólo si trabajarás en infra)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edita terraform.tfvars con el email destinatario, p.ej.:
# recipient_email = "tu-email@coupr.io"

terraform init
```

## Desarrollo Local del Frontend

No hay build step. Hay dos formas de visualizar `index.html`:

### Opción A: Abrirlo directamente

```bash
open index.html              # macOS
xdg-open index.html          # Linux
start index.html             # Windows
```

> ⚠️ Algunos navegadores bloquean recursos cargados desde CDN sobre el protocolo `file://`. Si los estilos no aparecen, usa la opción B.

### Opción B: Servidor local con Python

```bash
python3 -m http.server 8000
# Visitar http://localhost:8000
```

### Workflow típico

1. Editar `index.html` directamente (es el único archivo de frontend).
2. Refrescar el navegador (no hay HMR, no hay watch).
3. Inspeccionar en DevTools.

> Tailwind se compila en el navegador via CDN runtime. Se necesita conexión a internet para que los estilos rendericen correctamente.

## Desarrollo del Backend (Lambda)

### Estructura

- Código en `lambdas/contact-form/index.js` (ES5/CommonJS, `exports.handler`).
- Sin `package.json` propio — todas las dependencias vienen del runtime AWS Lambda Node.js 20.x.

### Flujo para modificar la Lambda

1. Editar `lambdas/contact-form/index.js`.
2. Aplicar con Terraform (re-empaqueta + sube automáticamente):

   ```bash
   cd infra/terraform
   terraform apply
   ```

   Terraform detecta el cambio vía `source_code_hash` del `archive_file`.

3. Verificar en CloudWatch que la nueva versión está activa:

   ```bash
   aws lambda get-function --function-name coupr-landing-contact-form --query 'Configuration.[LastModified,Version]'
   ```

### Testing local (opcional)

No hay runner local oficial, pero puedes simular el handler con `node`:

```bash
cd lambdas/contact-form
SENDER_EMAIL=contact@coupr.io RECIPIENT_EMAIL=test@example.com node -e "
  const { handler } = require('./index');
  handler({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({
      fullName: 'Test', email: 'test@test.com',
      organization: 'X', role: 'Dev', mobile: '555-0000'
    })
  }).then(console.log).catch(console.error);
"
```

> Requiere `@aws-sdk/client-ses` instalado localmente para invocar realmente a SES. Si solo quieres validar el camino de validación, comenta `await ses.send(command)`.

## Convenciones de Código

### HTML / Tailwind (frontend)

- **Mobile-first**: clases base son mobile; usa `md:`, `lg:`, `xl:` para breakpoints mayores.
- **Espaciado de secciones**: `mb-24` (96px) entre `<section>`s.
- **Containers**: `max-w-[1600px] mx-auto px-8`.
- **Cards**: `rounded-custom border border-slate-subtle/30 p-12 lg:p-20` para bloques grandes; `rounded-2xl border border-slate-subtle/30 p-8` para cards pequeñas.
- **Colores de marca**: usar `primary`/`secondary`/`text-main`/`text-muted` definidos en el config; evitar hex literals.
- **Iconos**: Material Symbols Outlined (`<span class="material-symbols-outlined">icon_name</span>`).
- **Animación on-scroll**: agregar clase `animate-on-scroll` al elemento; opcionalmente `animate-delay-{1..4}`, `animate-from-left/right`, `animate-scale`.
- **Smooth scroll**: cualquier `<a href="#some-id">` activa el scroll suave automáticamente (interceptado en JS).

### JavaScript (frontend)

- Vanilla JS, sin frameworks.
- Todo el JS vive inline en `<script>` al final del `<body>` de `index.html` (líneas 1017-1229).
- Listeners se agregan con `addEventListener`.
- Para abrir el modal desde cualquier botón, usar `onclick="openModal()"`.

### Lambda (`lambdas/contact-form/index.js`)

- Estilo CommonJS (`require`, `exports.handler`).
- Validación temprana, return rápido con códigos HTTP apropiados (400 input inválido, 500 error interno).
- Todo input al HTML del email pasa por `escapeHtml()`.
- Truncar inputs a `MAX_FIELD_LENGTH` (500 chars).
- Logs con `console.error` (van a CloudWatch automáticamente).

### Terraform

- Resources nombrados con prefijo `${var.project_name}-` (default `coupr-landing`).
- Tags obligatorios via `default_tags` en `provider.tf`: `Environment`, `Terraform=true`, `Project=coupr`, `Owner=DevOps`.
- Variables con `description` siempre, `sensitive = true` para secretos.

## Testing Manual

No hay tests automatizados. Smoke tests recomendados:

### 1. Health check del sitio

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://coupr.io
# Esperado: 200
```

### 2. CORS preflight del endpoint

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact
# Esperado: 200
```

### 3. Envío exitoso (cuidado: dispara email real)

```bash
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","organization":"Test","role":"Dev","mobile":"555"}'
# Esperado: 200 {"message":"Email sent successfully"}
```

### 4. Caso de error de validación

```bash
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test"}'
# Esperado: 400 {"message":"Missing required fields: email, organization, role, mobile"}
```

### 5. Validación de email malformado

```bash
curl -X POST https://vo29nu6c83.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"fullName":"T","email":"no-arroba","organization":"X","role":"X","mobile":"X"}'
# Esperado: 400 {"message":"Invalid email address"}
```

### 6. Verificación visual en producción

- Abrir https://coupr.io en navegador.
- Validar:
  - El video del hero reproduce en loop sin sonido.
  - El marquee de logos rota continuamente.
  - Los Swiper carousels (screenshots y testimonials) avanzan solos cada 4-5 s.
  - El modal de demo abre/cierra con click y con Escape.
  - El form envía y muestra el success state.

## Convenciones de Git

Basado en el log reciente:

- Mensajes en inglés, imperativo: `Add ...`, `Improve ...`, `Fix ...`.
- Cambios atómicos por feature/fix.
- No hay branch policy estricta documentada (asumir trunk-based en `main`).

## Troubleshooting Común

### Los estilos no se ven localmente

- Verifica conexión a internet (Tailwind viene por CDN).
- Si abriste el archivo con `file://`, usa `python3 -m http.server 8000`.
- Revisa la pestaña Network del DevTools por errores CORS.

### El form no envía / muestra "Something went wrong"

- Verifica que el endpoint en `index.html:1158` apunta al API Gateway correcto.
- `aws logs tail /aws/lambda/coupr-landing-contact-form --follow` para ver errores.

### `terraform apply` falla con error de credenciales

- `aws sts get-caller-identity` para confirmar que estás logueado en la cuenta `009160036798`.
- `aws configure list` para revisar profile activo.

### El cambio en la Lambda no se refleja

- Confirma que ejecutaste `terraform apply` después de editar.
- `source_code_hash` debe haber cambiado: `terraform show | grep source_code_hash`.

## Recursos Externos Documentados

- [Tailwind CSS docs](https://tailwindcss.com/docs)
- [Swiper.js v11 docs](https://swiperjs.com/swiper-api)
- [Material Symbols](https://fonts.google.com/icons)
- [AWS SDK v3 — SES Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [API Gateway v2 HTTP](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
