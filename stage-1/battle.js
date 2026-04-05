/* =========================================================
   STAGE 1 - BATTLE.JS
   ---------------------------------------------------------
   Este archivo concentra la lógica básica de batalla para
   la aplicación Pokémon Battle.

   Responsabilidades principales:
   - Leer stats importantes de cada Pokémon
   - Preparar un objeto de batalla inicial
   - Determinar quién ataca primero
   - Ejecutar cada turno
   - Calcular daño
   - Registrar eventos en un log
   - Definir ganador, empate o fin de batalla

   Nota:
   Este archivo NO se encarga del render visual.
   Su trabajo es solamente manejar la lógica del combate.
========================================================= */


/* =========================================================
   FUNCIÓN: getStatValue
   ---------------------------------------------------------
   Recibe:
   - pokemon: objeto completo del Pokémon
   - statName: nombre del stat que queremos buscar
     por ejemplo: "hp", "attack", "defense", "speed"

   Qué hace:
   - Busca dentro del arreglo pokemon.stats el stat
     cuyo nombre coincida con statName
   - Si lo encuentra, devuelve su base_stat
   - Si no lo encuentra, devuelve 0

   Esto ayuda a reutilizar una sola función para leer
   diferentes estadísticas del Pokémon.
========================================================= */
function getStatValue(pokemon, statName) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat ?? 0;
}


/* =========================================================
   FUNCIÓN: getBattleStats
   ---------------------------------------------------------
   Recibe:
   - pokemon: objeto completo del Pokémon

   Qué hace:
   - Construye un objeto simplificado con solo los stats
     que esta batalla necesita:
       * hp
       * attack
       * defense
       * speed

   Esto es útil porque evita estar leyendo una y otra vez
   el arreglo original de stats del Pokémon.
========================================================= */
function getBattleStats(pokemon) {
  return {
    hp: getStatValue(pokemon, "hp"),
    attack: getStatValue(pokemon, "attack"),
    defense: getStatValue(pokemon, "defense"),
    speed: getStatValue(pokemon, "speed"),
  };
}


/* =========================================================
   FUNCIÓN: getBattleMoves
   ---------------------------------------------------------
   Recibe:
   - pokemon: objeto completo del Pokémon

   Qué hace:
   - Toma los primeros 4 movimientos del arreglo pokemon.moves
   - Convierte cada objeto de movimiento en solo su nombre

   Resultado:
   - Devuelve un arreglo de strings con nombres de movimientos

   Ejemplo:
   ["tackle", "growl", "vine-whip", "razor-leaf"]

   Nota:
   Aquí se está simplificando la lógica de combate para usar
   solo los primeros 4 movimientos disponibles.
========================================================= */
function getBattleMoves(pokemon) {
  return pokemon.moves.slice(0, 4).map((moveObj) => moveObj.move.name);
}


/* =========================================================
   FUNCIÓN: getRandomMove
   ---------------------------------------------------------
   Recibe:
   - moves: arreglo de movimientos disponibles

   Qué hace:
   - Si no hay movimientos, devuelve un texto por defecto
     llamado "basic attack"
   - Si sí hay movimientos, elige uno al azar

   Esto aporta variedad al log de la batalla, haciendo que
   no siempre se repita el mismo movimiento en cada ataque.
========================================================= */
function getRandomMove(moves) {
  if (!moves || moves.length === 0) return "basic attack";
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}


