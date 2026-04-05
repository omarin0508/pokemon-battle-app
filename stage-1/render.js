/* =========================================================
   STAGE 1 - RENDER.JS
   ---------------------------------------------------------
   Este archivo se encarga de dibujar en pantalla la interfaz
   del Stage 1.

   Responsabilidades:
   - Renderizar la tarjeta del entrenador
   - Renderizar el Pokémon del jugador
   - Renderizar el Pokémon oponente
   - Mostrar estados de loading, error y placeholders
   - Mostrar resultados y log previos a la batalla

   Idea clave:
   Este archivo solo se enfoca en la parte visual.
   No contiene la lógica principal del flujo.
   ========================================================= */

/* =========================================================
   1) HELPERS DE POKÉMON
   ---------------------------------------------------------
   Estas funciones ayudan a extraer y preparar información
   necesaria para pintar las tarjetas en pantalla.
   ========================================================= */

/* Extrae las estadísticas principales del Pokémon */
function getPokemonStats(pokemon) {
  return {
    hp: pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat ?? 0,
    attack: pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat ?? 0,
    defense: pokemon.stats.find((s) => s.stat.name === "defense")?.base_stat ?? 0,
    speed: pokemon.stats.find((s) => s.stat.name === "speed")?.base_stat ?? 0,
  };
}

/* Busca la mejor imagen disponible del Pokémon */
function getPokemonImage(pokemon) {
  return (
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon?.sprites?.front_default ||
    ""
  );
}

