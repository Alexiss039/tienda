# Plantilla de análisis y selección de patrones GoF - O'Clock Lens

**Proyecto:** O'Clock Lens · **Entregable:** 2 · **Alcance:** MVP (HU-01, 02, 04, 05, 07, 09, 11, 13) más el apoyo de HU-08 (cupones) y HU-10/14 (estado y despacho)

## 1. Punto de partida (Entregable 1)

En el sistema descrito en el Entregable 1 dos reglas de negocio vivían mezcladas dentro de controladores:

| Necesidad | Cómo estaba | Problema |
|---|---|---|
| Descuento por cupón (RN-03) | `CarritoController::aplicarCupon` decidía con `strpos($cupon->descuento, '%')` y calculaba el valor en el mismo método | Cada tipo nuevo de descuento obliga a editar el controlador; la regla no se puede probar sola |
| Pago con Wompi (RF-10/11/12, RNF-02) | La firma y la URL de pago se armaban en `ProductosController` y la validación del webhook en `WompiController`, con formato propio de Wompi (centavos, `APPROVED`/`DECLINED`) filtrándose al resto del sistema | El dominio conoce detalles de un proveedor; cambiar de pasarela implica tocar varios archivos |

En el prototipo del Entregable 2 esas dos necesidades se separan con tres patrones.

## 2. Patrones seleccionados

| # | Patrón | Categoría GoF | Necesidad que resuelve | HU / RF / RN | Código |
|---|---|---|---|---|---|
| 1 | **Strategy** | Comportamiento | Calcular el descuento de un cupón de forma intercambiable | HU-08, RN-03, CU-02 | `js/dominio/descuentos.js`: `EstrategiaDescuento`, `SinDescuento`, `DescuentoPorcentual`, `DescuentoFijo` |
| 2 | **Factory Method** (variante: método fábrica estático) | Creacional | Decidir qué estrategia instanciar según el valor del cupón | HU-08, RN-03 | `js/dominio/descuentos.js`: `DescuentoFactory.crear(cupon)` |
| 3 | **Adapter** | Estructural | Integrar Wompi sin que el dominio conozca su formato | HU-09, RF-10/11/12, RNF-02, CU-01 | `js/dominio/pasarela.js`: `PasarelaPago` (objetivo), `WompiAdapter`, `WompiSimuladoApi` (adaptado) |

Los tres pertenecen a categorías distintas (comportamiento, creacional, estructural) y cada uno resuelve un problema distinto.

## 3. Ficha por patrón

### 3.1 Strategy

- **Intención:** encapsular una familia de algoritmos (formas de calcular el descuento) para poder intercambiarlos sin modificar al cliente.
- **Relación con el MVP:** el carrito calcula el total en la HU-07/HU-09. El descuento es parte del total que se cobra, aunque aplicar el cupón sea HU-08 (Release 2); se incluyó porque el total del checkout depende de él.
- **Participantes:**
  - Estrategia: `EstrategiaDescuento` (`calcular(subtotal)`, `etiqueta()`).
  - Estrategias concretas: `SinDescuento`, `DescuentoPorcentual`, `DescuentoFijo`.
  - Contexto: `CarritoService.resumen()`, que solo llama `estrategia.calcular(subtotal)`.
- **Aplicación concreta:** con el cupón `OCLOCK10` (10 %) y un subtotal de $378.000 se obtiene un descuento de $37.800; con `BIENVENIDO` ($20.000 fijo), $20.000; sin cupón, $0.
- **Alternativas consideradas:**
  - `if/else` dentro de `CarritoService` (es lo que había): descartada porque cada nuevo tipo edita el servicio.
  - Decorator: descartado, no hay acumulación de descuentos en el alcance.
  - Template Method: descartado, no hay un algoritmo común con pasos variables, solo una fórmula distinta.
- **Beneficios:** regla aislada y verificable; agregar "2x1" o "descuento por categoría" es una clase nueva.
- **Costos y riesgos:** tres clases pequeñas para algo que cabe en un `if`; se acepta porque la regla ya cambió (porcentual/fijo) y se espera crecer. No se creó una estrategia por cada idea futura (sin sobreingeniería).
- **Evidencia:** pruebas ejecutadas con las estrategias reales: 10 % de 378.000 = 37.800; 150 % de 100.000 = 100.000 (tope en el subtotal); fijo 500.000 sobre 100.000 = 100.000.

### 3.2 Factory Method

