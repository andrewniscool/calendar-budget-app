import React, { useState } from "react";

function AddCategoryModal({ isOpen, onClose, onAddCategory, presetColors }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(presetColors[0]);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (name.trim() === "") {
      setError("Name required");
      return;
    }

    onAddCategory({ name: name.trim(), color });
    setName("");
    setColor(presetColors[0]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Category</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <input
          className="w-full border p-2 mb-3 rounded-md"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {presetColors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c ? "border-black scale-110" : "border-transparent"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCategoryModal;