/* =========================================================
   STAGE 1 - STORAGE.JS
   ---------------------------------------------------------
   Este archivo se encarga de manejar la persistencia simple
   de datos usando el navegador (localStorage).

   Responsabilidades:
   - Guardar el último Pokémon oponente buscado
   - Recuperarlo cuando la app se vuelve a cargar
   - Limpiar ese valor cuando sea necesario

   Nota:
   localStorage permite guardar datos en el navegador del
   usuario de forma persistente (aunque se recargue la página).
========================================================= */


/* =========================================================
   CONSTANTE: LAST_OPPONENT_KEY
   ---------------------------------------------------------
   Clave única que se usará para guardar y recuperar el dato
   dentro de localStorage.

   Esto evita errores por usar strings repetidos en múltiples
   lugares del código y facilita mantenimiento.
========================================================= */
const LAST_OPPONENT_KEY = "pokemon-battle-last-opponent";


/* =========================================================
   FUNCIÓN EXPORTADA: saveLastOpponent
   ---------------------------------------------------------
   Recibe:
   - name: nombre del Pokémon oponente

   Qué hace:
   - Si no hay nombre, no hace nada (protección)
   - Convierte el nombre a minúsculas
   - Elimina espacios extra con trim()
   - Guarda el valor en localStorage usando la clave definida

   Ejemplo:
   saveLastOpponent(" Pikachu ")
   → se guarda como "pikachu"

   Esto ayuda a mantener consistencia en los datos guardados.
========================================================= */
export function saveLastOpponent(name) {
  if (!name) return;
  localStorage.setItem(LAST_OPPONENT_KEY, name.toLowerCase().trim());
}


/* =========================================================
   FUNCIÓN EXPORTADA: getLastOpponent
   ---------------------------------------------------------
   Qué hace:
   - Recupera el valor guardado en localStorage usando la clave
   - Si no existe, devuelve null

   Uso típico:
   - Autocompletar el input de búsqueda
   - Recordar el último Pokémon usado

   Nota:
   localStorage siempre devuelve strings o null.
========================================================= */
export function getLastOpponent() {
  return localStorage.getItem(LAST_OPPONENT_KEY);
}


/* =========================================================
   FUNCIÓN EXPORTADA: clearLastOpponent
   ---------------------------------------------------------
   Qué hace:
   - Elimina el valor guardado en localStorage asociado a la clave

   Uso:
   - Resetear estado
   - Limpiar datos guardados
   - Evitar reutilizar un oponente anterior

   Importante:
   Solo elimina esta clave específica, no afecta otros datos
   que puedan existir en localStorage.
========================================================= */
export function clearLastOpponent() {
  localStorage.removeItem(LAST_OPPONENT_KEY);
}