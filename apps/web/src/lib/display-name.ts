/** Display names are trimmed and capped at this length. Single source of truth,
 *  kept in sync with the `maxLength` on the onboarding Input, the 1–40 check in
 *  the saveDisplayName server action, and the DB CHECK on profiles.display_name. */
export const DISPLAY_NAME_MAX = 40;
