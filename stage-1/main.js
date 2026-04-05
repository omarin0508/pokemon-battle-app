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
   ========================================================= */
const state = {
  trainer: null,
  player: null,
  opponent: null,
};

/* =========================================================
   2) TEMPORIZADOR PARA DEBOUNCE
   ---------------------------------------------------------
   Se usa para evitar disparar una búsqueda en cada tecla
   sin control. Solo busca cuando el usuario deja de escribir
   por un pequeño momento.
   ========================================================= */
let searchDebounceTimer = null;

/* =========================================================
   3) ACTUALIZAR BOTONES
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
   4) CARGAR CONFIGURACIÓN DEL TRAINER
   ========================================================= */
async function loadTrainerConfig() {
  const module = await import("../trainer.config.js");
  return module.default || module.trainerConfig || module;
}

/* =========================================================
   5) CARGAR OPONENTE POR NOMBRE
   ---------------------------------------------------------
   Usa AbortController desde api.js para cancelar búsquedas
   previas del oponente cuando haga falta.
   ========================================================= */
async function loadOpponentByName(name, { updateInput = false } = {}) {
  if (!name?.trim()) return;

  const input = document.getElementById("opponent-input");

  try {
    renderOpponentLoading();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    const pokemon = await fetchPokemon(name, { useAbort: true });

    /* Si la request fue cancelada, no seguimos */
    if (!pokemon) return;

    state.opponent = pokemon;

    renderOpponentPokemon(state.opponent);
    saveLastOpponent(state.opponent.name);

    if (updateInput && input) {
      input.value = state.opponent.name;
    }

    updateBattleControls();
  } catch (error) {
    console.error(error);

    state.opponent = null;

    renderOpponentError("That Pokémon does not exist.");
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    updateBattleControls();
  }
}

/* =========================================================
   6) INICIALIZAR STAGE 1
   ========================================================= */
async function init() {
  try {
    const trainerConfig = await loadTrainerConfig();
    state.trainer = trainerConfig;

    renderTrainerCard(state.trainer);
    renderOpponentPlaceholder();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
    renderPlayerLoading();

    /* El Pokémon favorito no necesita AbortController */
    const favoritePokemon = await fetchPokemon(state.trainer.favoritePokemon);
    state.player = favoritePokemon;

    renderPlayerPokemon(state.player);

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
   7) BUSCAR OPONENTE DESDE EL INPUT
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
   8) DEBOUNCE PARA LIVE SEARCH
   ---------------------------------------------------------
   Espera unos milisegundos después de que el usuario deje
   de escribir antes de lanzar la búsqueda.
   ========================================================= */
function handleOpponentInput() {
  const input = document.getElementById("opponent-input");
  const value = input?.value.trim();

  clearTimeout(searchDebounceTimer);

  if (!value) {
    state.opponent = null;
    renderOpponentPlaceholder();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
    updateBattleControls();
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    searchOpponent();
  }, 500);
}

/* =========================================================
   9) IR A STAGE 2
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
   10) RESETEAR SELECCIÓN
   ========================================================= */
function resetSelection() {
  const input = document.getElementById("opponent-input");
  if (input) input.value = "";

  clearTimeout(searchDebounceTimer);

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
   11) EVENTOS
   ========================================================= */
document.getElementById("search-btn")?.addEventListener("click", searchOpponent);

document.getElementById("opponent-input")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    clearTimeout(searchDebounceTimer);
    searchOpponent();
  }
});

document.getElementById("opponent-input")?.addEventListener("input", handleOpponentInput);

document.getElementById("fight-btn")?.addEventListener("click", goToBattle);
document.getElementById("reset-btn")?.addEventListener("click", resetSelection);

/* =========================================================
   12) ARRANQUE
   ========================================================= */
init();