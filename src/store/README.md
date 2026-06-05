# `src/store` — Global Client State

Zustand stores for ephemeral UI state that must be shared across unrelated component trees. Do **not** use these stores for server data — that belongs in `src/api` via React Query.

## Files

| File | Store | Responsibility |
|---|---|---|
| `mapStore.ts` | `useMapStore` | Map viewport (`center`, `zoom`), selected stop/route IDs, and user GPS location. |
| `routingStore.ts` | `useRoutingStore` | A→B routing state: `origin`, `destination`, `routingResults`, `selectedResultIndex`, and `mapClickMode`. |

## Key Invariants

- **`useMapStore.center`** drives the Leaflet `MapController` component — always call `setCenter` to programmatically pan, never manipulate the Leaflet map directly from a component.
- **`useRoutingStore.setRoutingResults`** auto-selects `selectedResultIndex = 0` on a fresh results array, and resets it to `null` on an empty array.
- **`clearRouting()`** is the single action to reset all routing state atomically. Never `setOrigin(null)` + `setDestination(null)` separately in a handler.
