import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";

function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  presetColors,
  error,
  defaultValues = null,
  anchorRect = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(defaultValues?.name || "");
  const [color, setColor] = useState(defaultValues?.color || presetColors[0]);
  const [localError, setLocalError] = useState("");
  const [position, setPosition] = useState(null);
  const popoverRef = useRef(null);

  const isEditing = Boolean(defaultValues);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValues?.name || "");
      setColor(defaultValues?.color || presetColors[0]);
      setLocalError("");
    }
  }, [isOpen, presetColors, defaultValues]);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRect) return;
    const gap = 8;
    const padding = 12;
    const updatePosition = () => {
      const measured = popoverRef.current?.getBoundingClientRect();
      const width = measured?.width || 288;
      const height = measured?.height || 320;
      const maxLeft = Math.max(padding, window.innerWidth - width - padding);
      const maxTop = Math.max(padding, window.innerHeight - height - padding);

      // Place it to the right with aligned top edges, flip horizontally when
      // needed, then clamp both axes so the whole popover stays visible.
      const rightSideLeft = anchorRect.right + gap;
      const preferredLeft = rightSideLeft + width <= window.innerWidth - padding
        ? rightSideLeft
        : anchorRect.left - width - gap;
      setPosition({
        top: Math.min(Math.max(anchorRect.top, padding), maxTop),
        left: Math.min(Math.max(preferredLeft, padding), maxLeft),
      });
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (popoverRef.current) observer.observe(popoverRef.current);
    window.addEventListener("resize", updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, anchorRect]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === "") {
      setLocalError("Name required");
      return;
    }
    onAddCategory({ ...defaultValues, name: name.trim(), color });
  };

  if (!isOpen || !mounted) return null;
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          />
          <motion.div
            ref={popoverRef}
            className="fixed z-50 max-h-[calc(100vh-24px)] w-[min(288px,calc(100vw-24px))] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
            style={{ top: position?.top ?? 12, left: position?.left ?? 12 }}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="space-y-3 px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-900">
                  {isEditing ? "Edit Category" : "Add Category"}
                </h2>
                <button
                  onClick={onClose}
                  title="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              {(localError || error) && (
                <p className="text-red-600 text-sm">{localError || error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Category name
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                    placeholder="Enter category name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setLocalError("");
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-5 w-5 rounded-full transition-shadow ${
                          color === c
                            ? "ring-2 ring-offset-2 ring-slate-900"
                            : "ring-1 ring-slate-200 hover:ring-slate-400"
                        }`}
                        title={c}
                      />
                    ))}

                  </div>
                </div>

                {name.trim() && (
                  <div>
                    <span className="mb-1 block text-[11px] text-slate-500">
                      Preview:
                    </span>
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: color,
                        color: getTextColor(color),
                      }}
                    >
                      {name.trim()}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
                  >
                    {isEditing ? "Save" : "Add"}
                  </button>
                </div>
              </form>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    modalRoot
  );
}

function getTextColor(bgColor) {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

export default AddCategoryModal;
