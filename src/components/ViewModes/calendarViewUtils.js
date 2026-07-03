export function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return 0;

  const [hours, minutes] = timeStr.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}

export function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const standard = hour % 12 === 0 ? 12 : hour % 12;
  return `${standard} ${suffix}`;
}

export function getTextColor(bgColor = "#e0e0e0") {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

export function buildPendingEvent({ date, startHour, endHour = startHour + 1 }) {
  return {
    title: "New Event",
    timeStart: `${startHour.toString().padStart(2, "0")}:00`,
    timeEnd: `${endHour.toString().padStart(2, "0")}:00`,
    date,
    categoryId: "",
    budget: 0,
  };
}

export function positionModalNextToElement(
  element,
  { modalWidth = 300, modalHeight = 500, bottomOffset = 16, clampToDocument = false } = {}
) {
  const rect = element.getBoundingClientRect();
  let top = rect.top + window.scrollY;
  let left = rect.right + window.scrollX + 8;

  if (left + modalWidth > window.innerWidth) {
    left = rect.left - modalWidth - 8 + window.scrollX;
  }

  const maxTop = clampToDocument
    ? document.documentElement.scrollHeight - modalHeight - bottomOffset
    : window.scrollY + window.innerHeight - modalHeight - bottomOffset;
  if (top > maxTop) top = maxTop;

  return { top, left };
}

export function positionModalFromClick({ x, y }, element, { modalWidth = 300, modalHeight = 500 } = {}) {
  const rect = element.getBoundingClientRect();
  let top = y + window.scrollY;
  let left = x + window.scrollX + 8;

  if (left + modalWidth > window.innerWidth) {
    left = rect.left - modalWidth - 8 + window.scrollX;
  }

  const maxTop = document.documentElement.scrollHeight - modalHeight - 16;
  if (top > maxTop) top = maxTop;

  return { top, left };
}
