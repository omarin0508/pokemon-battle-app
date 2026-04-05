# Pokémon Battle Project Checklist

## Stage 1 — Trainer Card
- [x] Load favorite Pokémon from trainer.config.js
- [x] Render trainer card
- [x] Search opponent by name
- [x] Render opponent card
- [x] Show stats, types, first 4 moves
- [x] Save last opponent in localStorage
- [x] Show inline error on invalid Pokémon
- [x ] Live search with debounce
- [x] AbortController for canceling previous search
- [x] Fetch move details in parallel with Promise.all / Promise.allSettled
- [x] Type-based color theme
- [x] Better loading skeletons
- [x] “Go to Battle” button writes battle data to localStorage
- [x] Navigate to stage-2/index.html

## Stage 2 — Real-Time Battle
- [x] Read battle data from localStorage
- [x] Render 3-cell arena
- [x] Player moves with arrow keys
- [x] Enemy attack loop with random timer
- [x] Warning cell before attack resolves
- [x] Lock movement during resolve
- [x] Hit/miss logic
- [x] Player regular move button with cooldown
- [x] Definitive move usable once
- [x] HP updates in real time
- [x] Battle log auto-scroll
- [x] End screen with win/lose message
- [x] Clear all timers on end
- [x] Battle Again without page reload

## Docs
- [x] Update README for Stage 1
- [x] Update README for Stage 2
- [x] Add notes for type theme colors