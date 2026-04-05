/* =========================================================
   API.JS
   ---------------------------------------------------------
   Encargado de las llamadas a la PokeAPI para Stage 1.

   Responsabilidades:
   - Buscar Pokémon por nombre
   - Cancelar búsquedas previas del oponente
   - Traer en paralelo detalles de los primeros 4 moves
   ========================================================= */

const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

/* =========================================================
   1) CONTROLADOR GLOBAL DE BÚSQUEDA
   ---------------------------------------------------------
   Se usa para cancelar búsquedas anteriores del oponente
   cuando el usuario escribe rápido o lanza otra búsqueda.
   ========================================================= */
let opponentSearchController = null;

/* =========================================================
   2) TRAER DETALLES DE MOVES EN PARALELO
   ---------------------------------------------------------
   Recibe los primeros 4 moves del Pokémon y consulta
   sus detalles en paralelo usando Promise.allSettled.

   ¿Por qué allSettled?
   Porque si falla un move, no queremos perder todo
   el Pokémon; simplemente seguimos con los demás.
   ========================================================= */
async function fetchMoveDetails(moves = []) {
  const firstFourMoves = moves.slice(0, 4);

  const results = await Promise.allSettled(
    firstFourMoves.map((moveEntry) => fetch(moveEntry.move.url).then((res) => {
      if (!res.ok) {
        throw new Error(`Could not load move: ${moveEntry.move.name}`);
      }
      return res.json();
    }))
  );

  return firstFourMoves.map((moveEntry, index) => {
    const result = results[index];

    if (result.status === "fulfilled") {
      return {
        name: moveEntry.move.name,
        power: result.value.power ?? "—",
        accuracy: result.value.accuracy ?? "—",
        pp: result.value.pp ?? "—",
        type: result.value.type?.name ?? "unknown",
      };
    }

    return {
      name: moveEntry.move.name,
      power: "—",
      accuracy: "—",
      pp: "—",
      type: "unknown",
    };
  });
}

/* =========================================================
   3) FETCH PRINCIPAL DE POKÉMON
   ---------------------------------------------------------
   Busca un Pokémon y además enriquece sus primeros 4 moves
   con detalles extra.

   Opciones:
   - useAbort: permite decidir si esta llamada debe cancelar
     búsquedas previas. Útil para el oponente, pero no tanto
     para otras cargas como el Pokémon favorito del trainer.
   ========================================================= */
export async function fetchPokemon(name, { useAbort = false } = {}) {
  if (!name?.trim()) {
    throw new Error("Please provide a Pokémon name.");
  }

  let signal;

  /* Si esta llamada debe usar abort, cancelamos la anterior */
  if (useAbort) {
    if (opponentSearchController) {
      opponentSearchController.abort();
    }

    opponentSearchController = new AbortController();
    signal = opponentSearchController.signal;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/${name.toLowerCase().trim()}`,
      signal ? { signal } : undefined
    );

    if (!response.ok) {
      throw new Error("Pokémon not found");
    }

    const pokemon = await response.json();

    /* Enriquecer los primeros 4 moves con detalles extra */
    const moveDetails = await fetchMoveDetails(pokemon.moves);

    return {
      ...pokemon,
      moveDetails,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return null;
    }

    throw error;
  }
}