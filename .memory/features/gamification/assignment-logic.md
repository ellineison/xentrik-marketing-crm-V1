# Memory: features/gamification/assignment-logic
Updated: 2026-04-05

Quest assignments follow a two-tier architecture:

## Global (Admin) Assignments
- Stored in `gamification_quest_assignments` with `assigned_by = NULL`
- Created by admins via Control Panel
- `department` column: NULL = visible to all, '6AM'/'2PM'/'10PM' = department-specific
- When an admin assigns a quest, they choose a department (or "All Departments")
- Players only see quests matching their `profiles.department` or quests with NULL department

## Personal Slots
- Stored in `gamification_daily_quest_slots`
- Each player has their own slots: 1-4 for Daily, 100 for Weekly, 200 for Monthly
- Slot population filters admin assignments by user's department
- Players can re-roll slots to get different quests without affecting others

## Department-Based Filtering
- Relevant departments: 6AM, 2PM, 10PM
- Other departments (SocMed, etc.) are excluded from the quest flow
- The `department` column on `gamification_quest_assignments` controls visibility
- All 3 player hooks (daily/weekly/monthly) fetch user's profile.department and filter accordingly
- Admin views show department badges on assignments

## Critical Implementation Details
- **Control Panel (Admin View)**: Uses `AdminDailyQuestSlots`, `AdminWeeklyQuestSlots`, `AdminMonthlyQuestSlots` components that fetch directly from `gamification_quest_assignments WHERE assigned_by IS NULL`
- **Player View**: Uses `DailyQuestSlots`, `WeeklyQuestSlots`, `MonthlyQuestSlots` that read from `gamification_daily_quest_slots` (personal slots)
- Slot population queries MUST filter: `.is('assigned_by', null)` to only get admin assignments
- The `slot_number` constraint now allows: 1-4 (daily), 100 (weekly), 200 (monthly)
- Personal assignments (assigned_by = user.id) are only created for tracking re-rolled quest completions
