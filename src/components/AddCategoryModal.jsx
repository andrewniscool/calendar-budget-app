// ✅ Updated AddCategoryModal to support both Add and Edit modes
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  presetColors,
  error,
  defaultValues = null,
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isEditing = Boolean(defaultValues);
  const [name, setName] = useState(defaultValues?.name || "");
  const [color, setColor] = useState(defaultValues?.color || presetColors[0]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(defaultValues?.name || "");
      setColor(defaultValues?.color || presetColors[0]);
      setLocalError("");
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
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        tabIndex={-1}
      >
        <div
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
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
            <p className="text-red-600 text-sm mb-2">{localError || error}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c ? "border-black scale-110" : "border-gray-300 hover:scale-105"
                    }`}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {name.trim() && (
              <div className="mb-4">
                <span className="text-xs text-gray-600 block mb-1">Preview:</span>
                <span
                  className="text-xs font-medium px-3 py-1 rounded-2xl inline-block"
                  style={{ backgroundColor: color, color: getTextColor(color) }}
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
