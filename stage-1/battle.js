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

function getBattleMoves(pokemon) {
  return pokemon.moves.slice(0, 4).map((moveObj) => moveObj.move.name);
}

function getRandomMove(moves) {
  if (!moves || moves.length === 0) return "basic attack";
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}

function calculateDamage(attackerStats, defenderStats) {
  const baseDamage =
    attackerStats.attack * 0.22 -
    defenderStats.defense * 0.10;

  const randomBonus = Math.floor(Math.random() * 6); // 0 a 5
  const finalDamage = Math.floor(baseDamage + randomBonus);

  return Math.max(5, finalDamage);
}

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

  if (battle.player.currentHp === 0 && battle.opponent.currentHp === 0) {
    battle.finished = true;
    battle.winner = "draw";
    log.push(`Both Pokémon fainted!`);
  }

  if (battle.finished) {
    if (battle.winner === "player") {
      log.push(`${battle.player.name.toUpperCase()} wins the battle!`);
    } else if (battle.winner === "opponent") {
      log.push(`${battle.opponent.name.toUpperCase()} wins the battle!`);
    } else {
      log.push(`The battle ends in a draw!`);
    }
  }

  battle.log.push(...log);
  battle.turn++;

  return battle;
}