function getPokemonStats(pokemon) {
  return {
    hp: pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat ?? 0,
    attack: pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat ?? 0,
    defense: pokemon.stats.find((s) => s.stat.name === "defense")?.base_stat ?? 0,
    speed: pokemon.stats.find((s) => s.stat.name === "speed")?.base_stat ?? 0,
  };
}

function getPokemonImage(pokemon) {
  return (
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon?.sprites?.front_default ||
    ""
  );
}

function getHpPercent(hp) {
  const maxVisualHp = 255;
  return Math.max(5, Math.min(100, (hp / maxVisualHp) * 100));
}

function createPokemonCard(pokemon, label = "Pokémon") {
  const types = pokemon.types.map((t) => t.type.name).join(", ");
  const moves = pokemon.moves.slice(0, 4).map((m) => m.move.name);
  const stats = getPokemonStats(pokemon);
  const image = getPokemonImage(pokemon);
  const hpPercent = getHpPercent(stats.hp);

  return `
    <article class="pokemon-card">
      <div class="pokemon-header">
        <div>
          <div class="pokemon-types">${label}</div>
          <h3 class="pokemon-name">${pokemon.name}</h3>
        </div>
        <div class="pokemon-types">${types}</div>
      </div>

      <div class="hp-block">
        <div class="hp-label-row">
          <span>HP</span>
          <strong>${stats.hp}</strong>
        </div>
        <div class="hp-bar">
          <div class="hp-fill" style="width: ${hpPercent}%"></div>
        </div>
      </div>

      <div class="pokemon-image-wrap">
        ${
          image
            ? `<img class="pokemon-image" src="${image}" alt="${pokemon.name}" />`
            : `<p>No image available</p>`
        }
      </div>

      <div class="pokemon-section">
        <h4>Moves</h4>
        <div class="moves-list">
          ${moves
            .map(
              (move, index) => `
              <div class="move-row">
                <span>Move ${index + 1}</span>
                <strong>${move}</strong>
              </div>
            `
            )
            .join("")}
        </div>
      </div>

      <div class="pokemon-section">
        <h4>Stats</h4>
        <div class="stats-list">
          <div class="stat-row"><span>HP</span><strong>${stats.hp}</strong></div>
          <div class="stat-row"><span>Attack</span><strong>${stats.attack}</strong></div>
          <div class="stat-row"><span>Defense</span><strong>${stats.defense}</strong></div>
          <div class="stat-row"><span>Speed</span><strong>${stats.speed}</strong></div>
        </div>
      </div>
    </article>
  `;
}

export function renderTrainerCard(trainer) {
  const trainerCard = document.getElementById("trainer-card");
  trainerCard.innerHTML = `
    <div class="trainer-info">
      <h2>${trainer.name}</h2>
      <p><strong>City:</strong> ${trainer.city}</p>
      <p><strong>Phrase:</strong> ${trainer.phrase}</p>
      <p><strong>Move:</strong> ${trainer.move}</p>
    </div>
  `;
}

export function renderPlayerPokemon(pokemon) {
  const container = document.getElementById("player-slot");
  container.innerHTML = createPokemonCard(pokemon, "Your Pokémon");
}

export function renderOpponentPokemon(pokemon) {
  const container = document.getElementById("opponent-slot");
  container.innerHTML = createPokemonCard(pokemon, "Opponent");
}

export function renderPlayerLoading() {
  document.getElementById("player-slot").innerHTML = `
    <div class="loading-card">
      <p>Loading your Pokémon...</p>
    </div>
  `;
}

export function renderOpponentLoading() {
  document.getElementById("opponent-slot").innerHTML = `
    <div class="loading-card">
      <p>Searching opponent...</p>
    </div>
  `;
}

export function renderOpponentPlaceholder() {
  document.getElementById("opponent-slot").innerHTML = `
    <div class="placeholder-card">
      <p>Search for a Pokémon to start the battle view.</p>
    </div>
  `;
}

export function renderPlayerError(message = "Could not load your Pokémon.") {
  document.getElementById("player-slot").innerHTML = `
    <div class="error-card">
      <p>${message}</p>
    </div>
  `;
}

export function renderOpponentError(message = "Opponent not found.") {
  document.getElementById("opponent-slot").innerHTML = `
    <div class="error-card">
      <p>${message}</p>
    </div>
  `;
}

export function renderBattlePlaceholder() {
  document.getElementById("battle-result").innerHTML = `
    <p>Choose an opponent and press Fight.</p>
  `;
}

export function renderBattleResult(result) {
  const battleResult = document.getElementById("battle-result");

  const winnerLabel =
    result.winner === "player"
      ? "Winner: Your Pokémon"
      : result.winner === "opponent"
      ? "Winner: Opponent"
      : "Result: Draw";

  battleResult.innerHTML = `
    <div class="battle-result-content">
      <h3>${winnerLabel}</h3>
      <p>${result.message}</p>

      <div class="battle-score">
        <div class="battle-score-row">
          <span>${result.player.name.toUpperCase()}</span>
          <strong>${result.player.score}</strong>
        </div>
        <div class="battle-score-row">
          <span>${result.opponent.name.toUpperCase()}</span>
          <strong>${result.opponent.score}</strong>
        </div>
      </div>
    </div>
  `;
}