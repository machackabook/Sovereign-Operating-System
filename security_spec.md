# Firestore Security Audit & Hardening Spec

## 1. Data Invariants
- A personality profile can only be read/written by verified administrators (or as defined by the application architecture).
- User states must belong to the authenticated user's UID.

## 2. The "Dirty Dozen" Payloads (Examples)
1. Unauthorized read of `personalityProfiles`.
2. Write to `userStates` with spoofed `userId`.
3. ID injection (1.5KB string in `userId` path).
4. ... (Additional tests cover field type mismatch, immutable field modification, etc.)

## 3. Test Runner
- `firestore.rules.test.ts` (Plan to implement).
