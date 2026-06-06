# Separate Expected Salary from Approved Salary

## Goal

- **Expected Salary** = system-computed pay frozen at the moment the chatter locks payroll. Never drifts afterward.
- **Approved Salary** = Expected Salary + overtime/bonus − deduction, written when admin clicks Pay Chatter.
- After admin confirmation both values are shown together; Approved Salary uses blue tokens, Expected stays as-is.

## Where each value lives

Today everything is overloaded onto `sales_tracker` rows: `sales_locked`, `admin_confirmed`, `confirmed_hours_worked`, `confirmed_commission_rate`, `overtime_pay`, `deduction_amount`, notes. Expected Salary is recomputed live in `useExpectedSalary` every render, so any post-lock edit to sales / attendance / `profiles.hourly_rate` silently changes it.

**Recommended approach: one new summary table, keyed by (chatter_id, week_start_date).** Cleaner than adding 6 more columns to every sales row, and avoids the "which row is the source of truth" problem when a chatter has many sales rows per week.

### New table: `payroll_summaries`
- `chatter_id uuid`, `week_start_date date` (unique together)
- Snapshot at lock: `locked_total_sales`, `locked_hours_worked`, `locked_hourly_rate`, `locked_commission_rate`, `locked_hourly_pay`, `locked_commission_amount`, `expected_salary`, `locked_at`
- Snapshot at admin confirm: `overtime_pay`, `overtime_notes`, `deduction_amount`, `deduction_notes`, `bonus_amount`, `approved_salary`, `approved_at`, `approved_by`
- `created_at`, `updated_at`

RLS: chatter can read their own row; Admin/VA/HR can read & write all.

### What stays on `sales_tracker`
- `sales_locked`, `admin_confirmed` flags continue to drive UI gating (no behavior change to existing screens).
- The `confirmed_*`, `overtime_*`, `deduction_*` columns become legacy/back-compat. Keep them populated by the Approve modal for now so nothing else breaks; treat `payroll_summaries` as the source of truth going forward.
- No historical rows are modified or migrated.

## Flow changes

### 1. Chatter locks payroll (`LockSalesButton`)
After flipping `sales_locked=true`, run the existing Expected Salary formula once and **upsert** a `payroll_summaries` row with the snapshot fields. If a row already exists (re-lock after admin reject), overwrite the locked snapshot only and clear approved fields.

### 2. `useExpectedSalary`
Switch from live computation to: read `payroll_summaries.expected_salary` for that chatter+week. If no row yet (legacy weeks already locked under the old system) fall back to the current live calc so old weeks still display.

### 3. Approve modal (`PayrollConfirmationModal`)
- Show locked Expected Salary, locked hours, locked commission rate, locked total sales as **read-only**.
- Admin inputs only: overtime, bonus, deduction, notes.
- Live preview: `Approved Salary = expected_salary + overtime + bonus − deduction`.
- On submit: update `payroll_summaries` (approved fields + `approved_salary`, `approved_at`, `approved_by`) AND set `sales_tracker.admin_confirmed=true` for the week (keeps existing flows working). Also mirror overtime/deduction onto sales_tracker for back-compat.

### 4. Display after confirmation (Chatter + Admin payroll views)
Stacked, directly below each other:
```
Expected Salary: $___        (existing green styling)
Approved Salary: $___        (blue tokens — add --salary-approved in index.css mapped to a blue HSL, or reuse an existing info/primary blue token)
```
Approved row renders only when `payroll_summaries.approved_salary IS NOT NULL`.

## Safety / non-regression

- No edits to existing `sales_tracker` rows beyond the flag writes already happening today.
- Old locked-but-not-confirmed weeks keep working via the fallback path in `useExpectedSalary`.
- Expected Salary becomes immutable post-lock by construction (read from snapshot, not recomputed).
- Admin overrides are isolated to the approved fields; Expected column never changes.

## Test checklist

- [ ] Chatter locks fresh week → `payroll_summaries` row created with correct snapshot; UI shows Expected Salary equal to old live value.
- [ ] After lock, edit a `sales_tracker.earnings` row → Expected Salary in UI does NOT change.
- [ ] After lock, change `profiles.hourly_rate` → Expected Salary does NOT change.
- [ ] Admin opens Approve modal → Expected, hours, commission %, total sales are read-only and match snapshot.
- [ ] Admin enters overtime $50, deduction $20 → preview shows Approved = Expected + 50 − 20; on submit, `approved_salary` stored.
- [ ] After confirm, both Expected and Approved render, Approved in blue, stacked.
- [ ] Reject payroll (existing flow) clears `admin_confirmed` and approved fields; Expected snapshot preserved; chatter can re-lock and snapshot refreshes.
- [ ] Legacy week locked before this change (no summary row) still displays via fallback.
- [ ] Chatter RLS: can read only own summary; cannot insert/update.
- [ ] Admin/VA/HR can read & update any summary; Chatter role cannot bypass.
- [ ] 10PM shift week_start_date matches what `getWeekStart` computes for that department.

## Technical notes

- Migration: `CREATE TABLE public.payroll_summaries (...)` + GRANTs (`authenticated` SELECT/INSERT/UPDATE, `service_role` ALL) + RLS + `update_updated_at_column` trigger.
- Files to touch (implementation phase only): `LockSalesButton.tsx`, `useExpectedSalary.ts`, `PayrollConfirmationModal.tsx`, `ChatterPayrollView.tsx`, `AdminPayrollView.tsx`, plus a small `useApprovedSalary` hook or extend `useExpectedSalary` to return both.
- Blue token: add `--salary-approved: <blue HSL>` in `index.css` and a `text-salary-approved` utility in `tailwind.config.ts`, mirroring whatever pattern the existing green Expected Salary uses.
- No changes to formula, week calculation, attendance, or commission tiers.