/* =========================================================
   FUNCIÓN: calculateDamage
   ---------------------------------------------------------
   Recibe:
   - attackerStats: stats del atacante
   - defenderStats: stats del defensor

   Qué hace:
   - Calcula un daño base usando:
       ataque del atacante
       menos una reducción basada en defensa del defensor
   - Agrega un bono aleatorio entre 0 y 5
   - Redondea hacia abajo el resultado final
   - Garantiza que el daño mínimo sea 5

   Fórmula actual:
   baseDamage = (attack * 0.22) - (defense * 0.10)

   Importante:
   Esta es una fórmula simplificada y didáctica.
   No replica exactamente las reglas oficiales de Pokémon,
   pero sirve muy bien para una simulación académica.
========================================================= */
function calculateDamage(attackerStats, defenderStats) {
  const baseDamage =
    attackerStats.attack * 0.22 -
    defenderStats.defense * 0.10;

  const randomBonus = Math.floor(Math.random() * 6); // 0 a 5
  const finalDamage = Math.floor(baseDamage + randomBonus);

  return Math.max(5, finalDamage);
}


/* =========================================================
   FUNCIÓN EXPORTADA: createBattle
   ---------------------------------------------------------
   Recibe:
   - player: Pokémon del jugador
   - opponent: Pokémon oponente

   Qué hace:
   - Extrae los stats de ambos Pokémon
   - Construye el objeto principal de batalla
   - Inicializa HP actual usando el HP base
   - Guarda hasta 4 movimientos por cada Pokémon
   - Inicia turno, log, estado de finalización y ganador
   - Determina quién ataca primero según speed
   - Agrega al log el mensaje inicial

   Estructura general del objeto battle:
   {
     player: {...},
     opponent: {...},
     turn: 1,
     log: [],
     finished: false,
     winner: null,
     first: "player" | "opponent"
   }

   Esta función es la base para comenzar el combate.
========================================================= */
export function createBattle(player, opponent) {
  const playerStats = getBattleStats(player);
  const opponentStats = getBattleStats(opponent);

  const battle = {
    player: {
      name: player.name,
      stats: playerStats,
      currentHp: playerStats.hp,
      moves: getBattleMoves(player),
    },
    opponent: {
      name: opponent.name,
      stats: opponentStats,
      currentHp: opponentStats.hp,
      moves: getBattleMoves(opponent),
    },
    turn: 1,
    log: [],
    finished: false,
    winner: null,
  };

  /* =========================================================
     Quién va primero:
     ---------------------------------------------------------
     Si el oponente tiene más speed que el jugador,
     ataca primero el oponente.
     En cualquier otro caso, comienza el jugador.

     Nota:
     En caso de empate en velocidad, aquí gana el jugador
     porque el operador usa ">" y no ">=".
  ========================================================= */
  battle.first =
    opponentStats.speed > playerStats.speed ? "opponent" : "player";

  /* =========================================================
     Se registra en el log quién inicia la batalla.
     Se usa toUpperCase() para dar más fuerza visual al nombre
     dentro del mensaje.
  ========================================================= */
  battle.log.push(
    battle.first === "player"
      ? `${battle.player.name.toUpperCase()} attacks first because it is faster.`
      : `${battle.opponent.name.toUpperCase()} attacks first because it is faster.`
  );

  return battle;
}


