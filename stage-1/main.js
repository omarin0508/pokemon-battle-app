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

const state = {
  trainer: null,
  player: null,
  opponent: null,
};

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

async function loadTrainerConfig() {
  const module = await import("../trainer.config.js");
  return module.default || module.trainerConfig || module;
}

async function loadOpponentByName(name, { updateInput = false } = {}) {
  if (!name) return;

  const input = document.getElementById("opponent-input");

  try {
    renderOpponentLoading();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();

    const pokemon = await fetchPokemon(name);
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

async function init() {
  try {
    const trainerConfig = await loadTrainerConfig();
    state.trainer = trainerConfig;

    renderTrainerCard(state.trainer);
    renderOpponentPlaceholder();
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
    renderPlayerLoading();

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

document.getElementById("search-btn")?.addEventListener("click", searchOpponent);

document.getElementById("opponent-input")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchOpponent();
  }
});

document.getElementById("fight-btn")?.addEventListener("click", goToBattle);
document.getElementById("reset-btn")?.addEventListener("click", resetSelection);

init();