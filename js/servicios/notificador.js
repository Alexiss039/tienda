// RF-12: notificación por correo simulada. Deja constancia en la bitácora en lugar de enviar un SMTP real.
class NotificadorCorreo {
  constructor(bitacora) {
    this.bitacora = bitacora;
  }

  confirmarCompra(pedido, correoCliente) {
    this.bitacora.registrar('info', 'Correo de confirmación del pedido ' + pedido.referencia + ' enviado a ' + correoCliente);
    this.bitacora.registrar('info', 'Correo de nueva venta del pedido ' + pedido.referencia + ' enviado al administrador');
  }
}
