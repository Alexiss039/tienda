// HU-09 (estado del pedido), HU-10, HU-13 y HU-14. Solo gestiona el ciclo de vida y la persistencia
// de los pedidos; no sabe nada de la pasarela de pago (la orquestación está en CheckoutService).
class PedidoService {
  constructor(almacen, notificador, bitacora) {
    this.almacen = almacen;
    this.notificador = notificador;
    this.bitacora = bitacora;
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
      this.bitacora.registrar('error', 'Notificación para un pedido no encontrado: ' + notificacion.referencia);
      return null;
    }
    if (!pasarela.validarNotificacion(notificacion)) {
      this.bitacora.registrar('error', 'Firma inválida en la notificación del pedido ' + pedido.referencia);
      return pedido;
    }
    pedido.estado = notificacion.aprobado ? 'Exitoso' : 'rechazado';
    this.almacen.guardar('pedidos', pedidos);
    this.bitacora.registrar(notificacion.aprobado ? 'info' : 'warning',
      'Pago ' + (notificacion.aprobado ? 'aprobado' : 'rechazado') + ' para el pedido ' + pedido.referencia);
    if (notificacion.aprobado) this.notificador.confirmarCompra(pedido, correoCliente);
    return pedido;
  }

  // RN-05: Enviado / Entregado solo los asigna el administrador, con guía y entidad
  actualizarEnvio(id, { estado, guia, entidad }) {
    if (!Reglas.ESTADOS_ENVIO.includes(estado)) throw new Error('Estado de envío no válido');
    if (!guia || !entidad) throw new Error('Indica el número de guía y la entidad de envío');
    const pedidos = this.listar();
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || !['Exitoso', 'Enviado', 'Entregado'].includes(pedido.estado)) {
      throw new Error('Solo se pueden despachar pedidos con pago exitoso');
    }
    Object.assign(pedido, { estado, guia, entidad });
    this.almacen.guardar('pedidos', pedidos);
    return pedido;
  }
}
