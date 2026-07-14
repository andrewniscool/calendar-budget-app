// Time math and overlap layout shared by the time-grid views (WeekView/DayView).

export function getMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function clampRange(timeStart, timeEnd) {
  const start = Math.max(0, Math.min(getMinutes(timeStart), 24 * 60));
  const end = Math.max(start + 15, Math.min(getMinutes(timeEnd), 24 * 60));
  return { start, end };
}

export function getBlockOffsets(timeStart, timeEnd, rowHeight) {
  const { start, end } = clampRange(timeStart, timeEnd);
  return {
    top: `${(start / 60) * rowHeight}px`,
    height: `${((end - start) / 60) * rowHeight}px`,
  };
}

// Assign overlapping events to side-by-side columns so they never stack on
// top of each other. Returns [{ event, start, end, col, cols }].
export function layoutDayEvents(dayEvents) {
  const items = dayEvents
    .map((event) => ({ event, ...clampRange(event.timeStart, event.timeEnd), col: 0, cols: 1 }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let cluster = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    const colEnds = [];
    for (const item of cluster) {
      let col = colEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.end);
      } else {
        colEnds[col] = item.end;
      }
      item.col = col;
    }
    for (const item of cluster) item.cols = colEnds.length;
    cluster = [];
  };

  for (const item of items) {
    if (cluster.length && item.start >= clusterEnd) closeCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length) closeCluster();

  return items;
}

function timeLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}` : `${hour12}:${String(m).padStart(2, "0")}`;
}

function meridiem(minutes) {
  return Math.floor(minutes / 60) % 24 >= 12 ? "PM" : "AM";
}

export function formatTimeRange(start, end) {
  const s = timeLabel(start);
  const e = timeLabel(end);
  return meridiem(start) === meridiem(end)
    ? `${s} – ${e} ${meridiem(end)}`
    : `${s} ${meridiem(start)} – ${e} ${meridiem(end)}`;
}
