# Security Specification: Red Blood Cell Runner Game Leaderboard

## 1. Data Invariants
- Each document in `/leaderboard/{scoreId}` represents an immutable game completion or attempt record.
- `scoreId` must be a valid alphanumeric ID string with length <= 128.
- Documents in `/leaderboard` are publicly readable so players can see the real-time ranking.
- Creation requires valid fields according to `GameScore` schema:
  - `playerName`: string (1-30 chars)
  - `score`: integer (0 - 1,000,000)
  - `timeLeft`: integer (0 - 3,600)
  - `isClear`: boolean
  - `createdAt`: string (timestamp ISO string, <= 64 chars)
  - optional statistics: `oxygenCollected`, `oxygenDelivered`, `plateletsCollected`, `wbcCollisions` (integers >= 0)
- Updates and Deletions are forbidden from client-side to prevent tampering with high scores.

## 2. The Dirty Dozen Payloads
1. **Ghost Field Injection**: Adding `{ isAdmin: true }` to score document. -> REJECTED
2. **Negative Score Injection**: `{ score: -500 }`. -> REJECTED
3. **Absurdly Large Score**: `{ score: 9999999999 }`. -> REJECTED
4. **Giant Player Name / Denial of Wallet**: 2KB string playerName. -> REJECTED
5. **Empty Player Name**: `{ playerName: "" }`. -> REJECTED
6. **Path Traversal / Malicious ID**: `scoreId = "../hack"`. -> REJECTED
7. **Score Mutation Attempt**: Trying to update existing document to increase score. -> REJECTED
8. **Document Deletion Attempt**: Trying to delete another player's high score. -> REJECTED
9. **Missing Required Fields**: Submitting without `score` or `playerName`. -> REJECTED
10. **Wrong Type for isClear**: Submitting `isClear: "yes"` instead of boolean. -> REJECTED
11. **Negative Time Left**: `{ timeLeft: -10 }`. -> REJECTED
12. **Blanket Write to Root / Arbitrary Collections**: Writing to `/_admin` or `/users`. -> REJECTED

## 3. Security Rules Matrix
| Collection | Operation | Allowed If |
|---|---|---|
| `/{document=**}` | read, write | `false` (Default Deny) |
| `/leaderboard/{scoreId}` | read, get, list | `true` (Public Leaderboard) |
| `/leaderboard/{scoreId}` | create | `isValidId(scoreId)` && `isValidGameScore(request.resource.data)` |
| `/leaderboard/{scoreId}` | update, delete | `false` (Immutable scores) |
