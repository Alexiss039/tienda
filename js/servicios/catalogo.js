// HU-04 Explorar catálogo, HU-05 Detalle, HU-11 Gestionar productos (Admin).
class CatalogoService {
  constructor(almacen) {
    this.almacen = almacen;
  }

  // RF-04 / RNF-05: la tienda pública solo muestra productos 'disponible'
  listarDisponibles() {
    return this.listarTodos().filter((p) => p.estado === 'disponible');
  }

  listarTodos() {
    return this.almacen.leer('productos', []);
  }

  obtener(id) {
    return this.listarTodos().find((p) => p.id === Number(id)) || null;
  }

  categorias() { return this.almacen.leer('categorias', []); }
  marcas() { return this.almacen.leer('marcas', []); }
  proveedores() { return this.almacen.leer('proveedores', []); }

  comentarios(productoId) {
    return this.almacen.leer('comentarios', []).filter((c) => c.productoId === Number(productoId));
  }

  comentar(productoId, usuario, texto) {
    const comentarios = this.almacen.leer('comentarios', []);
    comentarios.push({
      id: this.almacen.siguienteId('comentarios'),
      productoId: Number(productoId),
      usuario: usuario.nombre + ' ' + usuario.apellidos,
      texto,
      fecha: new Date().toISOString().slice(0, 10)
    });
    this.almacen.guardar('comentarios', comentarios);
  }

  // RN-01: categoría y proveedor son obligatorios; la marca es opcional
  guardar(datos) {
    if (!datos.nombre || !datos.categoria || !datos.proveedor || !datos.precio || !datos.imagen) {
      throw new Error('Completa nombre, categoría, proveedor, precio e imagen');
    }
    const productos = this.listarTodos();
    if (datos.id) {
      const indice = productos.findIndex((p) => p.id === datos.id);
      productos[indice] = { ...productos[indice], ...datos };
    } else {
      productos.push({ ...datos, id: this.almacen.siguienteId('productos') });
    }
    this.almacen.guardar('productos', productos);
  }

  // Eliminar un producto elimina en cascada sus comentarios
  eliminar(id) {
    this.almacen.guardar('productos', this.listarTodos().filter((p) => p.id !== id));
    this.almacen.guardar('comentarios', this.almacen.leer('comentarios', []).filter((c) => c.productoId !== id));
  }
}
