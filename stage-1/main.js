/* =========================================================
   STAGE 1 - MAIN.JS
   ---------------------------------------------------------
   Este archivo controla la lógica principal del Stage 1.

   Responsabilidades:
   - Cargar la configuración del entrenador
   - Cargar el Pokémon favorito del trainer
   - Buscar un Pokémon oponente
   - Guardar la selección para Stage 2
   - Manejar botones y eventos de la interfaz

   En este stage NO ocurre la batalla.
   Aquí solo se prepara la información para pasar al Stage 2.
   ========================================================= */

import { fetchPokemon } from "./api.js";
import {
  saveLastOpponent,
  getLastOpponent,
  clearLastOpponent,
} from "./storage.js";
import {
  renderTrainerCard,
  renderPlayerPokemon,
  renderOpponentPokemon,
  renderPlayerLoading,
  renderOpponentLoading,
  renderOpponentPlaceholder,
  renderPlayerError,
  renderOpponentError,
  renderBattlePlaceholder,
  renderBattleLogPlaceholder,
} from "./render.js";

/* =========================================================
   1) ESTADO GLOBAL DEL STAGE 1
   ---------------------------------------------------------
   Guarda la información principal que se necesita para
   preparar la batalla.
   ========================================================= */
const state = {
  trainer: null,
  player: null,
  opponent: null,
};

/* =========================================================
   2) ACTUALIZAR ESTADO DE BOTONES
   ---------------------------------------------------------
   Habilita o deshabilita botones según si ya están listos:
   - el Pokémon del jugador
   - el Pokémon oponente

   Regla:
   - Si falta alguno, no se puede ir a la batalla.
   ========================================================= */
function updateBattleControls() {
  const fightBtn = document.getElementById("fight-btn");
  const resetBtn = document.getElementById("reset-btn");

  if (!fightBtn || !resetBtn) return;

  if (!state.player || !state.opponent) {
    fightBtn.disabled = true;
    resetBtn.disabled = false;
    return;
  }

  fightBtn.disabled = false;
  resetBtn.disabled = false;
}

/* =========================================================
   3) CARGAR CONFIGURACIÓN DEL TRAINER
   ---------------------------------------------------------
   Importa dinámicamente el archivo trainer.config.js.

   Esto permite separar la información personal del trainer
   de la lógica principal del programa.
   ========================================================= */
async function loadTrainerConfig() {
  const module = await import("../trainer.config.js");
  return module.default || module.trainerConfig || module;
}

/* =========================================================
   4) CARGAR OPONENTE POR NOMBRE
   ---------------------------------------------------------
   Busca un Pokémon en la API y lo coloca como oponente.

   Parámetros:
   - name: nombre del Pokémon a buscar
   - updateInput: si es true, también actualiza el input
     con el nombre final encontrado

   Flujo:
   - muestra loading
   - intenta buscar
   - si funciona: renderiza oponente y lo guarda
   - si falla: muestra error y limpia el oponente
   ========================================================= */
async function loadOpponentByName(name, { updateInput = false } = {}) {
  if (!name) return;

  const input = document.getElementById("opponent-input");

  try {
    /* Mostrar estados visuales mientras carga */
    renderOpponentLoading();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    const pokemon = await fetchPokemon(name);
    state.opponent = pokemon;

    /* Dibujar el oponente encontrado */
    renderOpponentPokemon(state.opponent);

    /* Guardar el último oponente exitoso */
    saveLastOpponent(state.opponent.name);

    /* Si se pide, actualizar el input con el nombre correcto */
    if (updateInput && input) {
      input.value = state.opponent.name;
    }

    updateBattleControls();
  } catch (error) {
    console.error(error);

    state.opponent = null;

    /* Mostrar error si no existe o falla la búsqueda */
    renderOpponentError("That Pokémon does not exist.");
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    updateBattleControls();
  }
}

