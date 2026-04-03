const LAST_OPPONENT_KEY = "pokemon-battle-last-opponent";

export function saveLastOpponent(name) {
  if (!name) return;
  localStorage.setItem(LAST_OPPONENT_KEY, name.toLowerCase().trim());
}

export function getLastOpponent() {
  return localStorage.getItem(LAST_OPPONENT_KEY);
}

export function clearLastOpponent() {
  localStorage.removeItem(LAST_OPPONENT_KEY);
}