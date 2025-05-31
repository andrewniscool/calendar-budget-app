import { useEffect, useState, useRef } from "react";
import {
  fetchCategories,
  createCategory,
  deleteCategory,
} from "../services/categoryService";
import { HiDotsVertical } from "react-icons/hi";
import { MdDelete, MdErrorOutline } from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";
import AddCategoryModal from "./AddCategoryModal";

const presetColors = [  
  "#FFF689", "#F4D35E", "#FFB88A", "#FF9C5B", "#F67B45", "#FBC2C2", "#E39B99",
  "#CB7876", "#B4CFA4", "#8BA47C", "#62866C", "#A0C5E3", "#81B2D9", "#32769B",
  "#BBA6DD", "#8C7DA8", "#64557B", "#1E2136"
];

function CategoryDropdown({ categories, onAddClick, handleDeleteCategory, toggleVisibility }) {
  const [open, setOpen] = useState(false);
  
  const handleAddClick = () => {
    if (onAddClick) onAddClick();
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 w-full">
        <span className="text-sm font-medium">Categories</span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleAddClick}
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
            <label
              key={cat.category_id || i}
              className="relative group flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cat.visible}
                  onChange={() => toggleVisibility(i)}
                />
                <span
                  className="text-xs font-medium px-3 py-1 rounded-2xl"
                  style={{
                    backgroundColor: cat.color,
                    color: getTextColor(cat.color),
                    border: "none",
                  }}
                >
                  {cat.name}
                </span>
              </div>
              <MoreMenu onDelete={() => handleDeleteCategory(cat.category_id)} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreMenu({ onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 hover:bg-gray-100 rounded-full"
        title="More options"
      >
        <HiDotsVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            <MdDelete size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function getTextColor(bgColor) {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function CategoryManager({ categories, setCategories }) {
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        const mapped = data.map((cat) => ({ ...cat, visible: true }));
        setCategories(mapped);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, [setCategories]);

  const toggleVisibility = (index) => {
    const updated = [...categories];
    updated[index].visible = !updated[index].visible;
    setCategories(updated);
  };

  const handleAddCategory = (categoryData) => {
    const trimmedName = categoryData.name.trim();

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
      color: categoryData.color,
    };

    createCategory(newCat)
      .then((created) => {
        setCategories((prev) => [...prev, { ...created, visible: true }]);
        setError("");
        setIsModalOpen(false); // Close modal on success
      })
      .catch(() => {
        setError("Failed to create category.");
      });
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id)
      .then(() => {
        setCategories((prev) => prev.filter((cat) => cat.category_id !== id));
      })
      .catch((err) => {
        console.error("Error deleting category:", err);
      });
  };

  const handleClearAll = () => {
    const confirmed = window.confirm("Clear all categories?");
    if (!confirmed) return;

    setCategories([]);
    localStorage.removeItem("categories");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div>
      <CategoryDropdown
        categories={categories}
        handleDeleteCategory={handleDeleteCategory}
        toggleVisibility={toggleVisibility}
        onAddClick={() => setIsModalOpen(true)}
      />
      
      <AddCategoryModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(""); // Clear any errors when closing
        }}
        onAddCategory={handleAddCategory}
        presetColors={presetColors}
        error={error}
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