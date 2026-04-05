# Pokémon Battle Project Checklist

## Stage 1 — Trainer Card
- [x] Load favorite Pokémon from trainer.config.js
- [x] Render trainer card
- [x] Search opponent by name
- [x] Render opponent card
- [x] Show stats, types, first 4 moves
- [x] Save last opponent in localStorage
- [x] Show inline error on invalid Pokémon
- [ ] Live search with debounce
- [ ] AbortController for canceling previous search
- [ ] Fetch move details in parallel with Promise.all / Promise.allSettled
- [ ] Type-based color theme
- [ ] Better loading skeletons
- [ ] “Go to Battle” button writes battle data to localStorage
- [ ] Navigate to stage-2/index.html

## Stage 2 — Real-Time Battle
- [ ] Read battle data from localStorage
- [ ] Render 3-cell arena
- [ ] Player moves with arrow keys
- [ ] Enemy attack loop with random timer
- [ ] Warning cell before attack resolves
- [ ] Lock movement during resolve
- [ ] Hit/miss logic
- [ ] Player regular move button with cooldown
- [ ] Definitive move usable once
- [ ] HP updates in real time
- [ ] Battle log auto-scroll
- [ ] End screen with win/lose message
- [ ] Clear all timers on end
- [ ] Battle Again without page reload

## Docs
- [ ] Update README for Stage 1
- [ ] Update README for Stage 2
- [ ] Add notes for type theme colors