/* Calcula el porcentaje de vida para la barra de HP */
function getHpPercent(currentHp, maxHp) {
  if (!maxHp || maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
}

/* =========================================================
   2) CREACIÓN DE TARJETA DE POKÉMON
   ---------------------------------------------------------
   Construye el HTML de una tarjeta visual de Pokémon
   con nombre, tipos, HP, imagen, movimientos y stats.
   ========================================================= */
function createPokemonCard(pokemon, label = "Pokémon", currentHp = null) {
  const types = pokemon.types.map((t) => t.type.name).join(", ");
  const moves = pokemon.moves.slice(0, 4).map((m) => m.move.name);
  const stats = getPokemonStats(pokemon);
  const image = getPokemonImage(pokemon);

  /* Si no se pasa un HP actual, se usa el HP base */
  const displayedHp = currentHp ?? stats.hp;
  const hpPercent = getHpPercent(displayedHp, stats.hp);

  return `
    <article class="pokemon-card">
      <div class="pokemon-header">
        <div>
          <div class="pokemon-types">${label}</div>
          <h3 class="pokemon-name">${pokemon.name.toUpperCase()}</h3>
        </div>
        <div class="pokemon-types">${types}</div>
      </div>

      <div class="hp-block">
        <div class="hp-label-row">
          <span>HP</span>
          <strong>${displayedHp}</strong>
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

/* =========================================================
   3) RENDER DEL TRAINER
   ---------------------------------------------------------
   Dibuja la tarjeta del entrenador en Stage 1.

   Compatibilidad:
   Soporta tanto las claves nuevas como las antiguas:
   - hometown / city
   - catchphrase / phrase
   - definitiveMoveName / move

   Esto evita romper el proyecto mientras alineamos
   los nombres entre Stage 1 y Stage 2.
   ========================================================= */
export function renderTrainerCard(trainer) {
  const trainerCard = document.getElementById("trainer-card");
  if (!trainerCard || !trainer) return;

  const hometown = trainer.hometown ?? trainer.city ?? "-";
  const catchphrase = trainer.catchphrase ?? trainer.phrase ?? "-";
  const definitiveMoveName = trainer.definitiveMoveName ?? trainer.move ?? "-";

  trainerCard.innerHTML = `
    <div class="trainer-info">
      <h2>${trainer.name ?? "Unknown Trainer"}</h2>
      <p><strong>Hometown:</strong> ${hometown}</p>
      <p><strong>Catchphrase:</strong> ${catchphrase}</p>
      <p><strong>Definitive Move:</strong> ${definitiveMoveName}</p>
      <p><strong>Favorite Pokémon:</strong> ${trainer.favoritePokemon ?? "-"}</p>
    </div>
  `;
}

/* =========================================================
   4) RENDER DEL POKÉMON DEL JUGADOR
   ---------------------------------------------------------
   Dibuja la tarjeta del Pokémon favorito del trainer.
   ========================================================= */
export function renderPlayerPokemon(pokemon, currentHp = null) {
  const container = document.getElementById("player-slot");
  if (!container || !pokemon) return;

  container.innerHTML = createPokemonCard(pokemon, "Your Pokémon", currentHp);
}

/* =========================================================
   5) RENDER DEL POKÉMON OPONENTE
   ---------------------------------------------------------
   Dibuja la tarjeta del Pokémon rival seleccionado.
   ========================================================= */
export function renderOpponentPokemon(pokemon, currentHp = null) {
  const container = document.getElementById("opponent-slot");
  if (!container || !pokemon) return;

  container.innerHTML = createPokemonCard(pokemon, "Opponent", currentHp);
}

/* =========================================================
   6) ESTADOS DE CARGA
   ---------------------------------------------------------
   Se usan mientras se espera la respuesta de datos.
   ========================================================= */
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

/* =========================================================
   7) PLACEHOLDERS
   ---------------------------------------------------------
   Estados iniciales o vacíos cuando todavía no hay
   un oponente o un resultado activo.
   ========================================================= */
export function renderOpponentPlaceholder() {
  document.getElementById("opponent-slot").innerHTML = `
    <div class="placeholder-card">
      <p>Search for a Pokémon to start the battle view.</p>
    </div>
  `;
}

export function renderBattlePlaceholder() {
  document.getElementById("battle-result").innerHTML = `
    <p>Choose an opponent and press Go to Battle.</p>
  `;
}

export function renderBattleLogPlaceholder() {
  const battleLog = document.getElementById("battle-log");

  battleLog.innerHTML = `
    <div class="battle-log-content">
      <h3>Battle Log</h3>
      <div class="battle-log-list">
        <p>The turn-by-turn battle log will appear here.</p>
      </div>
    </div>
  `;
}

/* =========================================================
   8) ESTADOS DE ERROR
   ---------------------------------------------------------
   Se muestran cuando falla la carga del player o
   la búsqueda del oponente.
   ========================================================= */
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

/* =========================================================
   9) RESULTADO DE BATALLA PREVIA
   ---------------------------------------------------------
   Esta función sirve para mostrar un resumen de batalla
   si se simula o procesa previamente desde Stage 1.
   ========================================================= */
export function renderBattleResultFromBattle(battle) {
  const battleResult = document.getElementById("battle-result");

  let title = "Battle in progress";

  if (battle.finished) {
    title =
      battle.winner === "player"
        ? "Winner: Your Pokémon"
        : battle.winner === "opponent"
        ? "Winner: Opponent"
        : "Result: Draw";
  }

  const currentTurn = battle.finished ? battle.turn - 1 : battle.turn;

  battleResult.innerHTML = `
    <div class="battle-result-content">
      <h3>${title}</h3>
      <p class="battle-turn">Turn ${currentTurn}</p>
      <div class="battle-score">
        <div class="battle-score-row">
          <span>${battle.player.name.toUpperCase()}</span>
          <strong>${battle.player.currentHp} HP</strong>
        </div>
        <div class="battle-score-row">
          <span>${battle.opponent.name.toUpperCase()}</span>
          <strong>${battle.opponent.currentHp} HP</strong>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   10) LOG DE BATALLA
   ---------------------------------------------------------
   Dibuja la lista de eventos o mensajes de batalla
   en formato visual.
   ========================================================= */
export function renderBattleLog(logEntries) {
  const battleLog = document.getElementById("battle-log");

  battleLog.innerHTML = `
    <div class="battle-log-content">
      <h3>Battle Log</h3>
      <div class="battle-log-list">
        ${logEntries.map((entry) => `<p>${entry}</p>`).join("")}
      </div>
    </div>
  `;
}