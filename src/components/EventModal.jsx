import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useLayoutEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiClock, FiDollarSign, FiEdit2, FiTag, FiTrash2, FiX } from "react-icons/fi";
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

function parseTimeInput(input) {
  const match = String(input || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[3]?.toLowerCase();
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (hour === 12) hour = 0;
    if (meridiem === "pm") hour += 12;
  } else if (hour > 23) {
    return null;
  }
  return hour * 60 + minute;
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
  const alignedTop = anchorRect.top;
  const leftSide = anchorRect.left - modalRect.width - MODAL_GAP;
  const rightSide = anchorRect.right + MODAL_GAP;

  const candidates = [
    {
      top: alignedTop,
      left: leftSide,
      // Prefer the left side, keeping the modal completely outside the
      // clicked block's rectangle.
      fits: leftSide >= MODAL_PADDING,
    },
    {
      top: alignedTop,
      left: rightSide,
      fits: rightSide + modalRect.width <= viewportWidth - MODAL_PADDING,
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

function TimeField({ value, options, onSelect, ariaLabel, error, onValidityChange }) {
  const { ref, open, setOpen, dropUp, toggle } = usePopover();
  const listRef = useRef(null);
  const [draft, setDraft] = useState(() => timeLabel(toMinutes(value)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(timeLabel(toMinutes(value)));
  }, [value, focused]);

  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <div className="relative">
        <input
          type="text"
          value={draft}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const parsed = parseTimeInput(draft);
            if (parsed === null) {
              onValidityChange?.("Input a valid time");
            } else {
              setDraft(timeLabel(parsed));
              onValidityChange?.("");
            }
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = parseTimeInput(next);
            if (parsed === null) {
              onValidityChange?.("Input a valid time");
            } else {
              onSelect(toHHMM(parsed));
              onValidityChange?.("");
            }
          }}
          className={`${FIELD_INPUT} pr-9 ${error ? "border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-red-200/60" : ""}`}
        />
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${ariaLabel} options`}
          title="Choose a time"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
        >
          <ChevronDownIcon />
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
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
                  setDraft(timeLabel(toMinutes(opt.value)));
                  onValidityChange?.("");
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
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(editingEvent?.date || new Date().toISOString().split("T")[0]);
  const [renderPos, setRenderPos] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);
  // Details is the synchronous default for existing events. The explicit
  // flag only becomes true after the user presses Edit, avoiding a stale form
  // frame when reopening an event.
  const modalMode = editingEvent && !isEditingForm ? "details" : "form";

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

    const fallbackAnchor = clickCoords
      ? { top: clickCoords.y, left: clickCoords.x, right: clickCoords.x, bottom: clickCoords.y, width: 0, height: 0 }
      : null;
    const anchor = anchorRect ?? fallbackAnchor;

    const updatePosition = () => {
      const modalRect = { width: el.offsetWidth, height: el.offsetHeight };

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
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, modalMode, anchorRect, clickCoords, modalPosition]);

  useEffect(() => {
    if (isOpen) {
      setStartTimeError("");
      setEndTimeError("");
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

  // Reset the visual mode before closing so the next open never animates from
  // the previous form/details state.
  function closeModal() {
    setIsEditingForm(false);
    setIsOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (startTimeError || endTimeError) return;
    onSave({ title, date, budget, timeStart, timeEnd, categoryId });
    closeModal();
  }

  function handleDelete() {
    if (editingEvent) {
      onDelete(editingEvent);
      closeModal();
    }
  }

  function handleEdit() {
    setIsEditingForm(true);
  }

  // Moving the start keeps the event duration, so the end can never land
  // before the start.
  function handleStartSelect(newStart) {
    const rawDuration = toMinutes(timeEnd) - toMinutes(timeStart);
    const duration = rawDuration >= 15 ? rawDuration : 60;
    setTimeStart(newStart);
    setTimeEnd(toHHMM(Math.min(toMinutes(newStart) + duration, LAST_END)));
    setEndTimeError("");
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
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed z-50 max-h-[calc(100vh-24px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
            style={{
              top: renderPos?.top ?? MODAL_PADDING,
              left: renderPos?.left ?? MODAL_PADDING,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors"
                    style={{ backgroundColor: activeColor }}
                  />
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {modalMode === "details" ? "Event details" : editingEvent ? "Edit event" : "New event"}
                  </h2>
                </div>
                <div className="flex items-center gap-0.5">
                  {modalMode === "details" && editingEvent && (
                    <>
                      <button type="button" onClick={handleEdit} aria-label="Edit event" title="Edit event" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <FiEdit2 className="h-[17px] w-[17px]" />
                      </button>
                      <button type="button" onClick={handleDelete} aria-label="Delete event" title="Delete event" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                        <FiTrash2 className="h-[17px] w-[17px]" />
                      </button>
                    </>
                  )}
                  <button type="button" onClick={closeModal} aria-label="Close" title="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <FiX className="h-[19px] w-[19px]" />
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {modalMode === "details" && editingEvent ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-3 px-4 py-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px]" style={{ backgroundColor: activeColor }} />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{editingEvent.title || "Untitled event"}</p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {dayjs(editingEvent.date).format("dddd, MMMM D")} · {timeLabel(toMinutes(editingEvent.timeStart))} – {timeLabel(toMinutes(editingEvent.timeEnd))}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-700">
                      <p className="flex items-center gap-2.5"><FiCalendar className="h-4 w-4 shrink-0 text-slate-400" />{dayjs(editingEvent.date).format("dddd, MMMM D, YYYY")}</p>
                      <p className="flex items-center gap-2.5"><FiClock className="h-4 w-4 shrink-0 text-slate-400" /><span className="tabular-nums">{timeLabel(toMinutes(editingEvent.timeStart))} – {timeLabel(toMinutes(editingEvent.timeEnd))}</span></p>
                      <p className="flex items-center gap-2.5"><FiTag className="h-4 w-4 shrink-0 text-slate-400" />{categories.find((category) => String(category.category_id) === String(editingEvent.categoryId))?.name || "No category"}</p>
                      <p className="flex items-center gap-2.5"><FiDollarSign className="h-4 w-4 shrink-0 text-slate-400" /><span className="tabular-nums">${Number(editingEvent.budget || 0).toFixed(2)} budget</span></p>
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
                      error={startTimeError}
                      onValidityChange={setStartTimeError}
                    />
                    <span className="shrink-0 text-sm text-slate-400">–</span>
                    <TimeField
                      ariaLabel="End time"
                      value={timeEnd}
                      options={endOptions}
                      onSelect={setTimeEnd}
                      error={endTimeError}
                      onValidityChange={setEndTimeError}
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
              {modalMode !== "details" && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                {editingEvent ? (
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
                  <button
                    type="button"
                    onClick={closeModal}
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
                </div>
              </div>}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default EventModal;
