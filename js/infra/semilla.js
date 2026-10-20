// Datos iniciales (seed) que simulan el contenido de la base de datos del sistema.
// Credenciales de demostración:
//   Administrador: admin@oclocklens.com / Admin123
//   Cliente:       cliente@oclocklens.com / Cliente123
const Semilla = {
  version: 1,

  asegurar() {
    if (Almacen.leer('semilla') === this.version) return;
    Almacen.reiniciar();

    Almacen.guardar('usuarios', [
      { id: 1, nombre: 'Administrador', apellidos: 'O\'Clock Lens', correo: 'admin@oclocklens.com',
        celular: '3173608640', direccion: 'Calle 10 # 20-30', ciudad: 'Medellín', barrio: 'El Poblado',
        claveHash: sha256('Admin123'), rol: 'Admin' },
      { id: 2, nombre: 'Laura', apellidos: 'Gómez', correo: 'cliente@oclocklens.com',
        celular: '3001234567', direccion: 'Carrera 45 # 12-08', ciudad: 'Medellín', barrio: 'Laureles',
        claveHash: sha256('Cliente123'), rol: 'Cliente' }
    ]);

    Almacen.guardar('categorias', [{ id: 1, nombre: 'Relojes' }, { id: 2, nombre: 'Gafas' }]);
    Almacen.guardar('marcas', [{ id: 1, nombre: 'Curren' }, { id: 2, nombre: 'Aurora' }, { id: 3, nombre: 'Ray-Style' }]);
    Almacen.guardar('proveedores', [{ id: 1, nombre: 'Importaciones Medellín' }, { id: 2, nombre: 'Distribuidora Andina' }]);

    Almacen.guardar('productos', [
      { id: 1, nombre: 'Reloj Curren Acero Dorado', categoria: 'Relojes', marca: 'Curren', proveedor: 'Importaciones Medellín',
        precio: 189000, oferta: '10% OFF', imagen: 'img/r-2.jpg', estado: 'disponible',
        descripcion: 'Un reloj clásico con acabado en acero dorado y esfera azul profundo. Ideal para el día a día y para ocasiones especiales.',
        especificaciones: ['Caja de acero inoxidable de 42 mm.', 'Resistencia al agua 3 ATM.', 'Movimiento de cuarzo japonés.', 'Correa metálica ajustable.', 'Garantía de 12 meses.'] },
      { id: 2, nombre: 'Reloj Minimalista Negro', categoria: 'Relojes', marca: 'Aurora', proveedor: 'Distribuidora Andina',
        precio: 155000, oferta: '', imagen: 'img/r-1.jpg', estado: 'disponible',
        descripcion: 'Diseño minimalista con esfera blanca y correa negra. Se adapta a cualquier atuendo.',
        especificaciones: ['Caja de 40 mm.', 'Correa de silicona negra.', 'Resistente a salpicaduras.', 'Garantía de 6 meses.'] },
      { id: 3, nombre: 'Reloj Deportivo Azul', categoria: 'Relojes', marca: 'Curren', proveedor: 'Importaciones Medellín',
        precio: 210000, oferta: '', imagen: 'img/r-3.jpeg', estado: 'disponible',
        descripcion: 'Reloj deportivo de caja azul con cronómetro y gran visibilidad para actividades al aire libre.',
        especificaciones: ['Caja de 45 mm.', 'Cronómetro y calendario.', 'Resistencia al agua 5 ATM.', 'Garantía de 12 meses.'] },
      { id: 4, nombre: 'Gafas Polarizadas Negro Mate', categoria: 'Gafas', marca: 'Ray-Style', proveedor: 'Distribuidora Andina',
        precio: 95000, oferta: '10% OFF', imagen: 'img/g-1.jpg', estado: 'disponible',
        descripcion: 'Gafas con lentes polarizados y montura negra mate para reducir el reflejo del sol.',
        especificaciones: ['Lentes polarizados UV400.', 'Montura ligera.', 'Incluye estuche y paño.'] },
      { id: 5, nombre: 'Gafas Aurora Cristal', categoria: 'Gafas', marca: 'Aurora', proveedor: 'Distribuidora Andina',
        precio: 120000, oferta: '', imagen: 'img/g-2.jpg', estado: 'disponible',
        descripcion: 'Lentes de cristal con montura dorada, un estilo elegante para todos los días.',
        especificaciones: ['Lentes de cristal.', 'Montura metálica dorada.', 'Incluye estuche.'] },
      { id: 6, nombre: 'Gafas Ray-Style Clásicas', categoria: 'Gafas', marca: 'Ray-Style', proveedor: 'Importaciones Medellín',
        precio: 110000, oferta: '', imagen: 'img/g-3.jpg', estado: 'disponible',
        descripcion: 'Estilo clásico atemporal con protección UV400.',
        especificaciones: ['Protección UV400.', 'Montura de acetato.', 'Incluye estuche.'] }
    ]);

    Almacen.guardar('cupones', [
      { id: 1, codigo: 'OCLOCK10', descuento: '10%', estado: 'activo' },
      { id: 2, codigo: 'BIENVENIDO', descuento: '20000', estado: 'activo' }
    ]);

    Almacen.guardar('comentarios', [
      { id: 1, productoId: 1, usuario: 'Laura Gómez', texto: 'Excelente calidad, llegó rápido y se ve igual que en las fotos.', fecha: '2026-08-02' },
      { id: 2, productoId: 4, usuario: 'Carlos R.', texto: 'Muy buenas gafas por el precio.', fecha: '2026-08-10' }
    ]);

    Almacen.guardar('carritos', {});
    Almacen.guardar('bitacora', []);
    Almacen.guardar('pedidos', [
      { id: 1, referencia: 'OCL-DEMO-001', usuarioId: 2, cliente: 'Laura Gómez',
        items: [{ productoId: 1, nombre: 'Reloj Curren Acero Dorado', precio: 189000, cantidad: 1 }],
        subtotal: 189000, descuento: 0, envio: 10000, total: 199000, estado: 'Exitoso',
        guia: '', entidad: '', fecha: '2026-08-12 10:15' },
      { id: 2, referencia: 'OCL-DEMO-002', usuarioId: 2, cliente: 'Laura Gómez',
        items: [{ productoId: 4, nombre: 'Gafas Polarizadas Negro Mate', precio: 95000, cantidad: 2 }],
        subtotal: 190000, descuento: 19000, envio: 10000, total: 181000, estado: 'Enviado',
        guia: 'SRV123456', entidad: 'Servientrega', fecha: '2026-08-14 16:40' }
    ]);

    Almacen.guardar('semilla', this.version);
  }
};
