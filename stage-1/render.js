function getPokemonStats(pokemon) {
  return {
    hp: pokemon.stats.find((stat) => stat.stat.name === "hp")?.base_stat ?? "N/A",
    attack: pokemon.stats.find((stat) => stat.stat.name === "attack")?.base_stat ?? "N/A",
    defense: pokemon.stats.find((stat) => stat.stat.name === "defense")?.base_stat ?? "N/A",
    speed: pokemon.stats.find((stat) => stat.stat.name === "speed")?.base_stat ?? "N/A"
  };
}

function renderPokemonCard(pokemon) {
  const types = pokemon.types.map((t) => t.type.name).join(", ");
  const moves = pokemon.moves.slice(0, 4).map((m) => m.move.name).join(", ");
  const stats = getPokemonStats(pokemon);

  // 🔥 FIX IMPORTANTE: fallback de imagen
  const image =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default ||
    "";

  return `
    <div class="pokemon-card">
      <h3>${pokemon.name.toUpperCase()}</h3>
      <img src="${image}" alt="${pokemon.name}">
      <p><strong>Type:</strong> ${types}</p>
      <p><strong>HP:</strong> ${stats.hp}</p>
      <p><strong>Attack:</strong> ${stats.attack}</p>
      <p><strong>Defense:</strong> ${stats.defense}</p>
      <p><strong>Speed:</strong> ${stats.speed}</p>
      <p><strong>Moves:</strong> ${moves}</p>
    </div>
  `;
}

export function render(state) {
  const trainerEl = document.querySelector("#trainer-card");
  const playerEl = document.querySelector("#player-pokemon");
  const opponentEl = document.querySelector("#opponent-pokemon");

  // Trainer
  trainerEl.innerHTML = `
    <h2>${state.trainer.name}</h2>
    <p><strong>Hometown:</strong> ${state.trainer.hometown}</p>
    <p><strong>Catchphrase:</strong> ${state.trainer.catchphrase}</p>
    <p><strong>Definitive Move:</strong> ${state.trainer.definitiveMoveName}</p>
  `;

  // Player
  if (state.playerLoading) {
    playerEl.innerHTML = `<p class="muted-text">Cargando Pokémon favorito...</p>`;
  } else if (state.playerError) {
    playerEl.innerHTML = `<p class="error-text">${state.playerError}</p>`;
  } else if (!state.playerPokemon) {
    playerEl.innerHTML = `<p class="muted-text">No hay Pokémon cargado.</p>`;
  } else {
    playerEl.innerHTML = renderPokemonCard(state.playerPokemon);
  }

  // Opponent
  if (state.opponentLoading) {
    opponentEl.innerHTML = `<p class="muted-text">Cargando oponente...</p>`;
  } else if (state.opponentError) {
    opponentEl.innerHTML = `<p class="error-text">${state.opponentError}</p>`;
  } else if (!state.opponentPokemon) {
    opponentEl.innerHTML = `<p class="muted-text">No hay oponente seleccionado.</p>`;
  } else {
    opponentEl.innerHTML = renderPokemonCard(state.opponentPokemon);
  }
}