import { formatTimeRange } from "./timeGrid";

// A single tinted event card inside the Week/Day time grid. Position comes
// from the layoutDayEvents() item; colors are derived from the category color.
function EventBlock({ item, color, rowHeight, onClick }) {
  const { event, start, end, col, cols } = item;
  const height = ((end - start) / 60) * rowHeight;
  const compact = height < 40;

  return (
    <div
      data-event-id={event.id}
      onClick={onClick}
      className="event-block absolute z-10 cursor-pointer overflow-hidden rounded-md text-xs leading-snug pointer-events-auto"
      style={{
        top: `${(start / 60) * rowHeight}px`,
        height: `${height}px`,
        left: `calc(${(col / cols) * 100}% + 2px)`,
        width: `calc(${100 / cols}% - ${col === cols - 1 ? 10 : 4}px)`,
        backgroundColor: `color-mix(in srgb, ${color} 14%, white)`,
        color: `color-mix(in srgb, ${color} 55%, #0f172a)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className={compact ? "flex h-full flex-col justify-center px-1.5" : "px-2 pt-1"}>
        <div className="truncate font-medium">
          {event.title}
          {event.budget > 0 && (
            <span className="font-normal tabular-nums opacity-70"> · ${event.budget}</span>
          )}
        </div>
        {!compact && (
          <div className="truncate text-[11px] tabular-nums opacity-70">
            {formatTimeRange(start, end)}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventBlock;
