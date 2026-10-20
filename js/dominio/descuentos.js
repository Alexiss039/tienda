// PATRÓN 1 - STRATEGY: cada forma de calcular un descuento es una estrategia intercambiable.
// PATRÓN 2 - FACTORY METHOD: DescuentoFactory decide qué estrategia crear según el cupón (RN-03).

// Contrato común de las estrategias
class EstrategiaDescuento {
  calcular(subtotal) {
    throw new Error('calcular() debe ser implementado por la estrategia concreta');
  }

  etiqueta() {
    return '';
  }
}

class SinDescuento extends EstrategiaDescuento {
  calcular() {
    return 0;
  }
}

class DescuentoPorcentual extends EstrategiaDescuento {
  constructor(porcentaje) {
    super();
    this.porcentaje = porcentaje;
  }

  calcular(subtotal) {
    // El descuento nunca supera el subtotal (mismo contrato que DescuentoFijo)
    return Math.min(subtotal, Math.round(subtotal * this.porcentaje / 100));
  }

  etiqueta() {
    return this.porcentaje + '%';
  }
}

class DescuentoFijo extends EstrategiaDescuento {
  constructor(valor) {
    super();
    this.valor = valor;
  }

  calcular(subtotal) {
    return Math.min(this.valor, subtotal);
  }

  etiqueta() {
    return 'valor fijo';
  }
}

class DescuentoFactory {
  // RN-03: si el valor del cupón contiene '%' es porcentual; si es numérico, es fijo.
  static crear(cupon) {
    if (!cupon) return new SinDescuento();
    const valor = String(cupon.descuento).trim();
    if (valor.includes('%')) return new DescuentoPorcentual(parseFloat(valor));
    return new DescuentoFijo(Number(valor));
  }
}
