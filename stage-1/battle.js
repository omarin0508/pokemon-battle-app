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

function calculateScore(stats) {
  return stats.hp + stats.attack + stats.defense + stats.speed;
}

export function calculateBattleResult(player, opponent) {
  const playerStats = getBattleStats(player);
  const opponentStats = getBattleStats(opponent);

  const playerScore = calculateScore(playerStats);
  const opponentScore = calculateScore(opponentStats);

  let winner = "draw";
  let message = "It's a draw!";

  if (playerScore > opponentScore) {
    winner = "player";
    message = `${player.name.toUpperCase()} wins the battle!`;
  } else if (opponentScore > playerScore) {
    winner = "opponent";
    message = `${opponent.name.toUpperCase()} wins the battle!`;
  }

  return {
    winner,
    message,
    player: {
      name: player.name,
      stats: playerStats,
      score: playerScore,
    },
    opponent: {
      name: opponent.name,
      stats: opponentStats,
      score: opponentScore,
    },
  };
}