import React from "react";
import { HexColorPicker } from "react-colorful";

export default function ColorPickerPanel({
  presetColors,
  customColors,
  pendingColor,
  setPendingColor,
  onBack,
  onUseColor,
}) {
  return (
    <div className="w-1/2 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Choose Custom Color</h2>

      <div className="rounded-lg shadow-inner p-2 bg-white" style={{ height: "70%" }}>
        <HexColorPicker
          color={pendingColor || "#ffffff"}
          onChange={setPendingColor}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="flex items-center justify-between space-x-4">
        {/* Left side: Hex color text and small color box */}
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-600 mb-0">
            {pendingColor?.toUpperCase()}
          </p>
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: pendingColor || "#ffffff" }}
          />
        </div>

        {/* Right side: Buttons */}
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            onClick={onUseColor}
          >
            Save Color
          </button>
        </div>
      </div>
    </div>
  );
}
