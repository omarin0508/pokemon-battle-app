function getStatValue(pokemon, statName) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat ?? 0;
}

function getBattleStats(pokemon) {
  return {
    hp: getStatValue(pokemon, "hp"),
    attack: getStatValue(pokemon, "attack"),
    defense: getStatValue(pokemon, "defense"),
    speed: getStatValue(pokemon, "speed"),
  };
}

function calculateDamage(attackerStats, defenderStats) {
  const rawDamage = attackerStats.attack - Math.floor(defenderStats.defense * 0.35);
  return Math.max(8, rawDamage);
}

export function simulateBattle(player, opponent) {
  const playerStats = getBattleStats(player);
  const opponentStats = getBattleStats(opponent);

  let playerCurrentHp = playerStats.hp;
  let opponentCurrentHp = opponentStats.hp;

  const log = [];

  const playerName = player.name.toUpperCase();
  const opponentName = opponent.name.toUpperCase();

  let firstAttacker = "player";
  if (opponentStats.speed > playerStats.speed) {
    firstAttacker = "opponent";
  }

  log.push(
    firstAttacker === "player"
      ? `${playerName} attacks first because it is faster.`
      : `${opponentName} attacks first because it is faster.`
  );

  let turn = 1;

  while (playerCurrentHp > 0 && opponentCurrentHp > 0 && turn <= 20) {
    log.push(`Turn ${turn}`);

    if (firstAttacker === "player") {
      const damageToOpponent = calculateDamage(playerStats, opponentStats);
      opponentCurrentHp = Math.max(0, opponentCurrentHp - damageToOpponent);
      log.push(`${playerName} attacks and deals ${damageToOpponent} damage.`);
      log.push(`${opponentName} has ${opponentCurrentHp} HP left.`);

      if (opponentCurrentHp <= 0) break;

      const damageToPlayer = calculateDamage(opponentStats, playerStats);
      playerCurrentHp = Math.max(0, playerCurrentHp - damageToPlayer);
      log.push(`${opponentName} attacks and deals ${damageToPlayer} damage.`);
      log.push(`${playerName} has ${playerCurrentHp} HP left.`);
    } else {
      const damageToPlayer = calculateDamage(opponentStats, playerStats);
      playerCurrentHp = Math.max(0, playerCurrentHp - damageToPlayer);
      log.push(`${opponentName} attacks and deals ${damageToPlayer} damage.`);
      log.push(`${playerName} has ${playerCurrentHp} HP left.`);

      if (playerCurrentHp <= 0) break;

      const damageToOpponent = calculateDamage(playerStats, opponentStats);
      opponentCurrentHp = Math.max(0, opponentCurrentHp - damageToOpponent);
      log.push(`${playerName} attacks and deals ${damageToOpponent} damage.`);
      log.push(`${opponentName} has ${opponentCurrentHp} HP left.`);
    }

    turn++;
  }

  let winner = "draw";
  let message = "The battle ends in a draw.";

  if (playerCurrentHp > opponentCurrentHp) {
    winner = "player";
    message = `${playerName} wins the battle!`;
  } else if (opponentCurrentHp > playerCurrentHp) {
    winner = "opponent";
    message = `${opponentName} wins the battle!`;
  }

  return {
    winner,
    message,
    log,
    player: {
      name: player.name,
      stats: playerStats,
      remainingHp: playerCurrentHp,
    },
    opponent: {
      name: opponent.name,
      stats: opponentStats,
      remainingHp: opponentCurrentHp,
    },
  };
}