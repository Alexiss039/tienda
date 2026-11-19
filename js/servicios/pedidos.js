// HU-09 (estado del pedido), HU-10, HU-13 y HU-14. Gestiona el ciclo de vida y la persistencia de los pedidos.
// No conoce la pasarela (la orquestación está en CheckoutService), delega las transiciones en el objeto
// EstadoPedido (State) y anuncia lo ocurrido mediante EventosPedido (Observer).
class PedidoService {
  constructor(almacen, eventos) {
    this.almacen = almacen;
    this.eventos = eventos;
  }

  listar() {
    return this.almacen.leer('pedidos', []);
  }

  listarDeCliente(usuarioId) {
    return this.listar().filter((p) => p.usuarioId === usuarioId);
  }

  // RN-04: un pedido siempre nace 'Pendiente'
  crearPendiente(usuario, resumen) {
    const pedidos = this.listar();
    const pedido = {
      id: this.almacen.siguienteId('pedidos'),
      referencia: 'OCL-' + Date.now(),
      usuarioId: usuario.id,
      cliente: usuario.nombre + ' ' + usuario.apellidos,
      items: resumen.items.map((i) => ({ productoId: i.productoId, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
      subtotal: resumen.subtotal,
      descuento: resumen.descuento,
      envio: resumen.envio,
      total: resumen.total,
      estado: Reglas.ESTADO_INICIAL_PEDIDO,
      guia: '',
      entidad: '',
      fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' ')
    };
    pedidos.push(pedido);
    this.almacen.guardar('pedidos', pedidos);
    return pedido;
  }

  // RF-11 / RN-04: solo una notificación con firma válida cambia el estado a Exitoso o rechazado
  aplicarNotificacionPago(notificacion, pasarela, correoCliente) {
    const pedidos = this.listar();
    const pedido = pedidos.find((p) => p.referencia === notificacion.referencia);
    if (!pedido) {
      this.eventos.emitir(EventosPedido.PEDIDO_NO_ENCONTRADO, { referencia: notificacion.referencia });
      return null;
    }
    if (!pasarela.validarNotificacion(notificacion)) {
      this.eventos.emitir(EventosPedido.FIRMA_INVALIDA, { pedido });
      return pedido;
    }
    // State: el estado actual decide si la transición es válida (p. ej. una notificación repetida se ignora)
    const actual = EstadoPedido.de(pedido.estado);
    let nuevo;
    try {
      nuevo = notificacion.aprobado ? actual.aprobarPago() : actual.rechazarPago();
    } catch (error) {
      this.eventos.emitir(EventosPedido.TRANSICION_INVALIDA, { pedido, mensaje: error.message });
      return pedido;
    }
    pedido.estado = nuevo.nombre;
    this.almacen.guardar('pedidos', pedidos);
    // Observer: bitácora y correo reaccionan sin que este servicio los conozca
    this.eventos.emitir(notificacion.aprobado ? EventosPedido.PAGO_APROBADO : EventosPedido.PAGO_RECHAZADO, { pedido, correoCliente });
    return pedido;
  }

  // RN-05: Enviado / Entregado solo los asigna el administrador, con guía y entidad
  actualizarEnvio(id, { estado, guia, entidad }) {
    if (!['Enviado', 'Entregado'].includes(estado)) throw new Error('Estado de envío no válido');
    if (!guia || !entidad) throw new Error('Indica el número de guía y la entidad de envío');
    const pedidos = this.listar();
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) throw new Error('El pedido no existe');
    const actual = EstadoPedido.de(pedido.estado);
    const nuevo = estado === 'Enviado' ? actual.despachar() : actual.entregar();   // lanza si la transición no es válida
    Object.assign(pedido, { estado: nuevo.nombre, guia, entidad });
    this.almacen.guardar('pedidos', pedidos);
    this.eventos.emitir(nuevo.nombre === 'Enviado' ? EventosPedido.PEDIDO_ENVIADO : EventosPedido.PEDIDO_ENTREGADO, { pedido });
    return pedido;
  }
}
