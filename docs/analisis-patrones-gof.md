# Plantilla de análisis y selección de patrones GoF - O'Clock Lens

**Proyecto:** O'Clock Lens · **Entregable:** 3 · **Alcance:** MVP (HU-01, 02, 04, 05, 07, 09, 11, 13) más el apoyo de HU-08 (cupones), HU-10 (estado del pedido) y HU-14 (despacho)

## 1. Punto de partida (Entregables 1 y 2)

En el sistema descrito en el Entregable 1 varias reglas de negocio vivían mezcladas dentro de controladores. En el Entregable 2 se separaron tres de ellas con patrones; en el Entregable 3 se completan los cinco patrones exigidos con dos necesidades que seguían resueltas con condicionales y llamadas directas.

| Necesidad | Cómo estaba | Problema | Patrón |
|---|---|---|---|
| Descuento por cupón (RN-03) | `CarritoController::aplicarCupon` decidía con `strpos($cupon->descuento, '%')` y calculaba el valor en el mismo método | Cada tipo nuevo de descuento obliga a editar el controlador | Strategy (E2) |
| Crear el descuento adecuado | La decisión de qué calcular estaba en ese mismo condicional | La regla de reconocimiento y el cálculo no se podían separar | Factory Method (E2) |
| Pago con Wompi (RF-10 a RF-12, RNF-02) | La firma y el formato de Wompi se repartían entre `ProductosController` y `WompiController` | El dominio conocía detalles de un proveedor | Adapter (E2) |
| Ciclo de vida del pedido (RN-04, RN-05) | En el prototipo del Entregable 2, `PedidoService` validaba las transiciones con listas (`ESTADOS_WEBHOOK`, `ESTADOS_ENVIO`) y condicionales (`['Exitoso','Enviado','Entregado'].includes(...)`) | Las reglas de transición estaban dispersas; el panel de administración ofrecía opciones inválidas (p. ej. pasar de Exitoso a Entregado sin enviar) | **State (E3)** |
| Reacciones a un pago o a un envío (RF-12, RNF-09) | `PedidoService` llamaba directamente a `NotificadorCorreo` y a `Bitacora` | El servicio de pedidos conocía a quienes reaccionan; agregar otra reacción obligaba a editarlo | **Observer (E3)** |

## 2. Patrones seleccionados

| # | Patrón | Categoría GoF | Necesidad que resuelve | HU / RF / RN | Código |
|---|---|---|---|---|---|
| 1 | **Strategy** | Comportamiento | Calcular el descuento de un cupón de forma intercambiable | HU-08, RN-03, CU-02 | `js/dominio/descuentos.js`: `EstrategiaDescuento`, `SinDescuento`, `DescuentoPorcentual`, `DescuentoFijo` |
| 2 | **Factory Method** (variante: método fábrica estático) | Creacional | Decidir qué estrategia instanciar según el valor del cupón | HU-08, RN-03 | `js/dominio/descuentos.js`: `DescuentoFactory.crear(cupon)` |
| 3 | **Adapter** | Estructural | Integrar Wompi sin que el dominio conozca su formato | HU-09, RF-10/11/12, RNF-02, CU-01 | `js/dominio/pasarela.js`: `PasarelaPago`, `WompiAdapter`, `WompiSimuladoApi` |
| 4 | **State** | Comportamiento | Que cada estado del pedido defina qué transiciones permite | HU-09, HU-10, HU-14, RN-04, RN-05 | `js/dominio/estados.js`: `EstadoPedido` y cinco estados concretos |
| 5 | **Observer** | Comportamiento | Que la bitácora y el correo reaccionen a eventos del pedido sin acoplarse al servicio | HU-09, HU-14, RF-12, RNF-09 | `js/dominio/eventos.js`: `EventosPedido`, `Observador`; observadores en `servicios/bitacora.js` y `servicios/notificador.js` |