/* =========================================================
   5) INICIALIZACIÓN GENERAL
   ---------------------------------------------------------
   Arranca el Stage 1.

   Qué hace:
   - carga trainer.config.js
   - renderiza la tarjeta del entrenador
   - carga el Pokémon favorito del trainer
   - revisa si había un oponente previo guardado
   - actualiza botones
   ========================================================= */
async function init() {
  try {
    /* Cargar datos del entrenador */
    const trainerConfig = await loadTrainerConfig();
    state.trainer = trainerConfig;

    /* Dibujar UI inicial */
    renderTrainerCard(state.trainer);
    renderOpponentPlaceholder();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
    renderPlayerLoading();

    /* Cargar el Pokémon favorito del trainer como player */
    const favoritePokemon = await fetchPokemon(state.trainer.favoritePokemon);
    state.player = favoritePokemon;

    renderPlayerPokemon(state.player);

    /* Si existe un último oponente guardado, cargarlo automáticamente */
    const lastOpponent = getLastOpponent();
    if (lastOpponent) {
      await loadOpponentByName(lastOpponent, { updateInput: true });
    }
  } catch (error) {
    console.error(error);
    renderPlayerError("Could not load trainer or favorite Pokémon.");
  }

  updateBattleControls();
}

/* =========================================================
   6) BUSCAR OPONENTE DESDE EL INPUT
   ---------------------------------------------------------
   Lee el valor escrito por el usuario y lanza la búsqueda.

   Si el input está vacío:
   - limpia el oponente
   - muestra error
   ========================================================= */
async function searchOpponent() {
  const input = document.getElementById("opponent-input");
  const value = input?.value.trim();

  if (!value) {
    state.opponent = null;

    renderOpponentError("Please type a Pokémon name.");
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    updateBattleControls();
    return;
  }

  await loadOpponentByName(value);
}

/* =========================================================
   7) IR A LA BATALLA (STAGE 2)
   ---------------------------------------------------------
   Valida que existan ambos Pokémon.
   Si todo está listo:
   - arma el objeto battleData
   - lo guarda en localStorage
   - navega al Stage 2

   Esto es el puente entre Stage 1 y Stage 2.
   ========================================================= */
function goToBattle() {
  if (!state.player || !state.opponent) {
    document.getElementById("battle-result").innerHTML = `
      <p>You need both Pokémon ready before going to battle.</p>
    `;
    renderBattleLogPlaceholder();
    updateBattleControls();
    return;
  }

  const battleData = {
    trainer: state.trainer,
    player: state.player,
    opponent: state.opponent,
    savedAt: Date.now(),
  };

  localStorage.setItem("pokemonBattleData", JSON.stringify(battleData));
  window.location.href = "../stage-2/index.html";
}

/* =========================================================
   8) RESETEAR SELECCIÓN
   ---------------------------------------------------------
   Limpia:
   - input del oponente
   - oponente actual
   - último oponente guardado

   Luego devuelve la UI al estado base.
   ========================================================= */
function resetSelection() {
  const input = document.getElementById("opponent-input");
  if (input) input.value = "";

  state.opponent = null;
  clearLastOpponent();

  if (state.player) {
    renderPlayerPokemon(state.player);
  }

  renderOpponentPlaceholder();
  renderBattlePlaceholder();
  renderBattleLogPlaceholder();

  updateBattleControls();
}

/* =========================================================
   9) EVENTOS DE LA INTERFAZ
   ---------------------------------------------------------
   Conectan botones y teclado con la lógica del Stage 1.
   ========================================================= */

/* Buscar oponente al hacer click */
document.getElementById("search-btn")?.addEventListener("click", searchOpponent);

/* Buscar oponente al presionar Enter en el input */
document.getElementById("opponent-input")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchOpponent();
  }
});

/* Navegar a Stage 2 */
document.getElementById("fight-btn")?.addEventListener("click", goToBattle);

/* Resetear selección */
document.getElementById("reset-btn")?.addEventListener("click", resetSelection);

/* =========================================================
   10) ARRANQUE DEL STAGE 1
   ========================================================= */
init();