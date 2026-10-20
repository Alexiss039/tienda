// Carga ordenada de las capas de la aplicación (infraestructura -> dominio -> servicios -> interfaz).
// Se usa document.write para conservar el orden y permitir abrir las páginas sin servidor.
(function () {
  const capas = [
    'infra/sha256', 'infra/almacen', 'infra/semilla',
    'dominio/reglas', 'dominio/descuentos', 'dominio/pasarela',
    'servicios/bitacora', 'servicios/notificador', 'servicios/auth', 'servicios/catalogo',
    'servicios/carrito', 'servicios/pedidos', 'servicios/checkout',
    'app', 'ui/layout'
  ];
  capas.forEach((capa) => {
    document.write('<script src="js/' + capa + '.js"><\/script>');
  });
})();
