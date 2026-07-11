import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useLayoutEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

const NO_CATEGORY_COLOR = "#cbd5e1";
const LAST_START = 23 * 60 + 30; // latest pickable start, leaves room for an end option
const LAST_END = 23 * 60 + 45;
const MODAL_PADDING = 12;
const MODAL_GAP = 8;

function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function toHHMM(minutes) {
  const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function timeLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function durationLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Sorted quarter-hour options in [from, to], always including `current` so an
// event saved with an off-grid time still shows as selected.
function quarterOptions(from, to, current, hintFrom = null) {
  const mins = [];
  for (let m = from; m <= to; m += 15) mins.push(m);
  const cur = current ? toMinutes(current) : null;
  if (cur !== null && !mins.includes(cur)) {
    mins.push(cur);
    mins.sort((a, b) => a - b);
  }
  return mins.map((m) => ({
    value: toHHMM(m),
    label: timeLabel(m),
    hint: hintFrom !== null && m > hintFrom ? durationLabel(m - hintFrom) : null,
  }));
}

const FIELD_BUTTON =
  "flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60";

const FIELD_INPUT =
  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60";

function panelClass(dropUp) {
  return `absolute left-0 z-50 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg ${
    dropUp ? "bottom-full mb-1" : "top-full mt-1"
  }`;
}

function usePopover() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 280);
    }
    setOpen((prev) => !prev);
  };

  return { ref, open, setOpen, dropUp, toggle };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function positionNearAnchor(anchorRect, modalRect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = Math.max(viewportWidth - modalRect.width - MODAL_PADDING, MODAL_PADDING);
  const maxTop = Math.max(viewportHeight - modalRect.height - MODAL_PADDING, MODAL_PADDING);
  const centeredTop = anchorRect.top + anchorRect.height / 2 - modalRect.height / 2;

  const candidates = [
    {
      top: centeredTop,
      left: anchorRect.right + MODAL_GAP,
      fits: anchorRect.right + MODAL_GAP + modalRect.width <= viewportWidth - MODAL_PADDING,
    },
    {
      top: centeredTop,
      left: anchorRect.left - modalRect.width - MODAL_GAP,
      fits: anchorRect.left - modalRect.width - MODAL_GAP >= MODAL_PADDING,
    },
    {
      top: anchorRect.bottom + MODAL_GAP,
      left: anchorRect.left,
      fits: anchorRect.bottom + MODAL_GAP + modalRect.height <= viewportHeight - MODAL_PADDING,
    },
    {
      top: anchorRect.top - modalRect.height - MODAL_GAP,
      left: anchorRect.left,
      fits: anchorRect.top - modalRect.height - MODAL_GAP >= MODAL_PADDING,
    },
  ];

  const best = candidates.find((candidate) => candidate.fits) ?? candidates[0];

  return {
    top: clamp(best.top, MODAL_PADDING, maxTop),
    left: clamp(best.left, MODAL_PADDING, maxLeft),
  };
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.79 3.79 6.8-6.8a1 1 0 011.41 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

function TimeField({ value, options, onSelect, ariaLabel }) {
  const { ref, open, setOpen, dropUp, toggle } = usePopover();
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={FIELD_BUTTON}
      >
        <span className="truncate tabular-nums">{timeLabel(toMinutes(value))}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={`${panelClass(dropUp)} max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected || undefined}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm tabular-nums ${
                  isSelected
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.hint && (
                  <span className="shrink-0 text-[11px] text-slate-400">{opt.hint}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryField({ categories, value, onSelect }) {
  const { ref, open, setOpen, dropUp, toggle } = usePopover();

  const options = [
    { category_id: "", name: "No category", color: NO_CATEGORY_COLOR },
    ...categories,
  ];
  const selected =
    options.find((c) => String(c.category_id) === String(value ?? "")) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={FIELD_BUTTON}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: selected.color || NO_CATEGORY_COLOR }}
          />
          <span className="truncate">{selected.name}</span>
        </span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div
          role="listbox"
          className={`${panelClass(dropUp)} max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent`}
        >
          {options.map((cat) => {
            const isSelected = String(cat.category_id) === String(selected.category_id);
            return (
              <button
                type="button"
                key={cat.category_id === "" ? "none" : cat.category_id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(String(cat.category_id));
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm ${
                  isSelected
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: cat.color || NO_CATEGORY_COLOR }}
                />
                <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                {isSelected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function DateField({ value, onChange }) {
  const { ref, open, setOpen, dropUp, toggle } = usePopover();
  const [viewMonth, setViewMonth] = useState(() => dayjs(value || undefined));

  const openCalendar = () => {
    if (!open) setViewMonth(dayjs(value || undefined));
    toggle();
  };

  const monthStart = viewMonth.startOf("month");
  const cells = [
    ...Array.from({ length: monthStart.day() }, () => null),
    ...Array.from({ length: viewMonth.daysInMonth() }, (_, i) => monthStart.date(i + 1)),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={openCalendar}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={FIELD_BUTTON}
      >
        <span className="truncate">
          {value ? dayjs(value).format("ddd, MMM D, YYYY") : "Pick a date"}
        </span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className={`${panelClass(dropUp)} p-2`}>
          <div className="mb-1 flex items-center justify-between px-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => m.subtract(1, "month"))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L9.06 10l3.71 3.71a.75.75 0 11-1.06 1.06l-4.25-4.24a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.08.01z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-900">
              {viewMonth.format("MMMM YYYY")}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => m.add(1, "month"))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.25 4.24a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.08-.01z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 justify-items-center">
            {WEEKDAY_INITIALS.map((d, i) => (
              <span
                key={`${d}-${i}`}
                className="flex h-7 w-7 items-center justify-center text-[10px] font-semibold uppercase text-slate-400"
              >
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={`blank-${i}`} className="h-7 w-7" />;
              const isSelected = value && day.isSame(dayjs(value), "day");
              const isToday = day.isSame(dayjs(), "day");
              return (
                <button
                  type="button"
                  key={day.format("YYYY-MM-DD")}
                  onClick={() => {
                    onChange(day.format("YYYY-MM-DD"));
                    setOpen(false);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                    isSelected
                      ? "bg-slate-900 font-semibold text-white hover:bg-slate-700"
                      : isToday
                      ? "bg-slate-100 font-semibold text-slate-900 hover:bg-slate-200"
                      : "font-medium text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const EventModal = forwardRef(function EventModal({
  isOpen,
  setIsOpen,
  onSave,
  onDelete,
  editingEvent,
  categories,
  selectedHour,
  clickCoords,
  anchorRect,
  selectedDate,
  modalPosition,
  setPendingEvent
}, ref) {
  const modalRef = useRef();
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(editingEvent?.date || new Date().toISOString().split("T")[0]);
  const [renderPos, setRenderPos] = useState(null);
  const [modalMode, setModalMode] = useState(editingEvent ? "details" : "form");

  useImperativeHandle(ref, () => ({
    getSize: () => {
      const rect = modalRef.current?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : { width: 340, height: 480 };
    }
  }));

  // Keep positioning in viewport coordinates because the modal is fixed.
  useLayoutEffect(() => {
    if (!isOpen) {
      setRenderPos(null);
      return;
    }
    const el = modalRef.current;
    if (!el) {
      return;
    }

    const modalRect = {
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
    const fallbackAnchor = clickCoords
      ? { top: clickCoords.y, left: clickCoords.x, right: clickCoords.x, bottom: clickCoords.y, width: 0, height: 0 }
      : null;
    const anchor = anchorRect ?? fallbackAnchor;

    if (anchor) {
      setRenderPos(positionNearAnchor(anchor, modalRect));
      return;
    }

    const base = modalPosition ?? {
      top: window.innerHeight / 2 - modalRect.height / 2,
      left: window.innerWidth / 2 - modalRect.width / 2,
    };

    setRenderPos({
      top: clamp(base.top, MODAL_PADDING, Math.max(window.innerHeight - modalRect.height - MODAL_PADDING, MODAL_PADDING)),
      left: clamp(base.left, MODAL_PADDING, Math.max(window.innerWidth - modalRect.width - MODAL_PADDING, MODAL_PADDING)),
    });
  }, [isOpen, anchorRect, clickCoords, modalPosition]);

  useEffect(() => {
    if (isOpen) {
      setModalMode(editingEvent ? "details" : "form");
      if (editingEvent) {
        setDate(new Date(editingEvent.date).toISOString().split("T")[0]);
        setTitle(editingEvent.title || "");
        setBudget(editingEvent.budget || "");
        setTimeStart(editingEvent.timeStart || "");
        setTimeEnd(editingEvent.timeEnd || "");
        setCategoryId(String(editingEvent.categoryId || ""));
      } else {
        const defaultDate = selectedDate || new Date().toISOString().split("T")[0];
        const now = new Date();
        const nowQuarter = Math.min(
          Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15,
          LAST_START
        );
        const hasHour = selectedHour !== undefined && selectedHour !== null;
        const start = hasHour
          ? selectedHour.toString().padStart(2, "0") + ":00"
          : toHHMM(nowQuarter);
        const end = hasHour
          ? ((selectedHour + 1) % 24).toString().padStart(2, "0") + ":00"
          : toHHMM(Math.min(nowQuarter + 60, LAST_END));

        setDate(defaultDate);
        setTitle("");
        setBudget("");
        setTimeStart(start);
        setTimeEnd(end);
        setCategoryId("");
      }
    }
  }, [isOpen, editingEvent, selectedHour, selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      setPendingEvent?.(null);
    }
  }, [isOpen, setPendingEvent]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title, date, budget, timeStart, timeEnd, categoryId });
    setIsOpen(false);
  }

  function handleDelete() {
    if (editingEvent) {
      onDelete(editingEvent);
      setIsOpen(false);
    }
  }

  function handleEdit() {
    setModalMode("form");
  }

  // Moving the start keeps the event duration, so the end can never land
  // before the start.
  function handleStartSelect(newStart) {
    const rawDuration = toMinutes(timeEnd) - toMinutes(timeStart);
    const duration = rawDuration >= 15 ? rawDuration : 60;
    setTimeStart(newStart);
    setTimeEnd(toHHMM(Math.min(toMinutes(newStart) + duration, LAST_END)));
  }

  const startMin = toMinutes(timeStart);
  const startOptions = quarterOptions(0, LAST_START, timeStart);
  const endOptions = quarterOptions(startMin + 15, LAST_END, timeEnd, startMin);

  const activeColor =
    categories.find((c) => String(c.category_id) === String(categoryId))?.color ||
    NO_CATEGORY_COLOR;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop without black or blur */}
          <motion.div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 30 }}
            className="fixed z-50 max-h-[calc(100vh-24px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
            style={{
              top: renderPos?.top ?? MODAL_PADDING,
              left: renderPos?.left ?? MODAL_PADDING,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors"
                    style={{ backgroundColor: activeColor }}
                  />
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {modalMode === "details" ? "Event details" : editingEvent ? "Edit event" : "New event"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {modalMode === "details" && editingEvent ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-3.5 px-4 py-4"
                  >
                    <div>
                      <FieldLabel>Title</FieldLabel>
                      <p className="text-base font-semibold text-slate-900">{editingEvent.title || "Untitled event"}</p>
                    </div>
                    <div>
                      <FieldLabel>Date</FieldLabel>
                      <p className="text-sm text-slate-700">{dayjs(editingEvent.date).format("dddd, MMMM D, YYYY")}</p>
                    </div>
                    <div>
                      <FieldLabel>Time</FieldLabel>
                      <p className="text-sm tabular-nums text-slate-700">
                        {timeLabel(toMinutes(editingEvent.timeStart))} – {timeLabel(toMinutes(editingEvent.timeEnd))}
                      </p>
                    </div>
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <p className="flex items-center gap-2 text-sm text-slate-700">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                          style={{ backgroundColor: activeColor }}
                        />
                        {categories.find((category) => String(category.category_id) === String(editingEvent.categoryId))?.name || "No category"}
                      </p>
                    </div>
                    <div>
                      <FieldLabel>Budget</FieldLabel>
                      <p className="text-sm tabular-nums text-slate-700">${Number(editingEvent.budget || 0).toFixed(2)}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-3.5 px-4 py-4"
                  >
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <input
                    type="text"
                    className={FIELD_INPUT}
                    placeholder="Add a title…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <FieldLabel>Date</FieldLabel>
                  <DateField value={date} onChange={setDate} />
                </div>

                <div>
                  <FieldLabel>Time</FieldLabel>
                  <div className="flex items-center gap-2">
                    <TimeField
                      ariaLabel="Start time"
                      value={timeStart}
                      options={startOptions}
                      onSelect={handleStartSelect}
                    />
                    <span className="shrink-0 text-sm text-slate-400">–</span>
                    <TimeField
                      ariaLabel="End time"
                      value={timeEnd}
                      options={endOptions}
                      onSelect={setTimeEnd}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <CategoryField
                    categories={categories}
                    value={categoryId}
                    onSelect={setCategoryId}
                  />
                </div>

                <div>
                  <FieldLabel>Budget</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      className={`${FIELD_INPUT} pl-6`}
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                {modalMode === "details" && editingEvent ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : editingEvent ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  {modalMode === "details" && editingEvent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
                      >
                        {editingEvent ? "Save changes" : "Create event"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default EventModal;
