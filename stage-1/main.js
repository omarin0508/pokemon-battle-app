import TRAINER from "../trainer.config.js";
import { fetchPokemonByName } from "./api.js";
import { render } from "./render.js";

const state = {
  trainer: TRAINER,

  playerPokemon: null,
  playerLoading: false,
  playerError: "",

  opponentPokemon: null,
  opponentLoading: false,
  opponentError: ""
};

async function loadFavoritePokemon() {
  state.playerLoading = true;
  state.playerError = "";
  render(state);

  try {
    const data = await fetchPokemonByName(state.trainer.favoritePokemon);
    state.playerPokemon = data;
  } catch (error) {
    state.playerError = error.message;
  } finally {
    state.playerLoading = false;
    render(state);
  }
}

async function loadOpponentPokemon(name) {
  state.opponentLoading = true;
  state.opponentError = "";
  state.opponentPokemon = null;
  render(state);

  try {
    const data = await fetchPokemonByName(name);
    state.opponentPokemon = data;
  } catch (error) {
    state.opponentError = error.message;
  } finally {
    state.opponentLoading = false;
    render(state);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render(state);
  loadFavoritePokemon();

  const searchBtn = document.querySelector("#search-btn");
  const opponentInput = document.querySelector("#opponent-input");

  searchBtn.addEventListener("click", () => {
    const name = opponentInput.value.trim();

    if (!name) {
      state.opponentError = "Escribe un nombre de Pokémon.";
      state.opponentPokemon = null;
      state.opponentLoading = false;
      render(state);
      return;
    }

    loadOpponentPokemon(name);
  });

  opponentInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const name = opponentInput.value.trim();

      if (!name) {
        state.opponentError = "Escribe un nombre de Pokémon.";
        state.opponentPokemon = null;
        state.opponentLoading = false;
        render(state);
        return;
      }

      loadOpponentPokemon(name);
    }
  });
});