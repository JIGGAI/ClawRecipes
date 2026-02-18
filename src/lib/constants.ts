export const VALID_ROLES = ["dev", "devops", "lead", "test"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export const VALID_STAGES = ["backlog", "in-progress", "testing", "done"] as const;
export type ValidStage = (typeof VALID_STAGES)[number];

/** Max auto-increment attempts for pickRecipeId (e.g. id-2, id-3, ... id-999). */
export const MAX_RECIPE_ID_AUTO_INCREMENT = 1000;

/** Fallback ticket number when parsing fails. */
export const DEFAULT_TICKET_NUMBER = "0000";
