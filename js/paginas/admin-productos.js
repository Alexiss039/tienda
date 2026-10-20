// HU-11 Gestionar productos (solo Admin): crear, editar y eliminar.
const admin = UI.montar('admin-productos') && UI.requerirSesion('Admin');

function opciones(select, lista, vacio) {
  select.innerHTML = (vacio ? '<option value="">— Sin marca —</option>' : '') +
    lista.map((e) => '<option>' + UI.escapar(e.nombre) + '</option>').join('');
}

function limpiarFormulario() {
  document.getElementById('form-producto').reset();
  document.getElementById('form-producto').dataset.id = '';
  document.getElementById('titulo-form').textContent = 'Crear producto';
  document.getElementById('cancelar').hidden = true;
}

function pintarTabla() {
  document.getElementById('tabla-productos').innerHTML =
    '<thead><tr><th></th><th>Producto</th><th>Categoría / Marca</th><th>Proveedor</th><th>Precio</th><th>Estado</th><th></th></tr></thead><tbody>' +
    OCL.catalogo.listarTodos().map((p) =>
      '<tr><td><img src="' + UI.escapar(p.imagen) + '" alt=""></td><td>' + UI.escapar(p.nombre) + '</td><td>' +
      UI.escapar(p.categoria) + (p.marca ? ' / ' + UI.escapar(p.marca) : '') + '</td><td>' + UI.escapar(p.proveedor) +
      '</td><td>' + UI.moneda(p.precio) + '</td><td><span class="insignia insignia--' + p.estado + '">' + p.estado +
      '</span></td><td><div class="acciones-fila">' +
      '<button type="button" class="boton boton--borde boton--pequeno" data-editar="' + p.id + '">Editar</button>' +
      '<button type="button" class="boton boton--borde boton--pequeno" data-eliminar="' + p.id + '">Eliminar</button>' +
      '</div></td></tr>').join('') + '</tbody>';
}

if (admin) {
  opciones(document.getElementById('categoria'), OCL.catalogo.categorias());
  opciones(document.getElementById('marca'), OCL.catalogo.marcas(), true);
  opciones(document.getElementById('proveedor'), OCL.catalogo.proveedores());
  pintarTabla();

  const formulario = document.getElementById('form-producto');
  const campo = (id) => document.getElementById(id);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    try {
      OCL.catalogo.guardar({
        id: formulario.dataset.id ? Number(formulario.dataset.id) : undefined,
        nombre: campo('nombre').value.trim(),
        precio: Number(campo('precio').value),
        categoria: campo('categoria').value,
        marca: campo('marca').value,
        proveedor: campo('proveedor').value,
        imagen: campo('imagen').value,
        estado: campo('estado').value,
        oferta: campo('oferta').value.trim(),
        descripcion: campo('descripcion').value.trim(),
        especificaciones: campo('especificaciones').value.split('\n').map((l) => l.trim()).filter(Boolean)
      });
      limpiarFormulario();
      pintarTabla();
      UI.aviso('Producto guardado.', 'exito');
    } catch (error) {
      UI.aviso(error.message, 'error');
    }
  });

  document.getElementById('cancelar').addEventListener('click', limpiarFormulario);

  document.getElementById('tabla-productos').addEventListener('click', (evento) => {
    const editar = evento.target.closest('[data-editar]');
    const eliminar = evento.target.closest('[data-eliminar]');
    if (editar) {
      const p = OCL.catalogo.obtener(editar.dataset.editar);
      formulario.dataset.id = p.id;
      ['nombre', 'precio', 'categoria', 'marca', 'proveedor', 'imagen', 'estado', 'oferta', 'descripcion']
        .forEach((id) => { campo(id).value = p[id] || ''; });
      campo('especificaciones').value = p.especificaciones.join('\n');
      document.getElementById('titulo-form').textContent = 'Editar producto';
      document.getElementById('cancelar').hidden = false;
      formulario.scrollIntoView({ behavior: 'smooth' });
    }
    if (eliminar && confirm('¿Eliminar el producto y sus comentarios asociados?')) {
      OCL.catalogo.eliminar(Number(eliminar.dataset.eliminar));
      pintarTabla();
      UI.aviso('Producto eliminado.', 'info');
    }
  });
}