/* =========================================================
   FUNCIÓN EXPORTADA: nextTurn
   ---------------------------------------------------------
   Recibe:
   - battle: objeto actual de batalla

   Qué hace:
   - Si la batalla ya terminó, no hace nada y devuelve battle
   - Crea un log temporal del turno actual
   - Ejecuta ataques según el orden definido
   - Verifica si alguien quedó en 0 HP
   - Define ganador o empate
   - Agrega los mensajes al log general
   - Incrementa el contador de turnos

   Esta función representa el avance de UN turno completo.
========================================================= */
export function nextTurn(battle) {
  /* =========================================================
     Protección inicial:
     - Si no existe battle
     - O si ya terminó la batalla
     entonces simplemente se devuelve tal cual.
  ========================================================= */
  if (!battle || battle.finished) return battle;

  /* =========================================================
     Log temporal del turno actual.
     Luego al final se agrega al log global de la batalla.
  ========================================================= */
  const log = [];

  /* =========================================================
     FUNCIÓN INTERNA: attack
     ---------------------------------------------------------
     Recibe:
     - attacker: objeto del Pokémon atacante
     - defender: objeto del Pokémon defensor

     Qué hace:
     - Escoge un movimiento aleatorio
     - Calcula el daño
     - Resta ese daño al HP del defensor
     - Evita que el HP baje de 0
     - Registra en el log lo sucedido
     - Si el defensor llega a 0, registra que se debilitó

     Nota:
     Esta función existe dentro de nextTurn porque solo se
     utiliza durante la ejecución de un turno.
  ========================================================= */
  function attack(attacker, defender) {
    const selectedMove = getRandomMove(attacker.moves);
    const damage = calculateDamage(attacker.stats, defender.stats);

    defender.currentHp = Math.max(0, defender.currentHp - damage);

    log.push(`${attacker.name.toUpperCase()} used ${selectedMove}!`);
    log.push(
      `${defender.name.toUpperCase()} took ${damage} damage and has ${defender.currentHp} HP left.`
    );

    if (defender.currentHp <= 0) {
      log.push(`${defender.name.toUpperCase()} fainted!`);
    }
  }

  /* =========================================================
     Se registra el número del turno actual.
  ========================================================= */
  log.push(`Turn ${battle.turn}`);

  /* =========================================================
     Determina si el jugador es quien debe atacar primero
     en esta batalla.
  ========================================================= */
  const playerGoesFirst = battle.first === "player";

  /* =========================================================
     BLOQUE 1: Si el jugador va primero
     ---------------------------------------------------------
     Flujo:
     1. Ataca el jugador
     2. Si el oponente cae, termina la batalla
     3. Si no cae, contraataca el oponente
     4. Si el jugador cae, gana el oponente
  ========================================================= */
  if (playerGoesFirst) {
    attack(battle.player, battle.opponent);

    if (battle.opponent.currentHp <= 0) {
      battle.finished = true;
      battle.winner = "player";
    } else {
      attack(battle.opponent, battle.player);

      if (battle.player.currentHp <= 0) {
        battle.finished = true;
        battle.winner = "opponent";
      }
    }
  } else {
    /* =======================================================
       BLOQUE 2: Si el oponente va primero
       -------------------------------------------------------
       Flujo:
       1. Ataca el oponente
       2. Si el jugador cae, termina la batalla
       3. Si no cae, responde el jugador
       4. Si el oponente cae, gana el jugador
    ======================================================= */
    attack(battle.opponent, battle.player);

    if (battle.player.currentHp <= 0) {
      battle.finished = true;
      battle.winner = "opponent";
    } else {
      attack(battle.player, battle.opponent);

      if (battle.opponent.currentHp <= 0) {
        battle.finished = true;
        battle.winner = "player";
      }
    }
  }

  /* =========================================================
     Caso especial: empate
     ---------------------------------------------------------
     Si ambos Pokémon quedan exactamente en 0 HP al final,
     la batalla termina en empate.
  ========================================================= */
  if (battle.player.currentHp === 0 && battle.opponent.currentHp === 0) {
    battle.finished = true;
    battle.winner = "draw";
    log.push(`Both Pokémon fainted!`);
  }

  /* =========================================================
     Si la batalla terminó, agregamos el mensaje final según
     el resultado.
  ========================================================= */
  if (battle.finished) {
    if (battle.winner === "player") {
      log.push(`${battle.player.name.toUpperCase()} wins the battle!`);
    } else if (battle.winner === "opponent") {
      log.push(`${battle.opponent.name.toUpperCase()} wins the battle!`);
    } else {
      log.push(`The battle ends in a draw!`);
    }
  }

  /* =========================================================
     Se agregan todos los mensajes del turno al log general
     de la batalla.
  ========================================================= */
  battle.log.push(...log);

  /* =========================================================
     Se incrementa el número de turno para la próxima llamada
     a nextTurn().
  ========================================================= */
  battle.turn++;

  return battle;
}