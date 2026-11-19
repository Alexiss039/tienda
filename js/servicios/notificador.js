// RF-12: notificación por correo simulada. Deja constancia en la bitácora en lugar de enviar un SMTP real.
// Es un observador: solo reacciona cuando un pago es aprobado.
class NotificadorCorreo extends Observador {
  constructor(bitacora) {
    super();
    this.bitacora = bitacora;
  }

  actualizar(evento, datos) {
    if (evento === EventosPedido.PAGO_APROBADO) this.confirmarCompra(datos.pedido, datos.correoCliente);
  }

  confirmarCompra(pedido, correoCliente) {
    this.bitacora.registrar('info', 'Correo de confirmación del pedido ' + pedido.referencia + ' enviado a ' + correoCliente);
    this.bitacora.registrar('info', 'Correo de nueva venta del pedido ' + pedido.referencia + ' enviado al administrador');
  }
}