Hay patrones de las tres categorías: comportamiento (Strategy, State, Observer), creacional (Factory Method) y estructural (Adapter).

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
- **Costos y riesgos:** tres clases pequeñas para algo que cabe en un `if`; se acepta porque la regla ya cambió (porcentual/fijo) y se espera crecer.
- **Evidencia:** 10 % de 378.000 = 37.800; 150 % de 100.000 = 100.000 (tope en el subtotal); fijo 500.000 sobre 100.000 = 100.000.

### 3.2 Factory Method

- **Intención:** delegar en un método la decisión de qué objeto concreto crear.
- **Relación con el MVP:** RN-03 define cómo reconocer el tipo de cupón (valor con `%` es porcentual; numérico es fijo). Esa decisión tiene que vivir en un solo lugar.
- **Participantes:** producto `EstrategiaDescuento`; fábrica `DescuentoFactory.crear(cupon)`; cliente `CarritoService`.
- **Aplicación concreta:** `crear(null)` devuelve `SinDescuento`; `crear({descuento:'10%'})` devuelve `DescuentoPorcentual(10)`; `crear({descuento:'20000'})` devuelve `DescuentoFijo(20000)`.
- **Nota de fidelidad al catálogo GoF:** el Factory Method clásico usa una clase creadora abstracta cuyas subclases sobrescriben el método de creación. Aquí se implementó la variante de **método fábrica estático** (conocida como Simple Factory), porque solo hay un punto de creación y una jerarquía de creadores sería sobreingeniería. Se declara explícitamente para no presentarla como el patrón clásico.
- **Alternativas consideradas:** crear la estrategia con `new` dentro del carrito (mezcla reconocimiento y cálculo); Abstract Factory (no hay familias de objetos); Builder (objetos simples).
- **Beneficios:** el `strpos('%')` del Entregable 1 queda en un único método con un único cambio posible.
- **Costos y riesgos:** al agregar un tipo nuevo hay que editar la fábrica (ver principio abierto/cerrado en el Anexo D).
- **Diferencia con Strategy:** Strategy define qué cálculo se hace; la fábrica decide cuál instanciar.

### 3.3 Adapter

- **Intención:** convertir la interfaz de una clase en otra que el cliente espera.
- **Relación con el MVP:** HU-09 (pagar con Wompi), RF-11/12 y RNF-02 (validar la firma antes de cambiar el estado del pedido).
- **Participantes:** objetivo `PasarelaPago` (`cobrar`, `validarNotificacion`); adaptador `WompiAdapter`; adaptado `WompiSimuladoApi` (centavos, `APPROVED`/`DECLINED`); cliente `CheckoutService`.
- **Qué traduce el adaptador:** pesos a centavos, `APPROVED`/`DECLINED` a `aprobado: true/false`, y el evento de Wompi a una notificación del dominio con la firma conservada para validarla.
- **Aplicación concreta:** con la tarjeta `4242…` la API simulada responde `APPROVED` con un checksum SHA-256; el adaptador lo entrega como `{aprobado: true}` y `PedidoService` valida la firma antes de marcar el pedido `Exitoso`. Una firma alterada deja el pedido sin cambios y queda registrada en la bitácora (verificado).
- **Alternativas consideradas:** llamar a Wompi directamente desde el servicio de pedidos (descartada por acoplamiento); Facade (el problema es traducir una interfaz, no simplificar un subsistema); Bridge (no hay dos jerarquías que varíen de forma independiente).
- **Beneficios:** el dominio no conoce a Wompi; cambiar de pasarela es una clase nueva y una línea en `app.js`.
- **Costos y riesgos:** una capa más, compensada porque en el prototipo la API real se reemplaza por una simulación sin tocar el flujo.

### 3.4 State

- **Intención:** permitir que un objeto cambie su comportamiento cuando cambia su estado interno; cada estado encapsula las transiciones que admite.
- **Relación con el MVP:** el pedido nace `Pendiente` (RN-04), el webhook lo pasa a `Exitoso` o `rechazado` (HU-09), y solo el administrador lo pasa a `Enviado` y `Entregado` (RN-05, HU-14). El cliente consulta ese estado en HU-10. Es también el origen del diagrama de transición de estados del Entregable 3.
- **Participantes:**
  - Estado: `EstadoPedido` (`aprobarPago`, `rechazarPago`, `despachar`, `entregar`, `siguientesManuales`); por defecto toda transición lanza `Transición no permitida`.
  - Estados concretos: `EstadoPendiente`, `EstadoExitoso`, `EstadoEnviado`, `EstadoEntregado`, `EstadoRechazado`; cada uno sobrescribe solo las transiciones válidas.
  - Contexto: `PedidoService`, que delega el cambio en el objeto estado (`EstadoPedido.de(pedido.estado).aprobarPago()`).
