/* =========================================================
   STAGE 2 - BATTLE.JS
   ---------------------------------------------------------
   Este archivo contiene la lógica operativa de la batalla.

   Aquí viven:
   - log
   - lectura de moves y daño
   - timers
   - cooldown
   - ataque enemigo
   - movimiento del jugador
   - ataque normal
   - ataque definitivo
   - restart
   - botones

   Idea clave:
   battle.js modifica el state y luego pide a render.js
   que actualice la pantalla con renderAll().
   ========================================================= */

/* =========================================================
   1) LOG Y HELPERS DE COMBATE
   ---------------------------------------------------------
   Utilidades relacionadas con moves, daño y registro
   de eventos del combate.
   ========================================================= */
function addLog(message) {
  state.log.push(message);
}

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
   2) LIMPIEZA DE TIMERS Y ANIMACIONES
   ---------------------------------------------------------
   Estas funciones sirven para detener sistemas activos
   cuando termina o se reinicia la batalla.
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
   3) CHEQUEO DE GANADOR
   ---------------------------------------------------------
   Se revisa después de cada evento que produzca daño.
   Si alguien llega a 0 HP, se cierra la batalla.
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
   4) LOOP DE ATAQUE ENEMIGO
   ---------------------------------------------------------
   El enemigo no se mueve.
   Solo espera un tiempo aleatorio, marca warning
   y luego resuelve el ataque.
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
   5) MOVIMIENTO DEL JUGADOR
   ---------------------------------------------------------
   El jugador solo puede moverse a izquierda o derecha.
   No hay wrap y el movimiento se bloquea durante resolve.
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
   6) COOLDOWN DEL ATAQUE DEL JUGADOR
   ---------------------------------------------------------
   Maneja el tiempo de espera entre ataques normales.
   También actualiza el progreso visual.
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
   7) ATAQUE NORMAL DEL JUGADOR
   ---------------------------------------------------------
   El enemigo siempre recibe daño.
   No depende de posición.
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
   8) DEFINITIVE MOVE
   ---------------------------------------------------------
   Se puede usar una sola vez y hace KO instantáneo.
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
   9) RESTART Y NAVEGACIÓN
   ---------------------------------------------------------
   Permite reiniciar la batalla o volver al stage 1.
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
   10) REGISTRO DE BOTONES
   ---------------------------------------------------------
   Conecta los botones del HTML con las funciones
   correspondientes de la batalla.
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