// HU-09 Realizar pedido (checkout con Wompi). Orquesta el flujo: crear pedido -> cobrar -> notificación -> limpiar carrito.
// Depende de la abstracción PasarelaPago, no de Wompi (inversión de dependencias).
class CheckoutService {
  constructor(carrito, pedidos, pasarela) {
    this.carrito = carrito;
    this.pedidos = pedidos;
    this.pasarela = pasarela;
  }

  async pagar(usuario, tarjeta) {
    const resumen = this.carrito.resumen(usuario.id);
    if (resumen.items.length === 0) throw new Error('Tu carrito está vacío');

    const pedido = this.pedidos.crearPendiente(usuario, resumen);
    const notificacion = await this.pasarela.cobrar({ referencia: pedido.referencia, total: resumen.total, tarjeta });
    const actualizado = this.pedidos.aplicarNotificacionPago(notificacion, this.pasarela, usuario.correo);

    if (actualizado && actualizado.estado === 'Exitoso') this.carrito.vaciar(usuario.id);
    return actualizado;
  }
}
