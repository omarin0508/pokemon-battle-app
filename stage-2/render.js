/* =========================================================
   STAGE 2 - RENDER.JS
   ---------------------------------------------------------
   Este archivo se encarga únicamente de la parte visual.

   Aquí viven las funciones que:
   - leen el state
   - construyen HTML
   - actualizan la interfaz
   - muestran paneles, arena, info, log y botones

   Idea clave:
   render.js NO toma decisiones de batalla.
   Solo refleja en pantalla lo que diga el state.
   ========================================================= */

/* =========================================================
   1) HELPERS VISUALES
   ---------------------------------------------------------
   Estas funciones ayudan a calcular cómo se debe ver
   la barra de vida en pantalla.
   ========================================================= */

/* Devuelve el porcentaje actual de HP entre 0 y 100 */
function getHpPercent(currentHp, maxHp) {
  if (!maxHp || maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
}

/* Devuelve la clase CSS según el nivel de vida */
function getHpClass(currentHp, maxHp) {
  const percent = getHpPercent(currentHp, maxHp);

  if (percent > 50) return "hp-high";
  if (percent > 20) return "hp-mid";
  return "hp-low";
}

/* Cambia el texto principal de estado de batalla */
function renderStatus(message) {
  const status = document.getElementById("battle-status");
  if (!status) return;
  status.textContent = message;
}

/* =========================================================
   2) RENDER DEL RESUMEN DEL TRAINER
   ---------------------------------------------------------
   Muestra la información del entrenador y el contexto
   general de la pelea.
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

/* =========================================================
   3) PANEL DE POKÉMON
   ---------------------------------------------------------
   Dibuja la tarjeta del jugador o del oponente:
   - nombre
   - tipos
   - HP
   - imagen
   - moves
   ========================================================= */
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

/* =========================================================
   4) RENDER DE LA ARENA
   ---------------------------------------------------------
   Pinta las tres posiciones de una fila.

   En la fila del jugador se reflejan también:
   - celda activa del jugador
   - warning del enemigo
   - strike real
   - caso especial: player parado donde viene el golpe
   ========================================================= */
function renderArenaRow(containerId, activePosition, isPlayer = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = [1, 2, 3]
    .map((position) => {
      const isActive = position === activePosition;
      const isWarning = isPlayer && state.warningCell === position;
      const isStrike = isPlayer && state.strikeCell === position;
      const isIncomingOnPlayer = isPlayer && isActive && (isWarning || isStrike);

      return `
        <div class="
          arena-cell
          ${isActive ? "active" : ""}
          ${isWarning ? "warning-cell" : ""}
          ${isStrike ? "strike-cell" : ""}
          ${isIncomingOnPlayer ? "incoming-on-player" : ""}
        ">
          ${
            isPlayer && isActive
              ? `<span class="cell-badge you-badge">YOU</span>`
              : ""
          }

          ${
            isIncomingOnPlayer
              ? `<span class="cell-badge incoming-badge">INCOMING</span>`
              : ""
          }

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

/* =========================================================
   5) PANEL DE INFORMACIÓN DE BATALLA
   ---------------------------------------------------------
   Muestra datos de depuración / seguimiento del combate.
   ========================================================= */
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

/* =========================================================
   6) LOG DE BATALLA
   ---------------------------------------------------------
   Muestra el historial de eventos y hace scroll automático
   hacia el final.
   ========================================================= */
function renderBattleLog() {
  const battleLog = document.getElementById("battle-log");
  if (!battleLog) return;

  battleLog.innerHTML = state.log.map((entry) => `<p>${entry}</p>`).join("");
  battleLog.scrollTop = battleLog.scrollHeight;
}

/* =========================================================
   7) VISUAL DEL COOLDOWN Y BOTONES
   ---------------------------------------------------------
   Estas funciones solo actualizan la parte visual del
   cooldown y habilitan / deshabilitan botones.
   ========================================================= */
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

/* =========================================================
   8) PANTALLA FINAL
   ---------------------------------------------------------
   Muestra una tarjeta final cuando la batalla termina.
   ========================================================= */
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

/* =========================================================
   9) ESTADO DE ERROR
   ---------------------------------------------------------
   Se usa cuando falta la información en localStorage.
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
   10) RENDER GLOBAL
   ---------------------------------------------------------
   Esta es la función central de pintado.
   Re-renderiza toda la pantalla a partir del state.
   ========================================================= */
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