/* =========================================================
   STAGE 2 - MAIN.JS
   Versión comentada en español para estudiar y mantener.
   ========================================================= */

/* =========================================================
   1) ESTADO GLOBAL DE LA BATALLA
   - Todo lo importante vive aquí.
   - La UI se renderiza a partir de este estado.
   ========================================================= */
const state = {
  trainer: null,
  player: null,
  opponent: null,

  playerHp: 0,
  opponentHp: 0,
  playerMaxHp: 0,
  opponentMaxHp: 0,

  playerPosition: 2,
  opponentPosition: 2,

  definitiveMoveUsed: false,
  battleStarted: false,
  battleEnded: false,

  /* Flag para bloquear movimiento durante la ventana de resolve */
  isLocked: false,

  /* Celda marcada en warning y celda marcada como strike */
  warningCell: null,
  strikeCell: null,

  /* Log de eventos */
  log: [],

  /* Control de cooldown del ataque del jugador */
  playerAttackCooldown: false,
  playerCooldownDuration: 0,
  playerCooldownEndsAt: 0,

  /* IDs de timers / animaciones para poder limpiarlos */
  enemyAttackTimeoutId: null,
  pendingEnemyAttackTimeoutId: null,
  strikeFlashTimeoutId: null,
  playerCooldownTimeoutId: null,
  playerCooldownAnimationFrameId: null,

  /* Para evitar registrar listeners dos veces */
  movementBound: false,
  buttonsBound: false,
};

/* =========================================================
   2) CONSTANTES DEL JUEGO
   - Ajustadas al enunciado.
   ========================================================= */
const ENEMY_ATTACK_MIN = 3000;      // 3 segundos
const ENEMY_ATTACK_MAX = 10000;     // 10 segundos
const ENEMY_WARNING_TIME = 600;     // warning ~600ms
const ENEMY_LOCK_TIME = 180;        // pequeña ventana real de lock
const STRIKE_FLASH_TIME = 250;      // flash visual breve
const PLAYER_COOLDOWN_MIN = 2000;   // 2 segundos
const PLAYER_COOLDOWN_MAX = 4000;   // 4 segundos
const DEFAULT_MOVE_POWER = 60;      // fallback pedido por el spec

/* =========================================================
   3) HELPERS GENERALES
   - Utilidades pequeñas para no repetir lógica.
   ========================================================= */
function getPokemonImage(pokemon) {
  return (
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon?.sprites?.front_default ||
    ""
  );
}

function getStatValue(pokemon, statName) {
  return pokemon?.stats?.find((stat) => stat.stat.name === statName)?.base_stat ?? 0;
}

/* HP de batalla = HP base * 2.5, redondeado hacia abajo */
function getBattleMaxHp(pokemon) {
  return Math.floor(getStatValue(pokemon, "hp") * 2.5);
}

function getPokemonStats(pokemon) {
  return {
    hp: getStatValue(pokemon, "hp"),
    attack: getStatValue(pokemon, "attack"),
    defense: getStatValue(pokemon, "defense"),
    speed: getStatValue(pokemon, "speed"),
  };
}

