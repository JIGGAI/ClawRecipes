import { useEffect, useState, useRef } from "react";
import { fetchActivity, type ActivityEvent } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatRelativeTime } from "../utils/formatTime";
import {
  ACTIVITY_FETCH_LIMIT,
  ACTIVITY_POLL_INTERVAL_MS,
  ACTIVITY_NEW_ITEM_HIGHLIGHT_MS,
  ACTIVITY_FEED_WIDTH_EXPANDED,
  ACTIVITY_FEED_WIDTH_COLLAPSED,
} from "../constants";
import { IconChevron } from "./icons/IconChevron";

export function ActivityFeed() {
  const [expanded, setExpanded] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const activityData = useAsync(
    () => fetchActivity(ACTIVITY_FETCH_LIMIT),
    [],
    { refetchInterval: ACTIVITY_POLL_INTERVAL_MS, fallbackOnError: [] }
  );
  const events = activityData.data ?? [];

  useEffect(() => {
    if (events.length === 0) return;
    const currentIds = new Set(events.map((e) => e.id));
    const prev = prevIdsRef.current;
    const newlyAdded = events.filter((e) => !prev.has(e.id));
    prevIdsRef.current = currentIds;
    if (newlyAdded.length > 0) {
      setNewIds(new Set(newlyAdded.map((e) => e.id)));
      const id = setTimeout(() => setNewIds(new Set()), ACTIVITY_NEW_ITEM_HIGHLIGHT_MS);
      return () => clearTimeout(id);
    }
  }, [events]);

  return (
    <aside
      className="activity-feed activity-feed-aside d-flex flex-column flex-shrink-0"
      style={expanded ? { width: ACTIVITY_FEED_WIDTH_EXPANDED } : { width: ACTIVITY_FEED_WIDTH_COLLAPSED }}
    >
      <button
        type="button"
        className="activity-feed-toggle border-0 d-flex align-items-center gap-1 text-start"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse activity feed" : "Expand activity feed"}
      >
        <span className="activity-feed-chevron" aria-hidden>
          <IconChevron direction={expanded ? "left" : "right"} />
        </span>
        {expanded && <span className="activity-feed-title">Activity</span>}
      </button>
      {expanded && (
      <div className="activity-list flex-grow-1 overflow-auto">
        {events.length === 0 && !activityData.error && (
          <div className="p-4 text-muted text-center">No activity yet</div>
        )}
        {activityData.error && (
          <div className="p-4 text-danger small text-center">{activityData.error}</div>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className={`activity-item ${newIds.has(e.id) ? "activity-item-new" : ""}`}
          >
            <span className="activity-item-time">{formatRelativeTime(e.timestamp)}</span>
            <span className="activity-item-message">{e.message}</span>
          </div>
        ))}
      </div>
      )}
    </aside>
  );
}
