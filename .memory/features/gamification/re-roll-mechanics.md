# Memory: features/gamification/re-roll-mechanics
Updated: 2026-02-05

## Re-roll Isolation Architecture

The re-roll system is **fully isolated per-user**. When Player 1 re-rolls a quest, Player 2 still sees the original admin-assigned quest.

### How It Works

1. **Personal Slots Table** (`gamification_daily_quest_slots`):
   - Each player has their own rows with `chatter_id = user.id`
   - Slot numbers: 1-4 for Daily, 100 for Weekly, 200 for Monthly
   - When a player re-rolls, ONLY their row is updated (`quest_id` changes, `has_rerolled = true`)

2. **Personal Assignments** (`gamification_quest_assignments`):
   - When a player clicks "Log Activity" on a re-rolled quest that has no admin assignment
   - A personal assignment is created with `assigned_by = user.id`
   - This is used for progress tracking (`gamification_quest_progress`) and completion (`gamification_quest_completions`)
   - Other players never see this because slot population filters by `assigned_by IS NULL`

### Re-roll Constraints
- Users can re-roll once per slot per period (day/week/month)
- The `has_rerolled` flag is stored on the personal slot
- Re-roll button is disabled when: `has_rerolled`, `isPending`, or `isVerified`
- Re-roll picks from ALL active quests of that type (not just assigned ones)

### Preventing Cross-Player Contamination
- Slot population queries: `WHERE assigned_by IS NULL` (admin only)
- Completion status queries: Check admin assignment first, fallback to personal (`assigned_by = user.id`)
- Never create assignments with `assigned_by = NULL` from player actions
