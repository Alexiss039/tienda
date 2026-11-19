# Plantilla de análisis de principios SOLID - O'Clock Lens

**Proyecto:** O'Clock Lens · **Entregable:** 3 · **Componentes analizados:** los que evolucionan entre los entregables: carrito y cupones, pago con Wompi, y en el Entregable 3 el ciclo de vida del pedido (State) y sus reacciones (Observer).

## 1. Cómo se leyó este análisis

- **Antes (Entregable 1):** el sistema descrito en el PDF, con la lógica en controladores (`CarritoController`, `ProductosController`, `WompiController`).
- **Entregable 2:** el prototipo con clases por capas, con `PedidoService` validando estados con listas y condicionales y llamando directamente al correo y a la bitácora.
- **Entregable 3:** el prototipo con los patrones State y Observer sobre ese servicio.
- Se indica un nivel de cumplimiento por principio (Cumple / Cumple parcialmente) y se declaran las limitaciones, porque un análisis que solo muestra aciertos no es verificable.

## 2. Resumen

| Principio | Componente principal | Cumplimiento |
|---|---|---|
| S - Responsabilidad única | `CarritoService`, `PedidoService`, `CheckoutService`, `EstadoPedido`, `RegistroEventosPedido`, `NotificadorCorreo` | Cumple parcialmente (`CatalogoService` hace varias cosas) |
| O - Abierto/cerrado | `EstrategiaDescuento`, `PasarelaPago` y `Observador` | Cumple parcialmente (la fábrica y el registro de estados se editan al agregar un tipo) |
| L - Sustitución de Liskov | Estrategias de descuento, `EstadoPedido` y sus estados, observadores, `WompiAdapter` | Cumple, tras corregir dos defectos encontrados al analizar y probar |
| I - Segregación de interfaces | `PasarelaPago`, `EstrategiaDescuento`, `Observador` y `EstadoPedido` | Cumple parcialmente (`EstadoPedido` tiene cinco operaciones) |
| D - Inversión de dependencias | `CheckoutService` depende de `PasarelaPago`; `PedidoService` recibe `EventosPedido`; composición en `app.js` | Cumple parcialmente (usa globales y registros estáticos concretos) |

## 3. Análisis por principio

### S - Responsabilidad única

- **Antes:** `CarritoController::aplicarCupon` validaba el cupón, decidía el tipo de descuento y calculaba el total; los controladores de productos y Wompi mezclaban construcción de la firma, creación del pedido y respuesta HTTP.
- **Entregable 2:** `PedidoService` persistía pedidos, validaba transiciones de estado con listas y además invocaba al notificador y a la bitácora.
- **Entregable 3:**

| Clase | Única razón para cambiar |
|---|---|
| `CarritoService` | Cómo se arma el carrito y su resumen |
| `PedidoService` | Persistencia del pedido y orden de los pasos al cambiarlo |
| `EstadoPedido` y sus estados | Reglas de transición del pedido (RN-04 y RN-05) |
| `EventosPedido` | Cómo se suscriben y notifican los observadores |
| `RegistroEventosPedido` | Qué se escribe en la bitácora por cada evento (RNF-09) |
| `NotificadorCorreo` | Cómo se avisa la compra por correo |
| `CheckoutService` | Orden de los pasos al pagar |
| `WompiAdapter` | Formato de la pasarela |

- **Mejora del Entregable 3:** `PedidoService` dejó de depender de `NotificadorCorreo` y de `Bitacora` (su constructor pasó de tres dependencias a dos). Las reglas de transición salieron del servicio hacia los estados.
- **Limitación:** `CatalogoService` reúne lectura del catálogo, comentarios y CRUD de productos, y `AuthService` mezcla registro, sesión y proyección pública del usuario. Se dejaron juntos por el tamaño del MVP; el siguiente paso sería separar `ComentarioService`.

### O - Abierto para extensión, cerrado para modificación

- **Antes:** un descuento nuevo, o una reacción nueva al pago, obligaba a editar el `if` del controlador o el servicio.
- **Entregable 3:**
  - Un descuento nuevo es una clase que extiende `EstrategiaDescuento`; `CarritoService` no cambia.
  - Una pasarela nueva es otra clase que implementa `PasarelaPago`; `CheckoutService` no cambia.
  - Una reacción nueva (por ejemplo, descontar inventario) es un observador suscrito en `app.js`; `PedidoService` no cambia.
- **Limitaciones:** `DescuentoFactory.crear` se edita al agregar un tipo de descuento (una rama más). Un estado nuevo exige una entrada en `REGISTRO_ESTADOS` y, normalmente, modificar el estado vecino desde el que se llega a él. Un evento nuevo exige agregarlo a la lista `EventosPedido.TODOS`. El principio se cumple para el cálculo y las reacciones, pero no para la selección ni para el registro de estados; hacerlo cerrado exigiría registros auto-descubiertos, lo que se descartó como sobreingeniería.

