import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ColorPickerPanel from "./ColorPickerPanel"; // import here

function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  presetColors,
  error,
  defaultValues = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(defaultValues?.name || "");
  const [color, setColor] = useState(defaultValues?.color || presetColors[0]);
  const [localError, setLocalError] = useState("");
  const [customColors, setCustomColors] = useState([]);
  const [pendingColor, setPendingColor] = useState("");
  const [view, setView] = useState("main");

  const isEditing = Boolean(defaultValues);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValues?.name || "");
      setColor(defaultValues?.color || presetColors[0]);
      setLocalError("");
      setView("main");
    }
  }, [isOpen, presetColors, defaultValues]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [isOpen]);

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
    <>
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-30"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        tabIndex={-1}
      >
        <div
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sliding container for main and color picker views */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: "200%",
              transform:
                view === "main" ? "translateX(0%)" : "translateX(-52%)",
            }}
          >
            {/* MAIN FORM VIEW */}
            <div className="w-1/2 shrink-0 px-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {isEditing ? "Edit Category" : "Add Category"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {(localError || error) && (
                <p className="text-red-600 text-sm">{localError || error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category name
                  </label>
                  <input
                    className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[...presetColors, ...customColors].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c
                            ? "border-black scale-110"
                            : "border-gray-300 hover:scale-105"
                        }`}
                        title={c}
                      />
                    ))}

                    <div className="relative group">
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-600 text-base font-bold cursor-pointer hover:border-black transition-transform"
                        onClick={() => setView("colorPicker")}
                      >
                        +
                      </button>

                      <span className="whitespace-nowrap absolute -top--10 left-1/2 transform -translate-x-1/2 px-5 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none z-10">
                        Add custom color
                      </span>
                    </div>
                  </div>
                </div>

                {name.trim() && (
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">
                      Preview:
                    </span>
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-2xl inline-block"
                      style={{
                        backgroundColor: color,
                        color: getTextColor(color),
                      }}
                    >
                      {name.trim()}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                  >
                    {isEditing ? "Save" : "Add"}
                  </button>
                </div>
              </form>
            </div>

            <div className="w-5/10 shrink-0 px-5 space-y-4"></div>

            {/* COLOR PICKER VIEW */}
            <ColorPickerPanel
              presetColors={presetColors}
              customColors={customColors}
              pendingColor={pendingColor}
              setPendingColor={setPendingColor}
              onBack={() => setView("main")}
              onUseColor={() => {
                if (
                  pendingColor &&
                  ![...presetColors, ...customColors].includes(pendingColor)
                ) {
                  setCustomColors((prev) => [...prev, pendingColor]);
                  setColor(pendingColor);
                  setPendingColor("");
                }
                setView("main");
              }}
            />
          </div>
        </div>
      </div>
    </>,
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
