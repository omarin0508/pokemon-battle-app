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

export function createBattle(player, opponent) {
  const playerStats = getBattleStats(player);
  const opponentStats = getBattleStats(opponent);

  const battle = {
    player: {
      name: player.name,
      stats: playerStats,
      currentHp: playerStats.hp,
    },
    opponent: {
      name: opponent.name,
      stats: opponentStats,
      currentHp: opponentStats.hp,
    },
    turn: 1,
    log: [],
    finished: false,
    winner: null,
  };

  battle.first =
    opponentStats.speed > playerStats.speed ? "opponent" : "player";

  battle.log.push(
    battle.first === "player"
      ? `${battle.player.name.toUpperCase()} attacks first because it is faster.`
      : `${battle.opponent.name.toUpperCase()} attacks first because it is faster.`
  );

  return battle;
}

export function nextTurn(battle) {
  if (!battle || battle.finished) return battle;

  const log = [];

  function attack(attacker, defender) {
    const damage = calculateDamage(attacker.stats, defender.stats);
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    log.push(
      `${attacker.name.toUpperCase()} attacks and deals ${damage} damage. ${defender.name.toUpperCase()} has ${defender.currentHp} HP left.`
    );
  }

  log.push(`Turn ${battle.turn}`);

  const playerGoesFirst = battle.first === "player";

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

  if (
    battle.player.currentHp === 0 &&
    battle.opponent.currentHp === 0
  ) {
    battle.finished = true;
    battle.winner = "draw";
  }

  battle.log.push(...log);
  battle.turn++;

  return battle;
}