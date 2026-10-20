// Raíz de composición: único lugar donde se crean las dependencias concretas y se inyectan.
// Para cambiar de pasarela basta con reemplazar el adaptador en esta línea.
const OCL = (function () {
  Semilla.asegurar();

  const bitacora = new Bitacora(Almacen);
  const notificador = new NotificadorCorreo(bitacora);
  const auth = new AuthService(Almacen);
  const catalogo = new CatalogoService(Almacen);
  const carrito = new CarritoService(Almacen, catalogo);
  const pedidos = new PedidoService(Almacen, notificador, bitacora);
  const pasarela = new WompiAdapter(new WompiSimuladoApi('secreto-eventos-simulado'));
  const checkout = new CheckoutService(carrito, pedidos, pasarela);

  return { auth, catalogo, carrito, pedidos, checkout, bitacora };
})();
