# Contratos de API — Coupr Landing Page

> Generado: 2026-02-12 | Modo: initial_scan | Nivel: exhaustive

## Resumen

La landing page tiene un único endpoint de API para procesamiento del formulario de solicitud de demo.

- **Base URL**: `https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com`
- **Protocolo**: HTTP API (API Gateway v2)
- **Autenticación**: Ninguna (endpoint público)
- **CORS**: Habilitado (`Access-Control-Allow-Origin: *`)

## Endpoints

### POST /contact

**Propósito**: Recibir datos del formulario de solicitud de demo y enviar email de notificación al equipo de Coupr.

**URL**: `https://s04r3s9ik7.execute-api.us-east-1.amazonaws.com/contact`

#### Request

```http
POST /contact HTTP/1.1
Content-Type: application/json
```

**Body (JSON)**:

| Campo | Tipo | Requerido | Max Length | Descripción |
|---|---|---|---|---|
| `fullName` | string | Sí | 500 | Nombre completo del prospecto |
| `email` | string | Sí | 500 | Email del prospecto (validado con regex) |
| `organization` | string | Sí | 500 | Empresa/organización |
| `role` | string | Sí | 500 | Cargo/rol del prospecto |
| `mobile` | string | Sí | 500 | Número de teléfono |
| `message` | string | No | 500 | Mensaje adicional (opcional) |

**Ejemplo de request**:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "organization": "Acme Inc",
  "role": "Operations Manager",
  "mobile": "(555) 123-4567",
  "message": "Interested in a pilot program"
}
```

#### Responses

**200 OK** — Email enviado exitosamente:

```json
{
  "message": "Email sent successfully"
}
```

**400 Bad Request** — Campos requeridos faltantes:

```json
{
  "message": "Missing required fields: email, mobile"
}
```

**400 Bad Request** — Email inválido:

```json
{
  "message": "Invalid email address"
}
```

**500 Internal Server Error** — Error del servidor (SES, etc.):

```json
{
  "message": "Internal server error"
}
```

#### CORS Preflight

```http
OPTIONS /contact HTTP/1.1
```

**Response headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

#### Validación

1. **Campos requeridos**: `fullName`, `email`, `organization`, `role`, `mobile` — todos deben estar presentes y no vacíos
2. **Formato de email**: Validado con regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. **Truncado**: Todos los campos se truncan a 500 caracteres máximo
4. **HTML escape**: Todos los valores se escapan antes de insertarlos en el email HTML

#### Efecto Secundario

Al procesar exitosamente el request, la Lambda envía un email HTML con los datos del formulario:
- **De**: `contact@coupr.io` (variable de entorno `SENDER_EMAIL`)
- **Para**: Email configurado en variable de entorno `RECIPIENT_EMAIL`
- **Asunto**: `"New Demo Request from {fullName} - {organization}"`
- **Body**: Email HTML con branding de Coupr y tabla de datos del formulario

## Infraestructura de la API

| Componente | Recurso AWS | Configuración |
|---|---|---|
| API | API Gateway v2 HTTP | `coupr-landing-api` |
| Stage | `$default` | Auto-deploy habilitado |
| Integración | AWS_PROXY | Payload format v2.0 |
| Función | Lambda Node.js 20.x | 128MB RAM, 10s timeout |
| Permisos | IAM Role | SES:SendEmail + CloudWatch Logs |
| Logging | CloudWatch | 14 días retención |
