export async function fetchPokemonByName(name) {
  const url = `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar el Pokémon: ${name}`);
  }

  return await response.json();
}