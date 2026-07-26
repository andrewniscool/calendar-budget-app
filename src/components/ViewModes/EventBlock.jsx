import { formatTimeRange } from "./timeGrid";
import { formatCurrency } from "../../utils/currency";

// A single calendar-tinted event card inside the Week/Day time grid. Position
// comes from the layoutDayEvents() item; financial data stays secondary.
function EventBlock({ item, color, categoryName, currency, rowHeight, onClick }) {
  const { event, start, end, col, cols, stack = 0 } = item;
  const height = ((end - start) / 60) * rowHeight;
  const compact = height < 40;
  const foregroundCols = Math.max(1, cols - 1);
  const isBackgroundEvent = col === 0;
  const foregroundCol = col - 1;

  // Keep the first event full width underneath the collision group. A single
  // foreground event nearly covers it; concurrent foreground events divide
  // that same space into equal lanes.
  const horizontalStyle = isBackgroundEvent
    ? { left: "2px", right: "6px" }
    : {
        left: `calc(${(foregroundCol / foregroundCols) * 100}% + ${foregroundCol === 0 ? 10 : 2}px)`,
        width: `calc(${100 / foregroundCols}% - 8px)`,
      };

  return (
    <div
      data-event-id={event.id}
      onClick={onClick}
      className="event-block absolute cursor-pointer overflow-hidden rounded-md text-xs leading-snug pointer-events-auto"
      style={{
        top: `${(start / 60) * rowHeight}px`,
        height: `${height}px`,
        ...horizontalStyle,
        zIndex: 10 + stack,
        backgroundColor: `color-mix(in srgb, ${color} 14%, white)`,
        color: `color-mix(in srgb, ${color} 55%, #0f172a)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className={compact ? "flex h-full flex-col justify-center px-1.5" : "px-2 pt-1"}>
        <div className="truncate font-medium">
          {event.title}
          {event.budget > 0 && (
            <span className="font-normal tabular-nums opacity-70">
              {" · "}{formatCurrency(event.budget, currency)}
            </span>
          )}
        </div>
        {!compact && (
          <div className="truncate text-[11px] tabular-nums opacity-70">
            {formatTimeRange(start, end)}
            {event.categoryId && categoryName && (
              <span> · {categoryName}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventBlock;
