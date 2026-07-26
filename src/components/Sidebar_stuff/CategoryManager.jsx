import { useEffect, useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory
} from "../../services/categoryService";
import { HiDotsVertical } from "react-icons/hi";
import { MdEdit, MdDelete } from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";
import AddCategoryModal from "./AddCategoryModal";
import "../styles/checkbox.css";

const presetColors = [
  "#FFF689", "#F4D35E", "#FFB88A", "#FF9C5B", "#F67B45", "#FBC2C2", "#E39B99",
  "#CB7876", "#B4CFA4", "#8BA47C", "#62866C", "#A0C5E3", "#81B2D9", "#32769B",
  "#BBA6DD", "#8C7DA8", "#64557B", "#1E2136",
];

function CategoryList({ categories, onAddClick, handleDeleteCategory, onEditClick }) {
  const [open, setOpen] = useState(true);
  const [menuFor, setMenuFor] = useState(null);

  useEffect(() => {
    if (menuFor === null) return;
    const close = () => setMenuFor(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuFor]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="group -ml-1 flex items-center gap-1 rounded px-1 py-0.5"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-slate-600">
            Categories
          </span>
          <FiChevronDown
            className={`h-3 w-3 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </button>
        <button
          onClick={onAddClick}
          title="Add category"
          aria-label="Add category"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-1.5 space-y-0.5">
          {categories.length === 0 && (
            <div className="px-1 py-1.5 text-xs text-slate-400">No categories yet</div>
          )}
          {categories.map((cat, i) => (
            <div
              key={cat.category_id || i}
              className="group relative -mx-1 flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-slate-200/60"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="min-w-0 truncate text-xs font-medium text-slate-700">
                  {cat.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuFor((prev) => (prev === cat.category_id ? null : cat.category_id));
                }}
                aria-label={`Options for ${cat.name}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:text-slate-600 focus:opacity-100 group-hover:opacity-100"
              >
                <HiDotsVertical size={13} />
              </button>
              {menuFor === cat.category_id && (
                <div className="absolute right-0 top-full z-20 mt-0.5 w-32 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={(e) => {
                      onEditClick(cat, e);
                      setMenuFor(null);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <MdEdit className="h-3.5 w-3.5 text-slate-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteCategory(cat.category_id);
                      setMenuFor(null);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <MdDelete className="h-3.5 w-3.5" />
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

function CategoryManager({ categories, setCategories }) {
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalAnchorRect, setModalAnchorRect] = useState(null);

  const handleAddCategory = (categoryData) => {
    const trimmedName = categoryData.name.trim();

    if (trimmedName === "") return setError("Category name cannot be empty.");
    const nameExists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.category_id !== categoryData.category_id
    );
    if (nameExists) return setError("Category name already exists.");

    // If editing existing category
    if (categoryData.category_id) {
      updateCategory(categoryData.category_id, {
        name: trimmedName,
        color: categoryData.color,
      })
        .then((updatedCategory) => {
          const updatedList = categories.map((cat) =>
            cat.category_id === categoryData.category_id
              ? { ...cat, ...updatedCategory }
              : cat
          );
          setCategories(updatedList);
          setError("");
          setIsModalOpen(false);
          setEditingCategory(null);
          setModalAnchorRect(null);
        })
        .catch((err) => {
          console.error("Error updating category:", err);
          setError("Failed to update category.");
        });
      return;
    }

    createCategory({
      name: trimmedName,
      color: categoryData.color,
    })
      .then((created) => {
        setCategories((prev) => [...prev, { ...created, visible: true }]);
        setError("");
        setIsModalOpen(false);
        setModalAnchorRect(null);
      })
      .catch((err) => {
        console.error("Error creating category:", err);
        setError("Failed to create category.");
      });
  };

  const handleDeleteCategory = (id) => {
    const category = categories.find((item) => item.category_id === id);
    if (!window.confirm(
      `Delete "${category?.name || "this category"}"? It will be removed from events and recurring events across all calendars, and its saved limit will be deleted.`
    )) return;
    deleteCategory(id)
      .then(() => setCategories((prev) => prev.filter((cat) => cat.category_id !== id)))
      .catch((err) => {
        console.error("Failed to clear categories:", err);
        setError(err.message || "Failed to delete category.");
      });
  };

  return (
    <div>
      <CategoryList
        categories={categories || []}
        handleDeleteCategory={handleDeleteCategory}
        onAddClick={(event) => {
          setEditingCategory(null);
          setModalAnchorRect(event?.currentTarget?.getBoundingClientRect() ?? null);
          setIsModalOpen(true);
        }}
        onEditClick={(cat, event) => {
          setEditingCategory(cat);
          setModalAnchorRect(event?.currentTarget?.getBoundingClientRect() ?? null);
          setIsModalOpen(true);
        }}
      />

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setModalAnchorRect(null);
          setError("");
        }}
        onAddCategory={handleAddCategory}
        presetColors={presetColors}
        error={error}
        defaultValues={editingCategory}
        anchorRect={modalAnchorRect}
      />
    </div>
  );
}

export default CategoryManager;
