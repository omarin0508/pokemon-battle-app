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

/* Devuelve el tipo principal para aplicar una clase visual */
function getPrimaryType(pokemon) {
  return pokemon?.types?.[0]?.type?.name ?? "normal";
}

/* Convierte el tipo en una clase CSS reutilizable */
function getPokemonTypeClass(pokemon) {
  return `type-${getPrimaryType(pokemon)}`;
}

/* =========================================================
   2) CREACIÓN DE TARJETA DE POKÉMON
   ---------------------------------------------------------
   Construye el HTML de una tarjeta visual de Pokémon
   con nombre, tipos, HP, imagen, movimientos y stats.

   Si api.js ya enriqueció los movimientos, usamos
   pokemon.moveDetails. Si no, usamos los nombres básicos.
   ========================================================= */
function createPokemonCard(pokemon, label = "Pokémon", currentHp = null) {
  const types = pokemon.types.map((t) => t.type.name).join(", ");
  const stats = getPokemonStats(pokemon);
  const image = getPokemonImage(pokemon);
  const typeClass = getPokemonTypeClass(pokemon);

  const moves =
    pokemon.moveDetails?.length > 0
      ? pokemon.moveDetails
      : pokemon.moves.slice(0, 4).map((m) => ({
          name: m.move.name,
          power: "—",
          accuracy: "—",
          pp: "—",
          type: "unknown",
        }));

  /* Si no se pasa un HP actual, se usa el HP base */
  const displayedHp = currentHp ?? stats.hp;
  const hpPercent = getHpPercent(displayedHp, stats.hp);

  return `
    <article class="pokemon-card ${typeClass}">
      <div class="pokemon-header">
        <div>
          <div class="pokemon-label">${label}</div>
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
                <div>
                  <span>Move ${index + 1}</span>
                  <strong>${move.name}</strong>
                </div>
                <small>
                  Power: ${move.power} · Accuracy: ${move.accuracy} · PP: ${move.pp}
                </small>
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
   ========================================================= */
export function renderPlayerPokemon(pokemon, currentHp = null) {
  const container = document.getElementById("player-slot");
  if (!container || !pokemon) return;

  container.innerHTML = createPokemonCard(pokemon, "Your Pokémon", currentHp);
}

/* =========================================================
   5) RENDER DEL POKÉMON OPONENTE
   ========================================================= */
export function renderOpponentPokemon(pokemon, currentHp = null) {
  const container = document.getElementById("opponent-slot");
  if (!container || !pokemon) return;

  container.innerHTML = createPokemonCard(pokemon, "Opponent", currentHp);
}

/* =========================================================
   6) ESTADOS DE CARGA
   ---------------------------------------------------------
   Ahora usamos skeletons simples para que el loading
   se vea más pro y más claro visualmente.
   ========================================================= */
function createLoadingSkeleton(message) {
  return `
    <div class="loading-card skeleton-card">
      <div class="skeleton skeleton-text skeleton-title"></div>
      <div class="skeleton skeleton-text skeleton-subtitle"></div>
      <div class="skeleton skeleton-bar"></div>
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;
}

export function renderPlayerLoading() {
  const slot = document.getElementById("player-slot");
  if (!slot) return;

  slot.innerHTML = createLoadingSkeleton("Loading your Pokémon...");
}

export function renderOpponentLoading() {
  const slot = document.getElementById("opponent-slot");
  if (!slot) return;

  slot.innerHTML = createLoadingSkeleton("Searching opponent...");
}

/* =========================================================
   7) PLACEHOLDERS
   ========================================================= */
export function renderOpponentPlaceholder() {
  const slot = document.getElementById("opponent-slot");
  if (!slot) return;

  slot.innerHTML = `
    <div class="placeholder-card">
      <p>Search for a Pokémon to start the battle view.</p>
    </div>
  `;
}

export function renderBattlePlaceholder() {
  const battleResult = document.getElementById("battle-result");
  if (!battleResult) return;

  battleResult.innerHTML = `
    <p>Choose an opponent and press Go to Battle.</p>
  `;
}

export function renderBattleLogPlaceholder() {
  const battleLog = document.getElementById("battle-log");
  if (!battleLog) return;

  battleLog.innerHTML = `
    <div class="battle-log-content">
      <h3>Battle Log</h3>
      <div class="battle-log-list">
        <p>  This section will show the battle log in Stage 2.
             Select your opponent and proceed to battle.
        </p>
      </div>
    </div>
  `;
}

/* =========================================================
   8) ESTADOS DE ERROR
   ========================================================= */
export function renderPlayerError(message = "Could not load your Pokémon.") {
  const slot = document.getElementById("player-slot");
  if (!slot) return;

  slot.innerHTML = `
    <div class="error-card">
      <p>${message}</p>
    </div>
  `;
}

export function renderOpponentError(message = "Opponent not found.") {
  const slot = document.getElementById("opponent-slot");
  if (!slot) return;

  slot.innerHTML = `
    <div class="error-card">
      <p>${message}</p>
    </div>
  `;
}

/* =========================================================
   9) RESULTADO DE BATALLA PREVIA
   ========================================================= */
export function renderBattleResultFromBattle(battle) {
  const battleResult = document.getElementById("battle-result");
  if (!battleResult || !battle) return;

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
   ========================================================= */
export function renderBattleLog(logEntries) {
  const battleLog = document.getElementById("battle-log");
  if (!battleLog) return;

  battleLog.innerHTML = `
    <div class="battle-log-content">
      <h3>Battle Log</h3>
      <div class="battle-log-list">
        ${logEntries.map((entry) => `<p>${entry}</p>`).join("")}
      </div>
    </div>
  `;
}