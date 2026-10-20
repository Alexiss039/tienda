// HU-07 Agregar al carrito, HU-08 Cupón de descuento. El carrito se guarda por usuario.
class CarritoService {
  constructor(almacen, catalogo) {
    this.almacen = almacen;
    this.catalogo = catalogo;
  }

  leer(usuarioId) {
    const carritos = this.almacen.leer('carritos', {});
    return carritos[usuarioId] || { items: [], cupon: null };
  }

  guardar(usuarioId, carrito) {
    const carritos = this.almacen.leer('carritos', {});
    carritos[usuarioId] = carrito;
    this.almacen.guardar('carritos', carritos);
  }

  // RF-07: si el producto ya estaba en el carrito, se suma la cantidad
  agregar(usuarioId, productoId, cantidad) {
    const producto = this.catalogo.obtener(productoId);
    if (!producto || producto.estado !== 'disponible') {
      throw new Error('El producto no está disponible');
    }
    const carrito = this.leer(usuarioId);
    const existente = carrito.items.find((i) => i.productoId === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      carrito.items.push({ productoId: producto.id, cantidad });
    }
    this.guardar(usuarioId, carrito);
  }

  quitar(usuarioId, productoId) {
    const carrito = this.leer(usuarioId);
    carrito.items = carrito.items.filter((i) => i.productoId !== productoId);
    if (carrito.items.length === 0) carrito.cupon = null;
    this.guardar(usuarioId, carrito);
  }

  vaciar(usuarioId) {
    this.guardar(usuarioId, { items: [], cupon: null });
  }

  cantidadTotal(usuarioId) {
    return this.leer(usuarioId).items.reduce((suma, i) => suma + i.cantidad, 0);
  }

  // RF-09: valida el cupón contra la "base de datos"
  aplicarCupon(usuarioId, codigo) {
    const cupon = this.almacen.leer('cupones', [])
      .find((c) => c.codigo === codigo.trim().toUpperCase() && c.estado === 'activo');
    if (!cupon) throw new Error('El cupón no es válido');
    const carrito = this.leer(usuarioId);
    carrito.cupon = cupon.codigo;
    this.guardar(usuarioId, carrito);
    return cupon;
  }

  // RN-02 / RN-03: total = subtotal - descuento + envío. El descuento lo calcula la estrategia.
  resumen(usuarioId) {
    const carrito = this.leer(usuarioId);
    const items = carrito.items
      .map((i) => {
        const producto = this.catalogo.obtener(i.productoId);
        return producto ? { productoId: producto.id, nombre: producto.nombre, imagen: producto.imagen,
                            precio: producto.precio, cantidad: i.cantidad } : null;
      })
      .filter(Boolean);
    const subtotal = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
    const cupon = this.almacen.leer('cupones', []).find((c) => c.codigo === carrito.cupon) || null;
    const estrategia = DescuentoFactory.crear(cupon);
    const descuento = estrategia.calcular(subtotal);
    const envio = items.length ? Reglas.COSTO_ENVIO : 0;
    return { items, cupon, etiquetaDescuento: estrategia.etiqueta(), subtotal, descuento, envio, total: subtotal - descuento + envio };
  }
}
