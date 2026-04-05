# 🧠 Pokémon Battle App — Stage 1 & Stage 2

Aplicación web desarrollada como proyecto académico para simular una batalla tipo Pokémon en dos etapas:

* **Stage 1:** Selección de entrenador y oponente
* **Stage 2:** Batalla en tiempo real con lógica y render dinámico

---

# 🚀 Stage 1 — Selección de Batalla

## 🎯 Objetivo

Permitir al usuario:

* Ver su entrenador
* Buscar un Pokémon oponente
* Preparar la batalla
* Pasar al Stage 2

## 🧩 Componentes principales

* **Trainer Card**

  * Render dinámico del entrenador
* **Search Box**

  * Input + botón para buscar Pokémon
* **Battle Arena Preview**

  * Player vs Opponent (visual)
* **Battle Actions**

  * `Go to Battle` → navega a Stage 2
  * `Reset` → limpia selección
* **Battle Log**

  * Mensajes previos a la batalla

## ⚙️ Lógica

* Uso de `type="module"` en `main.js`
* Consumo de datos (API o mock)
* Manejo de estado del jugador y oponente
* Preparación de datos para Stage 2

## 🔗 Navegación a Stage 2

Se recomienda usar:

* `localStorage` o `sessionStorage`

Ejemplo:

```js
localStorage.setItem("battleData", JSON.stringify({
  player,
  opponent
}));
```

---

# ⚔️ Stage 2 — Real-Time Battle

## 🎯 Objetivo

Simular una batalla interactiva con:

* Movimiento en arena
* Ataques con cooldown
* Sistema de vida (HP)
* Log de eventos

## 🧩 Arquitectura

Separación clara por responsabilidades:

### 📁 render.js

* Renderiza toda la UI
* NO contiene lógica de batalla

Funciones típicas:

* `renderTrainer()`
* `renderPanels()`
* `renderArena()`
* `renderBattleLog()`
* `renderCooldown()`

---

### 📁 battle.js

* Lógica del juego

Incluye:

* Ataques
* Cooldowns
* Movimiento del jugador
* Movimiento automático del enemigo
* Sistema de KO

---

### 📁 main.js

* Estado global (`state`)
* Inicialización (`init()`)
* Conexión entre render y lógica

---

## 🧠 Conceptos clave

### ❤️ HP (Health Points)

* Vida del Pokémon
* Cuando llega a 0 → KO

### 💀 KO (Knock Out)

* Pokémon derrotado
* Termina la batalla

### ⏱️ Cooldown

* Tiempo de espera entre ataques

---

# 🎨 Notas de UI / Theme

## 🎯 Colores base (modo oscuro)

* Fondo principal: `#111827`
* Paneles: `#1f2937`
* Bordes: `#374151`
* Texto principal: `#f3f4f6`

## 🟢 Indicadores importantes

* HP alto → verde
* Daño → rojo
* Warning → rojo intenso / animado
* Cooldown → barra progresiva

## 💡 Recomendaciones

* Mantener contraste alto
* Usar colores consistentes para feedback
* Evitar sobrecarga visual en arena

---

# 🧱 Estructura del Proyecto

```
/stage-1
  api.js
  battle.js
  index.html
  main.js
  render.js
  storage.js
  style.css

/stage-2
  battle.js
  index.html
  main.js
  render.js
  style.css
```

---

# 🔥 Buenas prácticas aplicadas

* Separación de responsabilidades (render vs lógica)
* Estado centralizado (`state`)
* UI reactiva basada en estado
* Código comentado en español para estudio
* Estructura escalable

---

# 📌 Próximos pasos (mejoras futuras)

* Animaciones de ataque
* Sonidos
* IA más compleja para enemigo
* Responsive mejorado
* Persistencia de resultados

---

## 🆕 Ajustes finales implementados en Stage 1

* Consumo de API más robusto
* Uso de `AbortController` para cancelar requests previos
* Manejo de errores (`404`, cancelación, etc.)
* Estados de UI mejor definidos:

  * Loading
  * Error
  * Placeholder
* Carga automática del Pokémon favorito del trainer
* Búsqueda dinámica del oponente
* Guardado en `localStorage`
* Control de botones (`Go to Battle` / `Reset`)
* Separación clara entre lógica y render
* Cards más completas con:

  * Stats
  * Moves enriquecidos
  * Imagen oficial
  * HP bar funcional
* Mejoras visuales en CSS:

  * Theme por tipo (`type-fire`, etc.)
  * Skeleton loading
  * HP bar animada
  * Limpieza de estilos duplicados
  * Mejor responsive

# 👨‍💻 Autor

Oscar Marín
Proyecto académico — Desarrollo Web / JS

---
