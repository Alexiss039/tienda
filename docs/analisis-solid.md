# Plantilla de análisis de principios SOLID - O'Clock Lens

**Proyecto:** O'Clock Lens · **Entregable:** 2 · **Componentes analizados:** los que cambian entre el Entregable 1 y el 2 (carrito/cupones y pago con Wompi), más los servicios del flujo de compra.

## 1. Cómo se leyó este análisis

- **Antes (Entregable 1):** el sistema descrito en el PDF, con la lógica en controladores (`CarritoController`, `ProductosController`, `WompiController`).
- **Después (Entregable 2):** el prototipo en `js/` con clases por capas.
- Se indica un nivel de cumplimiento por principio (Cumple / Cumple parcialmente) y se declaran las limitaciones, porque un análisis que solo muestra aciertos no es verificable.

## 2. Resumen

| Principio | Componente principal | Cumplimiento |
|---|---|---|
| S - Responsabilidad única | `CarritoService`, `PedidoService`, `CheckoutService`, `NotificadorCorreo`, `Bitacora` | Cumple parcialmente (`CatalogoService` hace varias cosas) |
| O - Abierto/cerrado | `EstrategiaDescuento` y `PasarelaPago` | Cumple parcialmente (la fábrica se edita al agregar un tipo) |
| L - Sustitución de Liskov | Las tres estrategias de descuento; `WompiAdapter` frente a `PasarelaPago` | Cumple (tras corregir el tope del porcentaje) |
| I - Segregación de interfaces | `EstrategiaDescuento` (2 métodos), `PasarelaPago` (2 métodos) | Cumple |
| D - Inversión de dependencias | `CheckoutService` depende de `PasarelaPago`; composición en `app.js` | Cumple parcialmente (usa clases estáticas y globales concretas) |

## 3. Análisis por principio

### S - Responsabilidad única

- **Antes:** `CarritoController::aplicarCupon` validaba el cupón, decidía el tipo de descuento y calculaba el total; el cálculo del envío ($10.000) estaba en el mismo controlador. Los controladores de productos y Wompi mezclaban construcción de la firma, creación del pedido y respuesta HTTP.
- **Después:**

| Clase | Única razón para cambiar |
|---|---|
| `CarritoService` | Cómo se arma el carrito y su resumen |
| `PedidoService` | Ciclo de vida y persistencia del pedido |
| `CheckoutService` | Orden de los pasos al pagar |
| `WompiAdapter` | Formato de la pasarela |
| `NotificadorCorreo` | Cómo se avisa la compra |
| `Bitacora` | Cómo se audita (RNF-09) |

- **Evidencia:** `CheckoutService.pagar` solo encadena llamadas a otros servicios; no calcula, no persiste y no conoce el formato de Wompi.
- **Limitación:** `CatalogoService` reúne lectura del catálogo, comentarios y CRUD de productos, y `AuthService` mezcla registro, sesión y proyección pública del usuario. Se dejaron juntos por tamaño del MVP; el siguiente paso sería separar `ComentarioService`.

### O - Abierto para extensión, cerrado para modificación

- **Antes:** un descuento nuevo (por ejemplo "2x1") obligaba a editar el `if` de `aplicarCupon`.
- **Después:** un descuento nuevo es una clase que extiende `EstrategiaDescuento`; `CarritoService` no cambia. Una pasarela nueva es otra clase que implementa `PasarelaPago`; `CheckoutService` no cambia.
- **Limitación:** `DescuentoFactory.crear` sí se edita al agregar un tipo (una rama más). El principio se cumple para el cálculo, pero no para la selección. Hacerlo completamente cerrado exigiría un registro de estrategias, lo que se descartó como sobreingeniería para dos tipos.

### L - Sustitución de Liskov

- **Contrato de `EstrategiaDescuento.calcular(subtotal)`:** devuelve un número entre 0 y `subtotal`.
- **Defecto encontrado y corregido durante este análisis:** `DescuentoPorcentual` no limitaba el resultado; un cupón de 150 % sobre $100.000 devolvía $150.000 y dejaba un total negativo, mientras que `DescuentoFijo` sí lo limitaba. Ese comportamiento rompía la sustituibilidad. Se agregó `Math.min(subtotal, …)` y se verificó: 150 % de 100.000 = 100.000.
- **Estado actual:** las tres estrategias respetan el mismo contrato y `CarritoService` las usa sin distinguirlas. `WompiAdapter` devuelve siempre `{referencia, transaccionId, aprobado, crudo}`, que es lo que `PasarelaPago` promete.
- **Límite:** JavaScript no verifica el contrato en compilación; se comprobó con pruebas manuales.

### I - Segregación de interfaces

- **`PasarelaPago`:** solo dos operaciones (`cobrar`, `validarNotificacion`), las dos usadas por el checkout; ningún cliente depende de métodos que no usa.
- **`EstrategiaDescuento`:** `calcular` y `etiqueta`. Al revisar se vio que `etiqueta` no se usaba; en lugar de dejar código muerto se conectó al resumen del carrito (muestra `OCLOCK10 · 10%`).
- **Antes:** no existían contratos; el controlador de Wompi exponía una sola acción que hacía todo.

### D - Inversión de dependencias

- **Después:** `CheckoutService` recibe `PasarelaPago` por constructor y no sabe qué pasarela es. Todas las dependencias se construyen en un único lugar, `app.js` (raíz de composición). Para cambiar de pasarela basta una línea.
- **Evidencia:** los servicios reciben `almacen`, `catalogo`, `notificador` y `bitacora` por constructor.
- **Antes:** el controlador llamaba a Wompi y calculaba la firma directamente (dependencia de la clase concreta).
- **Limitaciones:**
  - `CarritoService` usa `DescuentoFactory` (clase estática) y `Reglas` directamente.
  - Las páginas acceden al objeto global `OCL` (localizador de servicios) en lugar de recibir dependencias.
  - `Almacen` es un objeto global concreto.
  - Estas concesiones se aceptaron para no introducir un contenedor de inyección en un prototipo estático.

## 4. Trazabilidad con el Entregable 1

| Elemento del Entregable 1 | Relación con SOLID |
|---|---|
| RN-03, CU-02 | S, O, L (estrategias de descuento) |
| CU-01, RF-11/12, RNF-02 | S, I, D (adaptador de pasarela y orquestación) |
| RNF-06 Mantenibilidad (separar responsabilidades) | S y D en la arquitectura por capas |
| Diagrama de clases | Refinado en los niveles 3 y 4 de C4 |
