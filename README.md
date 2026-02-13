Aquí va el resumen de lo que encontré:
La página https://www.coupr.io/ está hosteada como un sitio estático (SPA) con la siguiente arquitectura:
DNS (Route53 en cuenta Coupr 009160036798):

coupr.io → Registro A (Alias) → d28xohnl8h9ti5.cloudfront.net
www.coupr.io → CNAME → d28xohnl8h9ti5.cloudfront.net

CDN:

Distribución CloudFront: d28xohnl8h9ti5.cloudfront.net (activa, sirviendo tráfico)

Origen:

Amazon S3 — lo confirmé con los headers HTTP (server: AmazonS3). El bucket más probable es coupr-statics que está en la cuenta Coupr management (009160036798) en us-east-2 (Ohio).

El misterio: La distribución CloudFront d28xohnl8h9ti5.cloudfront.net no aparece en ninguna de las dos cuentas (ni en Coupr management ni en 25-07-24 Production). Esto puede significar que fue creada con Terraform (vi que existe el bucket coupr-infra-tfstate) y podría haber sido creada en un perfil o una cuenta diferente, o que fue desplegada por otro servicio. También es posible que fue eliminada del console/API pero CloudFront todavía la mantiene activa con contenido cacheado.
Te sugiero:

Revisar el estado de Terraform (coupr-infra-tfstate) para ver qué recursos gestiona y en qué cuenta se creó la distribución de CloudFront
Verificar el bucket coupr-statics en la cuenta Coupr management (us-east-2) — ese es muy probablemente donde están los archivos del sitio web
Verificar si hay alguna otra cuenta AWS fuera de esta organización que podría tener la distribución

--

necesito dos cosas de la landing actual: https://www.coupr.io/

 1. Sacar el ícono para poner en una nueva landing que estoy construyendo
 
2. Saber que servicio se usa o a que endpoint apunta el botón de Request a Demo en: https://www.coupr.io/schedule-demo 

será que podemos hacer ingeniería inversa para esto desde el navegador? tu estarías capacitado para hacerlo? esas dos cosas son las últimas que me hacen falta para culminar la construcción del nuevo landing page que estoy haciendo 

-- respuesta 

¡Listo! Aquí está la arquitectura completa del endpoint del botón "Request a Demo":
Flujo completo:

Landing page (www.coupr.io/schedule-demo) hace un POST a https://events.stg.coupr.io/events
Route53 resuelve events.stg.coupr.io → d-erfp4sk1va.execute-api.us-east-1.amazonaws.com
API Gateway (API: events, ID: 2j6slcdlc6, tipo HTTP) recibe la request en la ruta POST /events
La integración invoca la función Lambda: coupr-event-ingestor (región us-east-1)

Detalles adicionales de la integración:

ID de integración: sd07tb7
Payload format version: 2.0
Timeout: 30,000ms (30 segundos)
Sin autorización configurada (la ruta es abierta)
También hay una ruta POST /test en la misma API (igualmente con Lambda)

Así que el servicio detrás del formulario es la Lambda coupr-event-ingestor en la cuenta Coupr (009160036798) en us-east-1. ¿Quieres que entre a ver el código de esa Lambda para entender qué hace con los datos del formulario?