/* =========================================================
   TRAINER.CONFIG.JS
   ---------------------------------------------------------
   Este archivo define la configuración base del entrenador
   que se usará en Stage 1 y Stage 2.

   Aquí se guarda:
   - nombre del trainer
   - ciudad de origen
   - frase característica
   - movimiento definitivo
   - Pokémon favorito
   - mensajes de victoria y derrota

   Idea clave:
   Stage 1 carga este archivo y luego envía estos datos
   a Stage 2 mediante localStorage.
   ========================================================= */

export default {
  /* Nombre del entrenador */
  name: "Oscar",

  /* Ciudad de origen del entrenador */
  hometown: "San José",

  /* Frase característica del entrenador */
  catchphrase: "The battle starts now!",

  /* Nombre del movimiento definitivo */
  definitiveMoveName: "Thunder Strategy",

  /* Pokémon favorito del entrenador */
  favoritePokemon: "mewtwo",

  /* Texto adicional que acompaña al movimiento definitivo */
  definitiveMoveFlavor: "A finishing move was unleashed!",

  /* Mensaje al ganar la batalla */
  winMessage: "You won the battle!",

  /* Mensaje al perder la batalla */
  loseMessage: "You lost the battle!",
};