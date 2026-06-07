import { useAuth } from '@/context/AuthContext';

/**
 * Game module role resolver.
 *
 * Permission priority inside the Game module: DCR > Admin > Chatter.
 *
 * - DCR  → can play AND manage quests (no admin participation restriction).
 * - Admin (without DCR) → manager only, view-only / no participation.
 * - Chatter (without DCR/Admin) → player only, no quest management.
 *
 * This helper is intentionally scoped to the Game module only — do NOT use it
 * to gate non-game admin features (Payroll, CRM, etc.).
 */
export type GameRole = 'DCR' | 'Admin' | 'Chatter' | 'None';

export interface UseGameRoleResult {
  gameRole: GameRole;
  /** DCR or Admin — can create/assign/manage quests, shop items, ranks. */
  canManageQuests: boolean;
  /** DCR or non-admin player (Chatter or any other player). Gets PlayerCard, slots, claim/reroll/purchase. */
  isPlayer: boolean;
  /** Admin without DCR — the legacy "view-only / no participation" admin. */
  isAdminOnly: boolean;
}

const hasRole = (
  userRole: string | undefined,
  userRoles: string[] | undefined,
  target: string,
): boolean => {
  if (userRole === target) return true;
  if (Array.isArray(userRoles) && userRoles.includes(target)) return true;
  return false;
};

export const useGameRole = (): UseGameRoleResult => {
  const { userRole, userRoles } = useAuth();

  const isDCR = hasRole(userRole, userRoles, 'DCR');
  const isAdmin = hasRole(userRole, userRoles, 'Admin');
  const isChatter = hasRole(userRole, userRoles, 'Chatter');

  let gameRole: GameRole = 'None';
  if (isDCR) gameRole = 'DCR';
  else if (isAdmin) gameRole = 'Admin';
  else if (isChatter) gameRole = 'Chatter';

  const canManageQuests = isDCR || isAdmin;
  // DCR always plays. Admin-only never plays. Everyone else (Chatter, Employee, etc.) plays.
  const isPlayer = isDCR || !isAdmin;
  const isAdminOnly = isAdmin && !isDCR;

  return { gameRole, canManageQuests, isPlayer, isAdminOnly };
};
