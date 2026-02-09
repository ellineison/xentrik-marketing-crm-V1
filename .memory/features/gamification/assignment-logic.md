# Memory: features/gamification/assignment-logic
Updated: 2026-02-05

Quest assignments follow a two-tier architecture:

## Global (Admin) Assignments
- Stored in `gamification_quest_assignments` with `assigned_by = NULL`
- Created by admins via Control Panel
- Visible to all players
- When an admin assigns a quest, it populates personal slots for every player who loads the Quests page

## Personal Slots
- Stored in `gamification_daily_quest_slots`
- Each player has their own slots: 1-4 for Daily, 100 for Weekly, 200 for Monthly
- When a player loads the Quests page, their slots are populated from admin assignments
- Players can re-roll slots to get different quests without affecting others

## Critical Implementation Details
- **Control Panel (Admin View)**: Uses `AdminDailyQuestSlots`, `AdminWeeklyQuestSlots`, `AdminMonthlyQuestSlots` components that fetch directly from `gamification_quest_assignments WHERE assigned_by IS NULL`
- **Player View**: Uses `DailyQuestSlots`, `WeeklyQuestSlots`, `MonthlyQuestSlots` that read from `gamification_daily_quest_slots` (personal slots)
- Slot population queries MUST filter: `.is('assigned_by', null)` to only get admin assignments
- The `slot_number` constraint now allows: 1-4 (daily), 100 (weekly), 200 (monthly)
- Personal assignments (assigned_by = user.id) are only created for tracking re-rolled quest completions
