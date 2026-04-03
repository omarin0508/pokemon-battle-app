import { fetchPokemon } from "./api.js";
import { simulateBattle } from "./battle.js";
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
  renderBattleResult,
  renderBattleLog,
  renderBattleLogPlaceholder,
} from "./render.js";

const state = {
  trainer: null,
  player: null,
  opponent: null,
};

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

    if (updateInput) {
      input.value = state.opponent.name;
    }
  } catch (error) {
    console.error(error);
    state.opponent = null;
    renderOpponentError("That Pokémon does not exist.");
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
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
}

async function searchOpponent() {
  const input = document.getElementById("opponent-input");
  const value = input.value.trim();

  if (!value) {
    state.opponent = null;
    renderOpponentError("Please type a Pokémon name.");
    renderBattlePlaceholder();
    renderBattleLogPlaceholder();
    return;
  }

  await loadOpponentByName(value);
}

function fightBattle() {
  if (!state.player || !state.opponent) {
    document.getElementById("battle-result").innerHTML = `
      <p>You need both Pokémon ready before fighting.</p>
    `;
    renderBattleLogPlaceholder();
    return;
  }

  const result = simulateBattle(state.player, state.opponent);
  renderBattleResult(result);
  renderBattleLog(result.log);
}

function resetBattle() {
  const input = document.getElementById("opponent-input");
  input.value = "";

  state.opponent = null;
  clearLastOpponent();
  renderOpponentPlaceholder();
  renderBattlePlaceholder();
  renderBattleLogPlaceholder();
}

document.getElementById("search-btn").addEventListener("click", searchOpponent);

document.getElementById("opponent-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchOpponent();
  }
});

document.getElementById("fight-btn").addEventListener("click", fightBattle);
document.getElementById("reset-btn").addEventListener("click", resetBattle);

init();