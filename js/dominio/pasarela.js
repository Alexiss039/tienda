// PATRÓN 3 - ADAPTER: el sistema habla con la interfaz PasarelaPago (la que necesita el dominio);
// WompiAdapter traduce esa interfaz al formato propio de la API de Wompi (WompiSimuladoApi).

// Interfaz objetivo (Target) que usa el dominio
class PasarelaPago {
  // solicitud: { referencia, total, tarjeta } -> Promise<NotificacionPago>
  cobrar(solicitud) {
    throw new Error('cobrar() debe ser implementado por la pasarela concreta');
  }

  // RNF-02: la notificación solo es confiable si su firma es válida
  validarNotificacion(notificacion) {
    throw new Error('validarNotificacion() debe ser implementado por la pasarela concreta');
  }
}

// Servicio externo (Adaptee): simula la API de Wompi con su propio formato (centavos, APPROVED/DECLINED).
class WompiSimuladoApi {
  constructor(secretoEventos) {
    this.secretoEventos = secretoEventos;
  }

  crearTransaccion(datos) {
    return new Promise((resolver) => {
      setTimeout(() => {
        // Tarjetas de prueba publicadas por Wompi: 4242... aprueba, 4111... rechaza
        const numero = datos.payment_method.number.replace(/\s/g, '');
        const transaccion = {
          id: '11000-' + Date.now(),
          reference: datos.reference,
          amount_in_cents: datos.amount_in_cents,
          currency: datos.currency,
          status: numero.startsWith('4242') ? 'APPROVED' : 'DECLINED'
        };
        resolver({
          event: 'transaction.updated',
          data: { transaction: transaccion },
          signature: { checksum: this.firmar(transaccion) }
        });
      }, 1200);
    });
  }

  // Checksum SHA-256 como el del webhook real: id + estado + monto + secreto
  firmar(transaccion) {
    return sha256(transaccion.id + transaccion.status + transaccion.amount_in_cents + this.secretoEventos);
  }
}

// Adaptador: convierte pesos -> centavos y APPROVED/DECLINED -> booleano del dominio
class WompiAdapter extends PasarelaPago {
  constructor(api) {
    super();
    this.api = api;
  }

  async cobrar(solicitud) {
    const evento = await this.api.crearTransaccion({
      reference: solicitud.referencia,
      amount_in_cents: solicitud.total * 100,
      currency: 'COP',
      payment_method: { type: 'CARD', number: solicitud.tarjeta }
    });
    const transaccion = evento.data.transaction;
    return {
      referencia: transaccion.reference,
      transaccionId: transaccion.id,
      aprobado: transaccion.status === 'APPROVED',
      crudo: evento
    };
  }

  validarNotificacion(notificacion) {
    const evento = notificacion.crudo;
    return evento.signature.checksum === this.api.firmar(evento.data.transaction);
  }
}
