# S.O.S (SOVEREIGN OPERATING SYSTEMS) - Permissions & API Scope

## Copyright
© 2026 Cryptic News. All rights reserved.

## Permission Tiers
### 1. Sovereign Operator (Authenticated User)
- Full access to own user state, scores, history, and chat context.
- Persistent encrypted storage (IndexedDB).
- Personal API trigger scope.

### 2. System Administrator (Verified Admin)
- Admin privileges granted to email: `machackabook@gmail.com`.
- Access to global personality profiles and system hardening configurations.
- Administrative authority over cryptographic vault keys.

## API Trigger Scope
All endpoints are restricted to authorized sessions.

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/chat` | POST | Operator | Main AI reasoning interface. |
| `/api/navigator` | POST | Operator | VFS navigation telemetry. |
| `/api/score/update` | POST | Operator | Update user trivia score. |
| `/api/score/:userId` | GET | Operator | Retrieve user score. |
| `/api/history` | POST | Operator | Store action history. |
| `/api/history/:userId` | GET | Operator | Retrieve action history. |
| `/api/compute/mine-arx` | POST | Operator | High-performance ARX compute. |
| `/api/alphafold/query` | GET | Operator | Protein structure lookup. |
| `/api/gemini/media-trivia` | POST | Operator | Acoustic media classification. |
| `/api/tvguide/search` | GET | Operator | TV metadata lookup. |
| `/api/key-status` | GET | Admin | Pool health status. |
| `/api/runtime-status` | GET | Public | Node status info. |