### L - Sustitución de Liskov

- **Estrategias:** el contrato de `calcular(subtotal)` es devolver un número entre 0 y `subtotal`. Al analizarlo se encontró que `DescuentoPorcentual` no limitaba el resultado: un cupón del 150 % sobre $100.000 devolvía $150.000 y dejaba un total negativo, mientras que `DescuentoFijo` sí lo limitaba. Se agregó `Math.min(subtotal, …)` y se verificó (150 % de 100.000 = 100.000).
- **Estados:** todos los estados concretos respetan el contrato de `EstadoPedido`: cada transición devuelve un `EstadoPedido` o lanza `Transición no permitida: origen → destino`. `PedidoService` los usa sin distinguirlos. `EstadoEnviado.despachar()` devuelve el mismo estado (para corregir la guía); no rompe el contrato porque sigue devolviendo un estado.
- **Observadores:** el contrato de `actualizar(evento, datos)` incluye atender cualquier evento aunque su contenido varíe (no todos traen un `pedido`). Al probarlo, `RegistroEventosPedido` fallaba con el evento "pedido no encontrado" porque armaba todos los mensajes por adelantado y accedía a `datos.pedido.entidad`, que no existe en ese evento. Se corrigió construyendo cada mensaje solo cuando ocurre su evento; la prueba `Observer: pedido no encontrado auditado` lo cubre.
- **Adaptador:** `WompiAdapter` devuelve siempre `{referencia, transaccionId, aprobado, crudo}`, que es lo que `PasarelaPago` promete.
- **Límite:** JavaScript no verifica el contrato en compilación; se comprobó con las 29 pruebas de `tests/pedidos.test.js` y con pruebas manuales.

### I - Segregación de interfaces

- **`PasarelaPago`:** dos operaciones (`cobrar`, `validarNotificacion`), las dos usadas por el checkout.
- **`Observador`:** una sola operación (`actualizar`); cada observador atiende solo los eventos a los que se suscribe.
- **`EstrategiaDescuento`:** `calcular` y `etiqueta`. Al revisar se vio que `etiqueta` no se usaba; en lugar de dejar código muerto se conectó al resumen del carrito (muestra `OCLOCK10 · 10%`).
- **`EstadoPedido`:** cinco operaciones (`aprobarPago`, `rechazarPago`, `despachar`, `entregar`, `siguientesManuales`). Cada estado concreto implementa solo las que le corresponden y hereda de la base el rechazo por defecto, de modo que nadie está obligado a implementar métodos que no usa. Aun así, quien consume un estado ve las cinco operaciones; por eso se marca como cumplimiento parcial. Separarlo en interfaces de "pago" y de "envío" duplicaría clases para un ciclo de vida de cinco estados.

### D - Inversión de dependencias

- **Entregable 3:** `CheckoutService` recibe `PasarelaPago` por constructor y no sabe qué pasarela es. `PedidoService` recibe `EventosPedido` por constructor y no conoce a los observadores. Todas las dependencias se construyen en un único lugar, `app.js` (raíz de composición): cambiar de pasarela es una línea y agregar un observador es otra.
- **Evidencia:** los servicios reciben `almacen`, `catalogo` y `eventos` por constructor.
- **Antes:** el controlador llamaba a Wompi y calculaba la firma directamente (dependencia de la clase concreta); `PedidoService` llamaba al notificador y a la bitácora concretos.
- **Limitaciones:**
  - `CarritoService` usa `DescuentoFactory` (clase estática) y `Reglas` directamente.
  - `PedidoService` resuelve estados con `EstadoPedido.de(...)` (registro estático) y usa las constantes de `EventosPedido`.
  - Las páginas acceden al objeto global `OCL` (localizador de servicios) y `Almacen` es un objeto global concreto.
  - Estas concesiones se aceptaron para no introducir un contenedor de inyección en un prototipo estático.

## 4. Trazabilidad con los entregables anteriores

| Elemento anterior | Relación con SOLID |
|---|---|
| RN-03, CU-02 | S, O, L (estrategias de descuento) |
| CU-01, RF-11/12, RNF-02 | S, I, D (adaptador de pasarela y orquestación) |
| RN-04, RN-05 (estados del pedido) | S, O, L (State) |
| RF-12, RNF-09 (correo y auditoría) | S, O, D (Observer) |
| RNF-06 Mantenibilidad (separar responsabilidades) | S y D en la arquitectura por capas |
| Diagrama de clases | Refinado en los niveles 3 y 4 de C4 |
