// Raíz de composición: único lugar donde se crean las dependencias concretas y se inyectan.
// Para cambiar de pasarela basta con reemplazar el adaptador en esta línea; para reaccionar a un evento
// del pedido basta con suscribir otro observador.
const OCL = (function () {
  Semilla.asegurar();

  const eventos = new EventosPedido();
  const bitacora = new Bitacora(Almacen);
  const notificador = new NotificadorCorreo(bitacora);
  const registro = new RegistroEventosPedido(bitacora);
  EventosPedido.TODOS.forEach((e) => eventos.suscribir(e, registro));                      // se audita todo evento...
  eventos.suscribir(EventosPedido.PAGO_APROBADO, notificador);                             // ...y un pago aprobado además se avisa por correo

  const auth = new AuthService(Almacen);
  const catalogo = new CatalogoService(Almacen);
  const carrito = new CarritoService(Almacen, catalogo);
  const pedidos = new PedidoService(Almacen, eventos);
  const pasarela = new WompiAdapter(new WompiSimuladoApi('secreto-eventos-simulado'));
  const checkout = new CheckoutService(carrito, pedidos, pasarela);

  return { auth, catalogo, carrito, pedidos, checkout, bitacora, eventos };
})();