- **Nota de fidelidad al catálogo GoF:** en el patrón clásico el contexto guarda una referencia al objeto estado. Aquí el pedido se persiste como un nombre (`'Exitoso'`) porque se almacena en `localStorage`, y `EstadoPedido.de(nombre)` resuelve el objeto. Los estados no tienen atributos, por lo que se comparten como instancias únicas. Se declara para no presentarlo como la versión clásica.
- **Aplicación concreta:**
  - Desde `Pendiente` solo se puede aprobar o rechazar el pago; intentar despachar lanza `Transición no permitida: Pendiente → Enviado`.
  - `Exitoso` solo ofrece pasar a `Enviado`; `Enviado` ofrece `Enviado` (corregir guía) y `Entregado`; `Entregado` y `rechazado` son finales.
  - El panel de administración construye el selector con `siguientesManuales()`, de modo que nunca ofrece una transición inválida.
  - Una notificación de pago repetida sobre un pedido ya `Exitoso` se ignora y se audita, en lugar de reprocesarse.
- **Alternativas consideradas:**
  - Listas y condicionales en `PedidoService` (el estado del Entregable 2): descartada porque las reglas quedaban dispersas y la interfaz podía ofrecer transiciones inválidas.
  - Tabla de transiciones (un objeto `{estado: [destinos]}`): es una alternativa legítima y más corta. Se prefirió State porque cada estado, además de sus destinos, define comportamiento propio (qué ofrece el administrador, qué se ignora) y porque el Entregable 3 exige el patrón.
  - Strategy: descartado, la variación no la elige el cliente sino que cambia por transiciones dentro del pedido.
- **Beneficios:** las reglas RN-04 y RN-05 viven en un único archivo; agregar un estado (por ejemplo `Devuelto`) es una clase nueva más una entrada en el registro.
- **Costos y riesgos:** cinco clases pequeñas; un registro estático (`REGISTRO_ESTADOS`) que hay que actualizar al agregar un estado.
- **Evidencia:** `tests/pedidos.test.js` (29 pruebas) verifica cada transición válida y las inválidas, y se comprobó en el navegador que el selector de despacho ofrece solo las transiciones permitidas.

### 3.5 Observer

- **Intención:** definir una dependencia uno-a-muchos para que, cuando un objeto cambia, todos sus dependientes sean notificados automáticamente.
- **Relación con el MVP:** al aprobarse un pago se debe enviar el correo de confirmación (RF-12) y dejar constancia en la bitácora (RNF-09); los despachos y entregas también se auditan (HU-14).
- **Participantes:**
  - Sujeto: `EventosPedido` (`suscribir`, `cancelar`, `emitir`), con siete eventos (`pago.aprobado`, `pago.rechazado`, `pago.firmaInvalida`, `pago.pedidoNoEncontrado`, `pago.transicionInvalida`, `pedido.enviado`, `pedido.entregado`).
  - Observador: `Observador` (`actualizar(evento, datos)`).
  - Observadores concretos: `RegistroEventosPedido` (escribe en la bitácora) y `NotificadorCorreo` (reacciona solo a `pago.aprobado`).
  - Publicador: `PedidoService`, que solo emite eventos.
- **Aplicación concreta:** en `app.js` la bitácora se suscribe a todos los eventos y el correo a `pago.aprobado`. Al aprobarse un pago queda primero la línea de la bitácora y luego los dos correos; `PedidoService` ya no conoce ni a la bitácora ni al notificador.
- **Alternativas consideradas:**
  - Llamadas directas a `NotificadorCorreo` y `Bitacora` desde el servicio (el estado del Entregable 2): descartada porque agregar una reacción obligaba a editar el servicio.
  - `EventTarget` o eventos personalizados del navegador (DOM): descartados porque acoplan el dominio al DOM y no permiten probarlo en Node (`tests/pedidos.test.js`).
  - Callbacks sueltos: descartados por no tener contrato ni forma de cancelar la suscripción.
