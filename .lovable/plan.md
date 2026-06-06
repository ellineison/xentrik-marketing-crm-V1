# Investigation & Plan (no code changes yet)

## 1. Team Nash payroll date assignment bug

### Where it's currently handled
- `src/utils/weekCalculations.ts` — `getWeekStart`, `getDaysOfWeek`, `getStartDayOfWeek`, `getActualDate`. `'10PM'` department is already special-cased to a Wed→Tue week (`day_of_week` start = 3).
- `src/components/payroll/PayrollTable.tsx` — renders one input column per `day_of_week` from `getDaysOfWeek(chatterDepartment)`; writes rows to `sales_tracker` keyed by `(chatter_id, model_name, day_of_week, week_start_date)`.
- `src/components/payroll/AttendanceTable.tsx` — same column model, writes to `attendance` with `day_of_week` chosen by which column the user typed in.
- `src/components/payroll/ChatterPayrollView.tsx`, `AdminPayrollView.tsx`, `WeekNavigator.tsx` — derive "current week" via `getWeekStart(new Date(), department, ...)`.
- `src/components/payroll/hooks/useExpectedSalary.ts` — sums `sales_tracker.earnings` and unique `attendance.day_of_week` for the week.
- DB columns involved: `sales_tracker.week_start_date`, `sales_tracker.day_of_week`, `attendance.week_start_date`, `attendance.day_of_week`. No DB-side date logic.

### Likely root cause
The week boundary is correct for `'10PM'`, but **the "current day" inside that week is computed from raw calendar midnight, not from the 10 PM PHT shift start**. Two concrete failure modes:

1. **Shift-day rollover after midnight.** A Team Nash chatter working the Wed 10 PM → Thu 6 AM shift sees the "today" column as Thursday once the clock passes midnight. Sales typed at 1–6 AM land in `day_of_week = 4` (Thu) instead of `3` (Wed-night shift). Across a week this scatters earnings across the wrong columns and can spill the Tuesday-night shift (Tue 10 PM → Wed 6 AM) into the **next** week (`week_start_date` jumps forward at midnight Wed because `getWeekStart` returns Wed itself for a Wed date).
2. **Browser timezone.** `new Date()` / `getDay()` use the browser's local timezone. Any chatter or admin not on PHT (e.g. VPN, traveling, server-side anything) gets a different "today", silently shifting `day_of_week` and `week_start_date`. There is no PHT normalization anywhere in `weekCalculations.ts`.

Gamification already solves the analogous problem with `src/utils/gameDate.ts::getEffectiveGameDate` (after 22:00 = next day). Payroll has no equivalent; the bug is the missing shift-aware "effective date" for `'10PM'`.

### Safest implementation plan
Keep the workflow (submit / lock / admin confirm / approve) identical. Only fix date grouping.

