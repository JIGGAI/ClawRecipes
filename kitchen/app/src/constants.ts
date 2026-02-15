/** Valid owner roles for ticket assignment. */
export const OWNERS = ["dev", "devops", "lead", "test"] as const;

/** Kanban stages with labels. */
export const STAGES = [
  { key: "backlog", label: "Backlog" },
  { key: "in-progress", label: "In Progress" },
  { key: "testing", label: "Testing" },
  { key: "done", label: "Done" },
] as const;

/** Activity feed: fetch limit, poll interval, highlight duration, sidebar widths. */
export const ACTIVITY_FETCH_LIMIT = 50;
export const ACTIVITY_POLL_INTERVAL_MS = 5000;
export const ACTIVITY_NEW_ITEM_HIGHLIGHT_MS = 1500;
export const ACTIVITY_FEED_WIDTH_EXPANDED = "260px";
export const ACTIVITY_FEED_WIDTH_COLLAPSED = "44px";

/** Ticket card flash animation duration. */
export const TICKET_CARD_FLASH_DURATION_MS = 800;

/** Route path to document title (without app name suffix). */
export const ROUTE_TITLES: Record<string, string> = {
  "/board": "Board",
  "/recipes": "Recipes",
  "/bindings": "Bindings",
  "/login": "Sign in",
};

/** Kanban column config for Board: colKey maps to props, accent for styling. */
export const KANBAN_COLUMNS = [
  { colKey: "backlog", label: "Backlog", accent: "secondary" },
  { colKey: "inProgress", label: "In Progress", accent: "primary" },
  { colKey: "testing", label: "Testing", accent: "warning" },
  { colKey: "done", label: "Done", accent: "success" },
] as const;
