import { useState, useEffect } from "react";

const presetColors = [
  "#FFF689", // Soft Lemon
  "#F4D35E", // Golden Sunrise
  "#FFB88A", // Peach
  "#FF9C5B", // Tangerine
  "#F67B45", // Warm Coral
  "#FBC2C2", // Blush
  "#E39B99", // Rosewood
  "#CB7876", // Clay
  "#B4CFA4", // Soft Sage
  "#8BA47C", // Moss Green
  "#62866C", // Forest Shadow
  "#A0C5E3", // Ocean Fog
  "#81B2D9", // Coastal Blue
  "#32769B", // Deep Blue
  "#BBA6DD", // Lavender Mist
  "#8C7DA8", // Dusty Violet
  "#64557B", // Twilight Plum
  "#1E2136", // Midnight
];

function getTextColor(bgColor){
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}
function Sidebar({ categories, setCategories, onAddEventClick }) {
  
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [showToast, setShowToast] = useState(false);


  const [error, setError] = useState(""); // For validation messages


  function toggleVisibility(index) {
    const updated = [...categories];
    updated[index].visible = !updated[index].visible;
    setCategories(updated);
  }

  function handleAddCategory() {
    const trimmedName = newCategoryName.trim();
  
    if (trimmedName === "") {
      setError("Category name cannot be empty.");
      return;
    }
  
    if (categories.length >= 10) {
      setError("You can only have up to 10 categories.");
      return;
    }
  
    const nameExists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
  
    if (nameExists) {
      setError("Category name already exists.");
      return;
    }
  
    const newCat = {
      name: trimmedName,
      color: selectedColor,
      visible: true,
    };
  
    setCategories([...categories, newCat]);
    setNewCategoryName("");
    setSelectedColor(presetColors[0]);
    setError(""); // clear error
  }
  
  return (
    <div className="w-64 bg-white shadow-md p-4 space-y-6 max-h-screen overflow-y-auto sticky top-0">
    {/* Monthly Budget Section */}
    <div>
      <h3 className="text-lg font-bold mb-2">Monthly Budget</h3>
      <p className="text-sm text-gray-500 mb-4">Coming soon...</p>

      <button
        onClick={onAddEventClick}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 transition"
      >
        + Add Event
      </button>
    </div>

      {/* Category Manager Section */}
      <div>
        <h3 className="text-lg font-bold mb-2">Categories</h3>
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <label key={i} className="flex items-center gap-2 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={cat.visible}
                onChange={() => toggleVisibility(i)}
              />

              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: cat.color, color: getTextColor(cat.color) }}
              >
                {cat.name}
              </span>
              <button
                onClick={() => {
                  const updated = categories.filter((_, index) => index !== i);
                  setCategories(updated);
                }}
                className="ml-auto text-red-500 hover:text-red-700 text-xs font-bold opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                ×
              </button>

            </label>
          ))}
        </div>

        {/* Add Category UI */}
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Add Category</h4>
          {error && (
            <p className="text-red-600 text-xs font-medium mb-2">{error}</p>
          )}

          <input
            type="text"
            placeholder="Name (E.g. Food, Shopping, Fun)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-full mb-2 p-1 border rounded-md text-sm"
          />

          <div className="flex gap-2 flex-wrap mb-2">
          {presetColors.map((color) => (
            <button
              key={color}
              title={color} // 🌟 tooltip
              className={`w-6 h-6 rounded-full border-2 transition ${
                selectedColor === color ? "border-black scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.preventDefault();
                setSelectedColor(color);
              }}
            />
          ))}
          </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-700"
            onClick={handleAddCategory}
          >
            Add
          </button>

          {newCategoryName.trim() && (
            <div
              className="px-3 py-1 rounded-full text-sm font-medium shadow-sm border"
              style={{
                backgroundColor: selectedColor,
                color: getTextColor(selectedColor),
                borderColor: getTextColor(selectedColor) + "30",
              }}
            >
              {newCategoryName}
            </div>
          )}
        </div>
          <div className="pt-4 border-t mt-4">
            <button
              onClick={() => {
                const confirmed = window.confirm("Are you sure you want to clear all categories? This action cannot be undone.");
                if (confirmed) {
                  setCategories([]);
                  localStorage.removeItem("categories");
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }
              }}
              className="text-red-600 text-sm font-medium hover:underline"
            >
              Clear All Categories
            </button>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded shadow-lg z-50">
          ✅ Categories cleared!
        </div>
      )}

    </div>
  );
}

export default Sidebar;
