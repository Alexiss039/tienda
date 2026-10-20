# O'Clock Lens - Prototipo funcional (Entregable 2)

Réplica estática y simulada de la tienda O'Clock Lens para el curso de Análisis y Diseño de Software (ITM).
No tiene backend: la "base de datos" es `localStorage`, y la pasarela Wompi y los correos son simulados.

## Cómo ejecutarlo
Abrir `index.html` en el navegador, o servir la carpeta (`python -m http.server`) y entrar a `http://localhost:8000`.
Para reiniciar los datos: en la consola del navegador ejecutar `Almacen.reiniciar()` y recargar.

Tres vistas tienen una pestaña lateral **"Datos de prueba"** con solo los datos que sirven allí: el inicio de sesión
(usuarios, entrar con un clic y reiniciar datos), el carrito (cupones) y el pago (tarjetas). Se abre por defecto solo en pantallas anchas.

## Usuarios de demostración
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@oclocklens.com | Admin123 |
| Cliente | cliente@oclocklens.com | Cliente123 |

Cupones: `OCLOCK10` (10 %) y `BIENVENIDO` ($20.000). Tarjeta de prueba: `4242 4242 4242 4242` aprueba, `4111 1111 1111 1111` rechaza.

## Historias de usuario del MVP implementadas
HU-01 Registro · HU-02 Inicio de sesión · HU-04 Catálogo · HU-05 Detalle · HU-07 Agregar al carrito ·
HU-09 Checkout con Wompi (simulado) · HU-11 Gestionar productos · HU-13 Listado de pedidos.
Apoyo de Release 2 y 3 (necesarios para los patrones): HU-08 cupones, HU-10 estado de pedido, HU-14 despacho, HU-06 comentarios.

## Arquitectura por capas (`js/`)
| Capa | Archivos | Responsabilidad |
|---|---|---|
| Infraestructura | `infra/` | `Almacen` (BD simulada), `Semilla` (datos), `sha256` |
| Dominio | `dominio/` | Reglas de negocio y los 3 patrones de diseño |
| Servicios | `servicios/` | Casos de uso: auth, catálogo, carrito, pedidos, checkout |
| Interfaz | `ui/`, `paginas/` | Renderizado y eventos de cada página |
| Composición | `app.js` | Crea e inyecta las dependencias (único lugar que conoce las clases concretas) |

## Patrones de diseño (GoF)
| Patrón | Dónde | Necesidad |
|---|---|---|
| Strategy | `dominio/descuentos.js` (`EstrategiaDescuento`, `DescuentoPorcentual`, `DescuentoFijo`, `SinDescuento`) | RN-03: cupón porcentual o fijo |
| Factory Method | `dominio/descuentos.js` (`DescuentoFactory.crear`) | Elegir la estrategia según el cupón |
| Adapter | `dominio/pasarela.js` (`PasarelaPago` ← `WompiAdapter` → `WompiSimuladoApi`) | RF-10/11/12: integrar Wompi sin acoplar el dominio |
