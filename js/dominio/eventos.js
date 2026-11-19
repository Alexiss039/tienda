// PATRÓN 5 - OBSERVER: PedidoService (sujeto) anuncia lo que ocurre con un pedido y quienes están interesados
// (observadores) reaccionan sin que el servicio los conozca: la bitácora (RNF-09) y el correo (RF-12).

// Interfaz de los observadores
class Observador {
  actualizar(evento, datos) {
    throw new Error('actualizar() debe ser implementado por el observador concreto');
  }
}

// Sujeto: mantiene la lista de observadores por evento y los notifica en el orden en que se suscribieron
class EventosPedido {
  constructor() {
    this.observadores = {};
  }

  suscribir(evento, observador) {
    (this.observadores[evento] = this.observadores[evento] || []).push(observador);
    return () => this.cancelar(evento, observador);
  }

  cancelar(evento, observador) {
    this.observadores[evento] = (this.observadores[evento] || []).filter((o) => o !== observador);
  }

  emitir(evento, datos) {
    (this.observadores[evento] || []).forEach((o) => o.actualizar(evento, datos));
  }
}

// Eventos del ciclo de vida del pedido
EventosPedido.PAGO_APROBADO = 'pago.aprobado';
EventosPedido.PAGO_RECHAZADO = 'pago.rechazado';
EventosPedido.FIRMA_INVALIDA = 'pago.firmaInvalida';
EventosPedido.PEDIDO_NO_ENCONTRADO = 'pago.pedidoNoEncontrado';
EventosPedido.TRANSICION_INVALIDA = 'pago.transicionInvalida';
EventosPedido.PEDIDO_ENVIADO = 'pedido.enviado';
EventosPedido.PEDIDO_ENTREGADO = 'pedido.entregado';
EventosPedido.TODOS = [
  EventosPedido.PAGO_APROBADO, EventosPedido.PAGO_RECHAZADO, EventosPedido.FIRMA_INVALIDA,
  EventosPedido.PEDIDO_NO_ENCONTRADO, EventosPedido.TRANSICION_INVALIDA,
  EventosPedido.PEDIDO_ENVIADO, EventosPedido.PEDIDO_ENTREGADO
];