function getHpPercent(currentHp, maxHp) {
  if (!maxHp || maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
}

function getHpClass(currentHp, maxHp) {
  const percent = getHpPercent(currentHp, maxHp);

  if (percent > 50) return "hp-high";
  if (percent > 20) return "hp-mid";
  return "hp-low";
}

function addLog(message) {
  state.log.push(message);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEnemyAttackDelay() {
  return getRandomInt(ENEMY_ATTACK_MIN, ENEMY_ATTACK_MAX);
}

function getRandomPlayerCooldown() {
  return getRandomInt(PLAYER_COOLDOWN_MIN, PLAYER_COOLDOWN_MAX);
}

function loadBattleData() {
  const raw = localStorage.getItem("pokemonBattleData");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Invalid battle data in localStorage", error);
    return null;
  }
}

/* =========================================================
   4) HELPERS DE MOVES Y DAÑO
   - Se intenta leer power real si existe.
   - Si no existe, se usa fallback 60.
   ========================================================= */
function getMoveName(moveEntry, fallback = "Regular Move") {
  if (!moveEntry) return fallback;

  if (typeof moveEntry === "string") return moveEntry;
  if (moveEntry.name) return moveEntry.name;
  if (moveEntry.move?.name) return moveEntry.move.name;
  if (moveEntry.details?.name) return moveEntry.details.name;
  if (moveEntry.moveDetails?.name) return moveEntry.moveDetails.name;

  return fallback;
}

function getMovePower(moveEntry) {
  const possiblePower =
    moveEntry?.power ??
    moveEntry?.details?.power ??
    moveEntry?.moveDetails?.power ??
    moveEntry?.move?.power ??
    null;

  if (typeof possiblePower === "number" && possiblePower > 0) {
    return possiblePower;
  }

  return DEFAULT_MOVE_POWER;
}

function getPlayerRegularMove() {
  return state.player?.moves?.[0] ?? null;
}

/* Fórmula pedida para el jugador:
   damage = floor(movePower * 0.3) + floor(random * movePower * 0.4) */
function calculatePlayerDamage(movePower) {
  return (
    Math.floor(movePower * 0.3) +
    Math.floor(Math.random() * movePower * 0.4)
  );
}

/* Fórmula pedida para el enemigo:
   damage = floor(opponentAttackStat * 0.4) + floor(random * 20) */
function calculateEnemyDamage() {
  const opponentAttackStat = getStatValue(state.opponent, "attack");
  return Math.floor(opponentAttackStat * 0.4) + Math.floor(Math.random() * 20);
}

/* =========================================================
   5) INICIALIZACIÓN DEL ESTADO
   - Se resetea todo para arrancar o reiniciar.
   ========================================================= */
function initializeState(battleData) {
  state.trainer = battleData.trainer;
  state.player = battleData.player;
  state.opponent = battleData.opponent;

  state.playerMaxHp = getBattleMaxHp(state.player);
  state.opponentMaxHp = getBattleMaxHp(state.opponent);

  state.playerHp = state.playerMaxHp;
  state.opponentHp = state.opponentMaxHp;

  state.playerPosition = 2;
  state.opponentPosition = 2; // el enemigo queda fijo
  state.definitiveMoveUsed = false;
  state.battleStarted = true;
  state.battleEnded = false;
  state.isLocked = false;

  state.warningCell = null;
  state.strikeCell = null;

  state.playerAttackCooldown = false;
  state.playerCooldownDuration = 0;
  state.playerCooldownEndsAt = 0;

  state.enemyAttackTimeoutId = null;
  state.pendingEnemyAttackTimeoutId = null;
  state.strikeFlashTimeoutId = null;
  state.playerCooldownTimeoutId = null;
  state.playerCooldownAnimationFrameId = null;

  state.log = [
    `${state.player.name.toUpperCase()} entra a la arena.`,
    `${state.opponent.name.toUpperCase()} está listo para pelear.`,
  ];
}

/* =========================================================
   6) RENDER DE BLOQUES PRINCIPALES
   - Todo lo visual se construye a partir del state.
   ========================================================= */
function renderTrainerSummary() {
  const container = document.getElementById("trainer-summary-card");
  if (!container || !state.trainer || !state.player || !state.opponent) return;

  container.innerHTML = `
    <div class="panel-card">
      <h2>${state.trainer.name}</h2>
      <p><strong>Hometown:</strong> ${state.trainer.hometown ?? "-"}</p>
      <p><strong>Catchphrase:</strong> ${state.trainer.catchphrase ?? "-"}</p>
      <p><strong>Favorite Pokémon:</strong> ${state.player.name}</p>
      <p><strong>Opponent:</strong> ${state.opponent.name}</p>
    </div>
  `;
}

function renderPokemonPanel(containerId, pokemon, currentHp, maxHp, label) {
  const container = document.getElementById(containerId);
  if (!container || !pokemon) return;

  const image = getPokemonImage(pokemon);
  const hpPercent = getHpPercent(currentHp, maxHp);
  const hpClass = getHpClass(currentHp, maxHp);
  const types = pokemon.types?.map((t) => t.type.name).join(", ") || "unknown";
  const moves = (pokemon.moves || []).slice(0, 4);

  container.innerHTML = `
    <article class="panel-card pokemon-card">
      <div class="pokemon-card-top">
        <div>
          <p class="mini-label">${label}</p>
          <h2>${pokemon.name.toUpperCase()}</h2>
        </div>
        <p class="type-text">${types}</p>
      </div>

      <div class="hp-block">
        <div class="hp-row">
          <span>HP</span>
          <strong>${currentHp} / ${maxHp}</strong>
        </div>
        <div class="hp-bar">
          <div class="hp-fill ${hpClass}" style="width: ${hpPercent}%"></div>
        </div>
      </div>

      <div class="pokemon-image-wrap">
        ${
          image
            ? `<img src="${image}" alt="${pokemon.name}" class="pokemon-image" />`
            : `<p>No image available</p>`
        }
      </div>

      <div class="moves-box">
        <h3>Moves</h3>
        ${
          moves.length
            ? moves
                .map(
                  (move, index) => `
                    <div class="move-line">
                      <span>Move ${index + 1}</span>
                      <strong>${getMoveName(move, "Unknown Move")}</strong>
                    </div>
                  `
                )
                .join("")
            : `<p>No moves available.</p>`
        }
      </div>
    </article>
  `;
}

function renderArenaRow(containerId, activePosition, isPlayer = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = [1, 2, 3]
    .map((position) => {
      const isActive = position === activePosition;
      const isWarning = isPlayer && state.warningCell === position;
      const isStrike = isPlayer && state.strikeCell === position;

      return `
        <div class="arena-cell ${isActive ? "active" : ""} ${isWarning ? "warning-cell" : ""} ${isStrike ? "strike-cell" : ""}">
          <div class="arena-marker">
            ${
              isActive
                ? isPlayer
                  ? "🟡"
                  : "🔴"
                : "—"
            }
          </div>
          <div class="arena-pos">POS ${position}</div>
        </div>
      `;
    })
    .join("");
}

function renderBattleInfo() {
  const battleInfo = document.getElementById("battle-info");
  if (!battleInfo) return;

  const cooldownRemaining = state.playerAttackCooldown
    ? Math.max(0, Math.ceil((state.playerCooldownEndsAt - performance.now()) / 1000))
    : 0;

  battleInfo.innerHTML = `
    <p><strong>Player Position:</strong> ${state.playerPosition}</p>
    <p><strong>Opponent Position:</strong> ${state.opponentPosition}</p>
    <p><strong>Definitive Move:</strong> ${state.definitiveMoveUsed ? "Usado" : "Disponible"}</p>
    <p><strong>Attack Cooldown:</strong> ${
      state.playerAttackCooldown ? `En cooldown (${cooldownRemaining}s)` : "Listo"
    }</p>
    <p><strong>Enemy Warning:</strong> ${
      state.warningCell ? `Incoming attack at POS ${state.warningCell}` : "None"
    }</p>
    <p><strong>Lock State:</strong> ${state.isLocked ? "Locked" : "Free"}</p>
    <p><strong>Battle State:</strong> ${state.battleEnded ? "Finished" : "Active"}</p>
  `;
}

function renderBattleLog() {
  const battleLog = document.getElementById("battle-log");
  if (!battleLog) return;

  battleLog.innerHTML = state.log.map((entry) => `<p>${entry}</p>`).join("");
  battleLog.scrollTop = battleLog.scrollHeight;
}

function renderStatus(message) {
  const status = document.getElementById("battle-status");
  if (!status) return;
  status.textContent = message;
}

function renderEndScreen() {
  const existing = document.getElementById("battle-end-screen");
  if (existing) {
    existing.remove();
  }

  if (!state.battleEnded) return;

  const stage = document.querySelector(".battle-stage");
  if (!stage) return;

  const isWin = state.opponentHp <= 0;
  const title = isWin ? "Victory!" : "Defeat!";
  const trainerMessage = isWin
    ? state.trainer?.winMessage || "You won the battle!"
    : state.trainer?.loseMessage || "You lost the battle!";

  const overlay = document.createElement("section");
  overlay.id = "battle-end-screen";
  overlay.className = "panel-card";
  overlay.style.marginTop = "24px";
  overlay.innerHTML = `
    <h2>${title}</h2>
    <p>${trainerMessage}</p>
    <p>Use <strong>Restart Battle</strong> to play again without reloading the page.</p>
  `;

  stage.appendChild(overlay);
}

function updateCooldownVisual(percent = 0, remainingMs = 0) {
  const attackBtn = document.getElementById("attack-btn");
  const cooldownFill = document.getElementById("attack-cooldown-fill");
  const cooldownText = document.getElementById("attack-cooldown-text");

  if (attackBtn) {
    if (state.playerAttackCooldown) {
      attackBtn.textContent = `Attack (${Math.ceil(remainingMs / 1000)}s)`;
    } else {
      attackBtn.textContent = "Attack";
    }
  }

  if (cooldownFill) {
    cooldownFill.style.width = `${percent}%`;
  }

  if (cooldownText) {
    cooldownText.textContent = state.playerAttackCooldown
      ? `Cooldown ${Math.round(percent)}%`
      : "Ready";
  }
}

function resetCooldownVisual() {
  updateCooldownVisual(0, 0);
}

function renderButtons() {
  const attackBtn = document.getElementById("attack-btn");
  const definitiveBtn = document.getElementById("definitive-btn");
  const restartBtn = document.getElementById("restart-btn");

  if (attackBtn) {
    attackBtn.disabled = state.battleEnded || state.playerAttackCooldown;
  }

  if (definitiveBtn) {
    definitiveBtn.disabled = state.battleEnded || state.definitiveMoveUsed;
  }

  if (restartBtn) {
    restartBtn.disabled = false;
  }

  if (!state.playerAttackCooldown) {
    resetCooldownVisual();
  }
}

function renderAll() {
  renderTrainerSummary();
  renderPokemonPanel("player-panel", state.player, state.playerHp, state.playerMaxHp, "Your Pokémon");
  renderPokemonPanel("opponent-panel", state.opponent, state.opponentHp, state.opponentMaxHp, "Opponent");
  renderArenaRow("player-row", state.playerPosition, true);
  renderArenaRow("opponent-row", state.opponentPosition, false);
  renderBattleInfo();
  renderBattleLog();
  renderButtons();
  renderEndScreen();
}

/* =========================================================
   7) LIMPIEZA DE TIMERS Y ANIMACIONES
   - Esto evita timeouts huérfanos y comportamientos raros.
   ========================================================= */
function stopPlayerCooldown() {
  if (state.playerCooldownTimeoutId) {
    clearTimeout(state.playerCooldownTimeoutId);
    state.playerCooldownTimeoutId = null;
  }

  if (state.playerCooldownAnimationFrameId) {
    cancelAnimationFrame(state.playerCooldownAnimationFrameId);
    state.playerCooldownAnimationFrameId = null;
  }

  state.playerAttackCooldown = false;
  state.playerCooldownDuration = 0;
  state.playerCooldownEndsAt = 0;
  resetCooldownVisual();
}

function stopBattleSystems() {
  if (state.enemyAttackTimeoutId) {
    clearTimeout(state.enemyAttackTimeoutId);
    state.enemyAttackTimeoutId = null;
  }

  if (state.pendingEnemyAttackTimeoutId) {
    clearTimeout(state.pendingEnemyAttackTimeoutId);
    state.pendingEnemyAttackTimeoutId = null;
  }

  if (state.strikeFlashTimeoutId) {
    clearTimeout(state.strikeFlashTimeoutId);
    state.strikeFlashTimeoutId = null;
  }

  stopPlayerCooldown();

  state.warningCell = null;
  state.strikeCell = null;
  state.isLocked = false;
}

/* =========================================================
   8) CHEQUEO DE FINAL DE BATALLA
   - Se llama después de cada evento que hace daño.
   ========================================================= */
function checkWinner() {
  if (state.opponentHp <= 0) {
    state.opponentHp = 0;
    state.battleEnded = true;
    addLog(`${state.opponent.name.toUpperCase()} fainted!`);
    addLog(state.trainer?.winMessage || "You won the battle!");
    renderStatus("Battle finished — You win!");
    stopBattleSystems();
    return true;
  }

  if (state.playerHp <= 0) {
    state.playerHp = 0;
    state.battleEnded = true;
    addLog(`${state.player.name.toUpperCase()} fainted!`);
    addLog(state.trainer?.loseMessage || "You lost the battle!");
    renderStatus("Battle finished — You lose!");
    stopBattleSystems();
    return true;
  }

  return false;
}

/* =========================================================
   9) LOOP DE ATAQUE ENEMIGO
   - Se usa setTimeout recursivo con delay nuevo cada vez.
   - El enemigo está fijo y no esquiva.
   ========================================================= */
function scheduleNextEnemyAttack() {
  if (state.battleEnded) return;

  const nextDelay = getRandomEnemyAttackDelay();

  state.enemyAttackTimeoutId = setTimeout(() => {
    state.enemyAttackTimeoutId = null;
    triggerEnemyAttackWarning();
  }, nextDelay);
}

function triggerEnemyAttackWarning() {
  if (state.battleEnded) return;
  if (state.warningCell !== null) return;

  const attackCell = getRandomInt(1, 3);
  state.warningCell = attackCell;

  addLog(`⚠️ ${state.opponent.name.toUpperCase()} está apuntando a la posición ${attackCell}.`);
  renderAll();

  state.pendingEnemyAttackTimeoutId = setTimeout(() => {
    startEnemyResolve(attackCell);
  }, ENEMY_WARNING_TIME);
}

/* Ventana breve de lock antes de resolver el golpe */
function startEnemyResolve(attackCell) {
  if (state.battleEnded) return;

  state.isLocked = true;
  renderAll();

  state.pendingEnemyAttackTimeoutId = setTimeout(() => {
    resolveEnemyAttack(attackCell);
  }, ENEMY_LOCK_TIME);
}

function resolveEnemyAttack(attackCell) {
  if (state.battleEnded) return;

  state.isLocked = false;
  state.warningCell = null;
  state.pendingEnemyAttackTimeoutId = null;
  state.strikeCell = attackCell;

  if (state.playerPosition === attackCell) {
    const damage = calculateEnemyDamage();
    state.playerHp = Math.max(0, state.playerHp - damage);

    addLog(
      `💥 ${state.opponent.name.toUpperCase()} golpea a ${state.player.name.toUpperCase()} por ${damage} de daño.`
    );
  } else {
    addLog(`💨 ${state.player.name.toUpperCase()} esquivó el ataque enemigo.`);
  }

  checkWinner();
  renderAll();

  if (state.strikeFlashTimeoutId) {
    clearTimeout(state.strikeFlashTimeoutId);
  }

  state.strikeFlashTimeoutId = setTimeout(() => {
    state.strikeCell = null;
    state.strikeFlashTimeoutId = null;
    renderAll();
  }, STRIKE_FLASH_TIME);

  if (!state.battleEnded) {
    scheduleNextEnemyAttack();
  }
}

function startEnemyAttackLoop() {
  if (state.battleEnded || state.enemyAttackTimeoutId) return;
  scheduleNextEnemyAttack();
}

/* =========================================================
   10) MOVIMIENTO DEL JUGADOR
   - Solo izquierda y derecha.
   - Sin wrap.
   - Bloqueado durante lock.
   ========================================================= */
function handlePlayerMovement(event) {
  if (state.battleEnded) return;
  if (state.isLocked) return;

  if (event.key === "ArrowLeft" && state.playerPosition > 1) {
    state.playerPosition -= 1;
    addLog(`${state.player.name.toUpperCase()} se movió a la posición ${state.playerPosition}.`);
    renderAll();
  }

  if (event.key === "ArrowRight" && state.playerPosition < 3) {
    state.playerPosition += 1;
    addLog(`${state.player.name.toUpperCase()} se movió a la posición ${state.playerPosition}.`);
    renderAll();
  }
}

function setupMovement() {
  if (state.movementBound) return;

  document.addEventListener("keydown", handlePlayerMovement);
  state.movementBound = true;
}

/* =========================================================
   11) COOLDOWN DEL ATAQUE DEL JUGADOR
   - 2 a 4 segundos.
   - requestAnimationFrame para progreso visual.
   ========================================================= */
function animatePlayerCooldown() {
  if (!state.playerAttackCooldown) {
    state.playerCooldownAnimationFrameId = null;
    return;
  }

  const now = performance.now();
  const remaining = Math.max(0, state.playerCooldownEndsAt - now);
  const progress = state.playerCooldownDuration
    ? ((state.playerCooldownDuration - remaining) / state.playerCooldownDuration) * 100
    : 0;

  updateCooldownVisual(progress, remaining);
  renderBattleInfo();

  if (remaining > 0) {
    state.playerCooldownAnimationFrameId = requestAnimationFrame(animatePlayerCooldown);
  } else {
    state.playerCooldownAnimationFrameId = null;
  }
}

function startPlayerCooldown() {
  stopPlayerCooldown();

  const cooldown = getRandomPlayerCooldown();

  state.playerAttackCooldown = true;
  state.playerCooldownDuration = cooldown;
  state.playerCooldownEndsAt = performance.now() + cooldown;

  renderButtons();
  animatePlayerCooldown();

  state.playerCooldownTimeoutId = setTimeout(() => {
    state.playerAttackCooldown = false;
    state.playerCooldownDuration = 0;
    state.playerCooldownEndsAt = 0;
    state.playerCooldownTimeoutId = null;
    resetCooldownVisual();
    renderAll();
  }, cooldown);
}

/* =========================================================
   12) ATAQUE NORMAL DEL JUGADOR
   - El enemigo siempre recibe daño.
   - No depende de posición.
   ========================================================= */
function handleAttack() {
  if (state.battleEnded) return;
  if (state.playerAttackCooldown) return;

  const moveEntry = getPlayerRegularMove();
  const moveName = getMoveName(moveEntry, "Regular Move");
  const movePower = getMovePower(moveEntry);
  const damage = calculatePlayerDamage(movePower);

  state.opponentHp = Math.max(0, state.opponentHp - damage);

  addLog(
    `${state.player.name.toUpperCase()} usó ${moveName} y causó ${damage} de daño a ${state.opponent.name.toUpperCase()}.`
  );

  checkWinner();
  renderAll();

  if (!state.battleEnded) {
    startPlayerCooldown();
  }
}

/* =========================================================
   13) DEFINITIVE MOVE
   - Un solo uso.
   - KO instantáneo.
   ========================================================= */
function handleDefinitiveMove() {
  if (state.battleEnded || state.definitiveMoveUsed) return;

  state.definitiveMoveUsed = true;
  state.opponentHp = 0;

  const moveName = state.trainer?.definitiveMoveName || "Definitive Move";
  const moveFlavor =
    state.trainer?.definitiveMoveFlavor || "A finishing move was unleashed!";

  addLog(`${state.player.name.toUpperCase()} usó ${moveName}!`);
  addLog(moveFlavor);

  checkWinner();
  renderStatus("Battle finished — Definitive move used!");
  renderAll();
}

/* =========================================================
   14) RESTART Y NAVEGACIÓN
   - Reinicia sin recargar la página.
   ========================================================= */
function restartBattle() {
  const battleData = loadBattleData();

  if (!battleData?.trainer || !battleData?.player || !battleData?.opponent) {
    renderStatus("Cannot restart: missing battle data.");
    return;
  }

  stopBattleSystems();
  initializeState(battleData);
  renderStatus("Battle restarted! Move with arrows to dodge enemy attacks.");
  renderAll();
  startEnemyAttackLoop();
}

function handleBack() {
  stopBattleSystems();
  window.location.href = "../stage-1/index.html";
}

/* =========================================================
   15) BOTONES Y EVENTOS DE UI
   - Se registran una sola vez.
   ========================================================= */
function setupButtons() {
  if (state.buttonsBound) return;

  document.getElementById("attack-btn")?.addEventListener("click", handleAttack);
  document.getElementById("definitive-btn")?.addEventListener("click", handleDefinitiveMove);
  document.getElementById("back-btn")?.addEventListener("click", handleBack);

  const controls = document.querySelector(".battle-controls");

  if (controls && !document.getElementById("restart-btn")) {
    const restartBtn = document.createElement("button");
    restartBtn.id = "restart-btn";
    restartBtn.type = "button";
    restartBtn.textContent = "Restart Battle";
    restartBtn.addEventListener("click", restartBattle);
    controls.appendChild(restartBtn);
  }

  state.buttonsBound = true;
}

/* =========================================================
   16) PANTALLA DE ERROR SI FALTA localStorage
   ========================================================= */
function renderMissingBattleDataState() {
  renderStatus("No valid battle data found. Go back to Stage 1 first.");

  const trainerSummary = document.getElementById("trainer-summary-card");
  const battleInfo = document.getElementById("battle-info");
  const battleLog = document.getElementById("battle-log");

  if (trainerSummary) {
    trainerSummary.innerHTML = `
      <div class="panel-card">
        <p>Missing battle data in localStorage.</p>
      </div>
    `;
  }

  if (battleInfo) {
    battleInfo.innerHTML = `
      <p>Please return to Stage 1 and choose both Pokémon.</p>
    `;
  }

  if (battleLog) {
    battleLog.innerHTML = `
      <p>No battle log available.</p>
    `;
  }
}

/* =========================================================
   17) INIT GENERAL
   - Arranca el Stage 2.
   ========================================================= */
function init() {
  const battleData = loadBattleData();

  setupMovement();
  setupButtons();

  if (!battleData?.trainer || !battleData?.player || !battleData?.opponent) {
    renderMissingBattleDataState();
    return;
  }

  initializeState(battleData);
  renderStatus("Battle started! Use the arrows to dodge enemy attacks.");
  renderAll();
  startEnemyAttackLoop();
}

init();