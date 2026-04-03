const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

export async function fetchPokemon(name) {
  const response = await fetch(`${BASE_URL}/${name.toLowerCase().trim()}`);

  if (!response.ok) {
    throw new Error("Pokémon not found");
  }

  return await response.json();
}