- **Intención:** delegar en un método la decisión de qué objeto concreto crear.
- **Relación con el MVP:** RN-03 define cómo reconocer el tipo de cupón (valor con `%` es porcentual; numérico es fijo). Esa decisión tiene que vivir en un solo lugar.
- **Participantes:** producto `EstrategiaDescuento`; fábrica `DescuentoFactory.crear(cupon)`; cliente `CarritoService`.
- **Aplicación concreta:** `crear(null)` devuelve `SinDescuento`; `crear({descuento:'10%'})` devuelve `DescuentoPorcentual(10)`; `crear({descuento:'20000'})` devuelve `DescuentoFijo(20000)`.
- **Nota de fidelidad al catálogo GoF:** el Factory Method clásico usa una clase creadora abstracta cuyas subclases sobrescriben el método de creación. Aquí se implementó la variante de **método fábrica estático** (conocida como Simple Factory), porque solo hay un punto de creación y una jerarquía de creadores sería sobreingeniería. Se declara explícitamente para no presentarla como el patrón clásico.
- **Alternativas consideradas:**
  - Crear la estrategia con `new` dentro del carrito: descartada, mezcla la regla de reconocimiento con el cálculo.
  - Abstract Factory: descartada, no hay familias de objetos relacionados.
  - Builder: descartado, los objetos son simples.
- **Beneficios:** el `strpos('%')` del Entregable 1 queda en un único método con un único cambio posible.
- **Costos y riesgos:** al agregar un tipo nuevo hay que editar la fábrica (ver principio abierto/cerrado en `analisis-solid.md`).
- **Diferencia con Strategy:** Strategy define qué cálculo se hace; la fábrica decide cuál instanciar. Si se elimina uno, el otro sigue teniendo sentido por separado.

### 3.3 Adapter

- **Intención:** convertir la interfaz de una clase en otra que el cliente espera.
- **Relación con el MVP:** HU-09 (pagar con Wompi), RF-11/12 y RNF-02 (validar la firma antes de cambiar el estado del pedido).
- **Participantes:**
  - Objetivo: `PasarelaPago` (`cobrar`, `validarNotificacion`).
  - Adaptador: `WompiAdapter`.
  - Adaptado: `WompiSimuladoApi` (`crearTransaccion`, `firmar`, con centavos y `APPROVED`/`DECLINED`).
  - Cliente: `CheckoutService`.
- **Qué traduce el adaptador:** pesos a centavos, `APPROVED`/`DECLINED` a `aprobado: true/false`, y el evento de Wompi a una notificación del dominio con la firma conservada para validarla.
- **Aplicación concreta:** al pagar con la tarjeta `4242…` la API simulada responde `APPROVED` con un checksum SHA-256; el adaptador lo entrega como `{aprobado: true}` y `PedidoService` valida la firma antes de marcar el pedido `Exitoso`. Una firma alterada deja el pedido sin cambios y registra el error en la bitácora (verificado).
- **Alternativas consideradas:**
  - Llamar a Wompi directamente desde el servicio de pedidos (el estado del Entregable 1): descartada por acoplamiento.
  - Facade: descartado, el problema no es simplificar un subsistema complejo sino traducir una interfaz.
  - Bridge: descartado, no hay dos jerarquías que varíen de forma independiente.
- **Beneficios:** el dominio no conoce a Wompi; cambiar de pasarela es una clase nueva y una línea en `app.js`; la pasarela simulada y la real se intercambian sin tocar el checkout.
- **Costos y riesgos:** una capa más. Se compensa porque en el prototipo la API real se reemplaza por una simulación sin tocar el flujo.

## 4. Validación: sin repetición ni solapamiento

| Criterio | Strategy | Factory Method | Adapter |
|---|---|---|---|
| ¿Es un patrón distinto de los otros dos? | Sí | Sí | Sí |
| Categoría GoF | Comportamiento | Creacional | Estructural |
| Problema distinto | Cómo se calcula | Cuál se crea | Cómo se integra un proveedor externo |
| Funcionalidad del MVP | Total del pedido (HU-07/08/09) | Total del pedido (HU-08) | Pago (HU-09) |
| Se puede quitar sin romper a los otros | Sí (la fábrica devolvería un único cálculo) | Sí (se instancia con `new`) | Sí (no depende de los otros dos) |

Strategy y Factory Method trabajan sobre el mismo dominio (descuentos) pero con responsabilidades distintas; es la pareja más conocida y no se superponen: una define la variación, la otra la selecciona.

## 5. Patrones evaluados y descartados

| Patrón | Por qué se descartó |
|---|---|
| Observer (correos tras el pago) | El efecto posterior al pago son dos llamadas en un único punto; un bus de eventos sería sobreingeniería en el MVP. Queda como mejora si se agregan más reacciones |
| Singleton | `Almacen` y `OCL` son únicos por composición en `app.js`, no hace falta forzarlo en el diseño |
| Facade | `CheckoutService` ya orquesta el flujo y no hay un subsistema complejo que ocultar |
| Decorator / Builder / Abstract Factory | Sin necesidad en el alcance del MVP |

## 6. Trazabilidad con el Entregable 1

| Elemento del Entregable 1 | Cómo se conserva o refina |
|---|---|
| RN-03 (cupón porcentual o fijo) | Strategy + Factory Method |
| CU-01 (checkout con Wompi) y CU-02 (aplicar cupón) | Adapter y Strategy/Factory implementan sus pasos |
| RNF-02 (firma SHA-256 del webhook) | `WompiAdapter.validarNotificacion` |
| Diagrama de clases | Refinado en el nivel 4 de C4: `c4-nivel4-descuentos` y `c4-nivel4-pasarela` |
