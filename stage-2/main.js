/* =========================================================
   STAGE 2 - MAIN.JS
   ---------------------------------------------------------
   Archivo principal del Stage 2.

   Responsabilidad de este archivo:
   - definir el estado global
   - definir constantes
   - dejar helpers generales
   - cargar datos iniciales
   - inicializar el juego

   Importante:
   - render.js dibuja la interfaz
   - battle.js maneja la lógica del combate
   - main.js arranca el sistema
   ========================================================= */

/* =========================================================
   1) ESTADO GLOBAL DE LA BATALLA
   ---------------------------------------------------------
   Todo lo importante vive aquí.
   La UI se dibuja a partir de este estado.
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
   ========================================================= */
const ENEMY_ATTACK_MIN = 3000;
const ENEMY_ATTACK_MAX = 10000;
const ENEMY_WARNING_TIME = 600;
const ENEMY_LOCK_TIME = 180;
const STRIKE_FLASH_TIME = 250;
const PLAYER_COOLDOWN_MIN = 2000;
const PLAYER_COOLDOWN_MAX = 4000;
const DEFAULT_MOVE_POWER = 60;

/* =========================================================
   3) HELPERS GENERALES
   ---------------------------------------------------------
   Utilidades base compartidas por render.js y battle.js
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
   4) INICIALIZACIÓN DEL ESTADO
   ---------------------------------------------------------
   Se resetea todo para arrancar o reiniciar.
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
  state.opponentPosition = 2;
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
   5) INIT GENERAL
   ---------------------------------------------------------
   Arranca el Stage 2.
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