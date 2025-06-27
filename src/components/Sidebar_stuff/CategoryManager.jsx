// ✅ Fixed CategoryManager with proper calendarId handling
import { useEffect, useState } from "react";
import {
  fetchCategories,
  createCategory,
  deleteCategory,
  deleteAllCategories
} from "../../services/categoryService";
import { HiDotsVertical } from "react-icons/hi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";
import AddCategoryModal from "./AddCategoryModal";
import "../styles/checkbox.css"; // Ensure you have the correct path to your CSS

const presetColors = [
  "#FFF689", "#F4D35E", "#FFB88A", "#FF9C5B", "#F67B45", "#FBC2C2", "#E39B99",
  "#CB7876", "#B4CFA4", "#8BA47C", "#62866C", "#A0C5E3", "#81B2D9", "#32769B",
  "#BBA6DD", "#8C7DA8", "#64557B", "#1E2136",
];

function getTextColor(bgColor) {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function CategoryDropdown({ categories, onAddClick, handleDeleteCategory, toggleVisibility, onEditClick }) {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const toggleMenu = (id) => {
    setDropdownOpen((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 w-full">
        <span className="text-sm font-medium">Categories</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddClick}
            className="text-blue-600 text-lg px-1 hover:text-blue-800"
            title="Add Category"
          >
            +
          </button>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Toggle Category List"
          >
            <FiChevronDown
              size={20}
              className={`transform transition ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          {categories.map((cat, i) => (
            <div key={cat.category_id || i} className="relative group">
              <label className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cat.visible}
                    onChange={() => toggleVisibility(i)}
                    className="ui-checkbox"
                  />
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-2xl"
                    style={{ backgroundColor: cat.color, color: getTextColor(cat.color) }}
                  >
                    {cat.name}
                  </span>
                </div>
                <button
                  onClick={() => toggleMenu(cat.category_id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiDotsVertical size={16} />
                </button>
              </label>
              {dropdownOpen === cat.category_id && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow z-10 w-24 text-sm">
                  <button
                    onClick={() => {
                      onEditClick(cat);
                      setDropdownOpen(null);
                    }}
                    className="w-full px-3 py-1 hover:bg-gray-100 text-left"
                  >
                    <MdEdit className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteCategory(cat.category_id);
                      setDropdownOpen(null);
                    }}
                    className="w-full px-3 py-1 hover:bg-gray-100 text-left text-red-500"
                  >
                    <MdDelete className="inline mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryManager({ categories, setCategories, calendarId }) {
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    console.log('calendarId before fetchCategories:', calendarId);

    if (calendarId) {
      fetchCategories(calendarId)
        .then((data) => {
          const mapped = data.map((cat) => ({ ...cat, visible: true }));
          setCategories(mapped);
        })
        .catch((err) => console.error("Error fetching categories:", err));
    }
  }, [calendarId, setCategories]);

  const toggleVisibility = (index) => {
    const updated = [...categories];
    updated[index].visible = !updated[index].visible;
    setCategories(updated);
  };

  const handleAddCategory = (categoryData) => {
    const trimmedName = categoryData.name.trim();

    if (trimmedName === "") return setError("Category name cannot be empty.");
    if (categories.length >= 10) return setError("You can only have up to 10 categories.");

    const nameExists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.category_id !== categoryData.category_id
    );
    if (nameExists) return setError("Category name already exists.");

    // If editing existing category
    if (categoryData.category_id) {
      const updatedList = categories.map((cat) =>
        cat.category_id === categoryData.category_id ? { ...cat, ...categoryData } : cat
      );
      setCategories(updatedList);
      setIsModalOpen(false);
      setEditingCategory(null);
      return;
    }

    // Creating new category - include calendarId
    createCategory({ 
      name: trimmedName, 
      color: categoryData.color,
      calendarId: calendarId 
    })
      .then((created) => {
        setCategories((prev) => [...prev, { ...created, visible: true }]);
        setError("");
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.error("Error creating category:", err);
        setError("Failed to create category.");
      });
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id)
      .then(() => setCategories((prev) => prev.filter((cat) => cat.category_id !== id)))
      .catch((err) => console.error("Error deleting category:", err));
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all categories?")) {
      try {
        await deleteAllCategories(calendarId); // pass calendarId
        setCategories([]); // clear local state
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error("Failed to clear categories:", err);
        alert("Failed to clear categories. Please try again.");
      }
    }
  };

  // Don't render if no calendarId
  if (!calendarId) {
    return <div>Loading categories...</div>;
  }

  return (
    <div>
      <CategoryDropdown
        categories={categories || []}
        handleDeleteCategory={handleDeleteCategory}
        toggleVisibility={toggleVisibility}
        onAddClick={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }}
        onEditClick={(cat) => {
          setEditingCategory(cat);
          setIsModalOpen(true);
        }}
      />

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setError("");
        }}
        onAddCategory={handleAddCategory}
        presetColors={presetColors}
        error={error}
        defaultValues={editingCategory}
      />

      <div className="pt-4 border-t mt-4">
        <button
          onClick={handleClearAll}
          className="text-red-600 text-sm font-medium hover:underline"
        >
          Clear All Categories
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded shadow-lg z-50">
          ✅ Categories cleared!
        </div>
      )}
    </div>
  );
}

export default CategoryManager;