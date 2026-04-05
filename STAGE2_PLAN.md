# Stage 2 Plan — Real-Time Battle

## Core state
- player
- opponent
- playerHp
- opponentHp
- playerPosition (1, 2, 3)
- targetedCell
- isLocked
- battleStarted
- battleEnded
- playerCooldown
- definitiveMoveUsed
- attackTimeoutId
- warningTimeoutId
- cooldownAnimationId

## Battle flow
1. Read both Pokémon from localStorage
2. Render arena and HP bars
3. Start enemy recursive setTimeout
4. Enemy chooses random target cell
5. Show warning cell
6. After warning window, resolve hit or miss
7. Update HP and log
8. Restart enemy timer
9. Player can attack independently on cooldown
10. Definitive move sets opponent HP to 0
11. End battle if any HP reaches 0
12. Clear all timers and listeners
13. Show Battle Again button

## Controls
- ArrowLeft: move player left if not locked
- ArrowRight: move player right if not locked
- Attack button: regular move
- Definitive move button: once per battle
- Battle Again: reset state