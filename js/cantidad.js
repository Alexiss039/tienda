// Control de cantidad del detalle de producto (mínimo 1)
const CANTIDAD_MINIMA = 1;

const campoCantidad = document.getElementById('cantidad');
const botonMenos = document.getElementById('cantidad-menos');
const botonMas = document.getElementById('cantidad-mas');

function actualizarCantidad(nuevoValor) {
  const valor = Math.max(CANTIDAD_MINIMA, nuevoValor);
  campoCantidad.value = valor;
  botonMenos.disabled = valor <= CANTIDAD_MINIMA;
}

botonMenos.addEventListener('click', () => {
  actualizarCantidad(Number(campoCantidad.value) - 1);
});

botonMas.addEventListener('click', () => {
  actualizarCantidad(Number(campoCantidad.value) + 1);
});

actualizarCantidad(Number(campoCantidad.value));
