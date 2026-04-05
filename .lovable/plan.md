
## Shift-Based Quest System — Architecture

### Core Concept
Department field on `profiles` ("6AM", "2PM", "10PM") = shift identity. No new team/shift tables needed.

### Database Changes

**1. New table: `gamification_shift_quest_assignments`**
- `id`, `quest_id` (FK → gamification_quests), `shift` (text: '6AM'/'2PM'/'10PM'), `date` (the day this applies), `created_by`, `created_at`
- One row per quest × shift × date
- Admin creates a quest → system inserts 3 rows (one per shift) for that date

**2. New table: `gamification_shift_quest_completions`**
- `id`, `shift_assignment_id` (FK → above), `chatter_id`, `status` ('pending'/'verified'/'rejected'), `attachments`, `submitted_at`, `verified_by`, `verified_at`
- Unique constraint on `(shift_assignment_id, chatter_id)` — one submission per user per shift task

### Quest Creation Flow (Admin)
1. Admin creates a quest with `quest_type = 'shift'` in existing quest creation UI
2. On assignment, system auto-creates 3 `shift_quest_assignments` rows (6AM, 2PM, 10PM) for the target date
3. No team picker needed — all 3 shifts get the same task

### Player View
1. Player opens Quests page → system reads their `profiles.department`
2. If department ∈ {6AM, 2PM, 10PM}: fetch shift assignments matching their department + today's date
3. Players in other departments (SocMed, etc.) simply don't see shift quests
4. Submission creates a row in `shift_quest_completions` linked to the correct shift assignment

### Admin Notifications
- On submission insert, reuse existing `notifications` table to alert admins
- Message: "[Player Name] submitted shift quest [Quest Title] for [6AM/2PM/10PM] shift"

### Duplicate Prevention
- DB unique constraint `(shift_assignment_id, chatter_id)` prevents double submissions
- DB unique constraint `(quest_id, shift, date)` prevents duplicate assignments

### Timezone Handling
- Shifts use calendar date strings (YYYY-MM-DD), same pattern as daily quests
- The 10PM reset logic from `getEffectiveGameDate()` applies — after 10PM, tasks belong to next day

### No Changes To
- Existing daily/weekly/monthly quest system (untouched)
- Existing gamification_quest_assignments table
- Team assignments or creator tables

### Implementation Steps
1. Create migration (2 new tables + RLS)
2. Add `'shift'` as a quest_type option in quest creation UI
3. Build admin shift quest assignment logic (auto-create 3 rows)
4. Build player-side shift quest display component
5. Build submission flow with notification trigger
6. Add shift quests section to Control Panel for admin review