- **Beneficios:** una reacción nueva (por ejemplo, descontar inventario o avisar por mensajería) es un observador nuevo suscrito en `app.js`, sin tocar `PedidoService`.
- **Costos y riesgos:** el flujo deja de ser una cadena de llamadas visible; el orden depende del orden de suscripción (se respeta y se verifica en las pruebas). En el Entregable 2 se había descartado este patrón por sobreingeniería con tres patrones; con cinco exigidos es el que mejor responde a una necesidad real (RF-12 y RNF-09).
- **Evidencia:** las pruebas verifican que se audite pago aprobado, rechazado, firma inválida, pedido inexistente, transición inválida, envío y entrega, que el correo se registre después de la bitácora y que una suscripción cancelada deje de recibir eventos.

## 4. Validación: sin repetición ni solapamiento

| Criterio | Strategy | Factory Method | Adapter | State | Observer |
|---|---|---|---|---|---|
| Es distinto de los otros cuatro | Sí | Sí | Sí | Sí | Sí |
| Categoría GoF | Comportamiento | Creacional | Estructural | Comportamiento | Comportamiento |
| Problema distinto | Cómo se calcula el descuento | Cuál estrategia se crea | Cómo se integra un proveedor externo | Qué transiciones admite el pedido | Quién reacciona a un evento del pedido |
| Funcionalidad del MVP | Total del pedido | Total del pedido | Pago del pedido | Estado del pedido | Notificación y auditoría del pedido |
| Se puede retirar sin romper a los otros | Sí | Sí | Sí | Sí | Sí |

Tres patrones son de comportamiento, por lo que se aclara por qué no se solapan:

- **Strategy y State** tienen estructura parecida (una jerarquía intercambiable), pero responden a preguntas distintas: Strategy elige un algoritmo según un dato externo (el cupón) y no cambia durante la vida del objeto; State cambia por transiciones internas del pedido y cada estado decide cuáles admite.
- **State y Observer** actúan sobre el mismo pedido, pero en momentos distintos: State decide si el cambio es válido y lo aplica; Observer anuncia que el cambio ocurrió. El servicio llama primero al estado y solo después emite el evento.
- **Strategy y Factory Method** trabajan sobre el mismo dominio (descuentos): una define la variación, la otra la selecciona.

## 5. Patrones evaluados y descartados

| Patrón | Por qué se descartó |
|---|---|
| Facade | `CheckoutService` ya orquesta el flujo de compra y no hay un subsistema complejo que ocultar |
| Singleton | `Almacen` y `OCL` son únicos por composición en `app.js`, no hace falta forzarlo en el diseño |
| Decorator | Sin acumulación de descuentos ni funcionalidades apilables en el MVP |
| Builder / Abstract Factory | Objetos simples y sin familias de objetos |
| Command | Las acciones del usuario son llamadas directas; no hay deshacer ni colas |

## 6. Trazabilidad con los entregables anteriores

| Elemento anterior | Cómo se conserva o refina |
|---|---|
| RN-03 (cupón porcentual o fijo) | Strategy + Factory Method |
| CU-01 (checkout con Wompi) y CU-02 (aplicar cupón) | Adapter, Strategy y Factory implementan sus pasos |
| RNF-02 (firma SHA-256 del webhook) | `WompiAdapter.validarNotificacion` |
| RN-04 y RN-05 (estados del pedido) | State (`js/dominio/estados.js`) y diagrama de transición de estados |
| RF-12 (correo) y RNF-09 (auditoría) | Observer (`js/dominio/eventos.js`) |
| Diagrama de clases | Refinado en el nivel 4 de C4: `c4-nivel4-descuentos`, `c4-nivel4-pasarela`, `c4-nivel4-estados` y `c4-nivel4-eventos` |