1. **Add a shift-aware date helper** in `src/utils/weekCalculations.ts`:
   - `getEffectivePayrollDate(now, department)` returning a PHT-normalized `Date`.
   - For `'10PM'`: if PHT hour ∈ [0, 6), subtract one calendar day (the shift belongs to the previous day's 10 PM start). Otherwise return today.
   - For other departments: return today (PHT-normalized) — behavior unchanged.
2. **Normalize to PHT** in one place. Compute PHT components via `Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', ... })` instead of `Date.getDay()` / `getHours()`. Pipe the resulting Y-M-D through `getWeekStart` so week boundaries no longer depend on browser timezone.
3. **Replace every `new Date()` feeding payroll/attendance logic** with `getEffectivePayrollDate(new Date(), department)`. Specifically:
   - `ChatterPayrollView.tsx` `currentWeekStart` + `selectedWeek` default.
   - `PayrollTable.tsx` `currentWeekStart` + the debug `todayDay`.
   - `AttendanceTable.tsx` `currentWeekStart` + `submittedAt`-adjacent day inference, if any.
   - `AttendanceExportButton.tsx` `currentDate`.
   - `AdminPayrollView.tsx` `currentWeekStart` + the `new Date()` defaults passed to admin/manager/employee tables.
   - `WeekNavigator.tsx` default + "this week" comparisons.
   - `usePayrollData.ts` `getWeekStartDate`.
4. **No schema change required.** `sales_tracker` / `attendance` already key by `(chatter_id, model_name, day_of_week, week_start_date)`; we are only changing which `day_of_week` / `week_start_date` get written. The existing 10PM week column ordering in `getDaysOfWeek('10PM')` (Wed→Tue) stays.
5. **Optional UX safeguard (recommended):** in `PayrollTable.tsx` highlight the "current shift day" column based on `getEffectivePayrollDate`, so chatters visually land on the correct column at 2 AM.
6. **One-time data audit (no auto-migration).** Provide a read-only SQL the admin can run to spot Team Nash rows where a Wed-night earnings entry landed under a `day_of_week = 4` row that nobody intended. Do **not** auto-rewrite historical rows — flag for manual admin review to avoid silently changing approved/locked weeks.

### Database / date-time impact
- No table changes, no RLS changes, no new columns.
- Pure client-side date logic change. Edge function payroll paths (none exist for date computation) untouched.
- Risk surface: every component that calls `getWeekStart(new Date(), …)` — enumerated above.

## 2. Team Nash payroll total amount

### Root cause
Totals in `PayrollTable.getWeekTotal`, `useExpectedSalary`, and `PayrollConfirmationModal` sum `sales_tracker.earnings` filtered by `week_start_date`. If rows are written under the **wrong** `week_start_date` (the Tue-night-into-Wed case in §1), they slide into the next week's bucket and disappear from the week the chatter expects. Attendance day-count uses `Set<day_of_week>` of `attendance` rows, so the same shift logged across two calendar days inflates `daysWithAttendance` by 1, inflating hourly pay.

### Fix
Same fix as §1 — once `day_of_week` and `week_start_date` are derived from the shift-effective date, totals reconcile automatically. No separate formula change. After deploy, verify by recomputing a known week for one Team Nash chatter and matching it to the source spreadsheet.

## 3. Gamification back button

### Where
`src/pages/TasksRewards.tsx` — sidebar contains logo + `PlayerCard` + nav items, but no link back to the main CRM.

### Plan
Add a small back button at the top-left of the gamification sidebar (or above the logo) that navigates to `/` (or `-1` via `useNavigate`). Reuse `src/components/ui/back-button.tsx` (`BackButton to="/"`) for visual consistency. Wrap in a dim container so it fits the gamification dark theme — token-only styling, no hex.

Edge cases:
- `TasksRewards` was opened via `window.open` from `LetsPlayButton` (new tab). Back button must `navigate('/')` (push), not `history.back()`, otherwise it closes nothing in a fresh tab. Confirmed correct approach: `useNavigate()` + `'/'`.
- Preserve admin vs. player layout (button shown in both).

## 4. Admin behavior in gamification

### Current behavior
`TasksRewards.tsx` shows admins only **Game Board** + **Control Panel** and forces non-control-panel routes back to control panel. Admins cannot reach Quests / Supply Depot, i.e. cannot inspect chatter view. Meanwhile `PlayerCard.tsx` and `useGamification` fetch `myStats` / quest slots for the admin's own user id, which means admins implicitly become "players" in any data path that writes to `gamification_*` keyed on `auth.uid()`.

### Plan
1. **Expose all four tabs to admin** in `visibleNavItems` (Game Board, Quests, Supply Depot, Control Panel). Remove the redirect in `renderContent` that punts admins out of `quests` / `supply-depot`. This gives admins read/monitor access to the chatter view.
2. **Block admin from participating**, on the chatter-view code paths:
   - `ChatterQuestsPage`, `DailyQuestSlots`, `WeeklyQuestSlots`, `MonthlyQuestSlots`, `QuestEvidenceUpload`, `SupplyDepot` — gate every write action (claim, re-roll, evidence upload, purchase) with `isAdmin` check; render the UI in a read-only "Admin preview" state (banner: "Viewing as admin — interactions disabled").
   - `PlayerCard.tsx` — if admin, render an admin badge instead of the player rank/XP block (or hide it entirely in admin layout).
   - `useGamification` / `useDailyQuestSlots` / `useWeeklyQuestSlots` / `useMonthlyQuestSlots` — skip auto-creating personal slots / banana transactions when caller is admin.
3. **DB safety net (optional, recommended):** add RLS check so `gamification_quest_progress`, `gamification_purchases`, `gamification_banana_transactions`, `gamification_daily_quest_slots` inserts reject rows where the acting user has the `Admin` role. This prevents accidental writes even if a UI guard is missed. Uses `has_role(auth.uid(), 'admin')` pattern already documented in the user-roles guidance.

Edge cases:
- Admin who also holds `Chatter` role (unlikely but possible) — define precedence: Admin wins → no participation.
- Existing admin rows in gamification tables (if any) — leave alone; just block future writes.

## 5. Date / midnight edge cases to test

- Team Nash chatter submits sales at **23:59 PHT Wed** and at **00:01 PHT Thu** — both must land on the same row (`week_start_date = Wed`, `day_of_week = 3`).
- Team Nash shift ending at **06:00 PHT Wed** (Tue-night shift) must post to **previous week** (`week_start_date = previous Wed`, `day_of_week = 2` for Tue).
- Standard (non-10PM) chatter at **23:59 PHT Wed** vs **00:01 PHT Thu** — Thu row should be the **new week's** Thursday (`day_of_week = 4`, new `week_start_date`). Unchanged behavior.
- Daylight-saving — PHT has none, but verify `Intl` with `Asia/Manila` returns stable offsets.
- Browser set to America/Los_Angeles for a Team Nash chatter — week boundaries must still be PHT.
- Admin viewing a Team Nash chatter from a non-PHT browser — `WeekNavigator` must show PHT weeks.
- Sales already locked / admin-confirmed in a misaligned historical week — must remain untouched until manual review.
- Expected salary calculation — `daysWithAttendance.size * 8` after fix should equal the count of distinct shift-days, not distinct calendar-days.
- Gamification: admin clicks Quests tab → sees chatter UI in read-only mode, no DB row created. Re-roll button disabled. Supply Depot purchase disabled.
- Gamification back button: works from `/tasks-rewards`, `/tasks-rewards/quests`, `/tasks-rewards/supply-depot`, `/tasks-rewards/control-panel`; returns to `/` (Dashboard) in both same-tab and new-tab opens.

## 6. Recommended pre-implementation test checklist

1. Snapshot current `sales_tracker` + `attendance` rows for 2–3 Team Nash chatters across the last 2 weeks for before/after comparison.
2. Unit-test `getEffectivePayrollDate` and `getWeekStart` for: 10PM dept @ 23:59 PHT, 00:00 PHT, 05:59 PHT, 06:00 PHT, 10:00 PHT; standard dept at the same times; browser TZ = PHT, UTC, PST.
3. Manual: log in as Team Nash chatter, enter $X at 23:59 simulated, $Y at 00:30 simulated → confirm both land on Wed column same row.
4. Manual: lock sales for a Team Nash week → expected salary matches `(distinct shift days × 8 × hourly) + commission`.
5. Manual: admin opens payroll for a Team Nash chatter from a non-PHT browser → sees same week as the chatter.
6. Manual: admin opens `/tasks-rewards`, navigates Game Board → Quests → Supply Depot → Control Panel; verifies banner + disabled buttons + no rows written to `gamification_*` (check via `read_query` after the session).
7. Manual: back button returns to `/` from each gamification subroute.
8. Regression: standard (non-10PM) chatter weekly entry unchanged; weekly totals, lock/approve flow, payslip PDF unchanged.
