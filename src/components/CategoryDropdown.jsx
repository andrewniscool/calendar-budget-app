import { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { MdDelete, MdErrorOutline } from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";

function CategoryDropdown({ categories, handleDeleteCategory, toggleVisibility, error }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-1">
        <span className="text-sm font-medium">Categories</span>

        <div className="flex items-center gap-2 ml-auto">
          {error && <MdErrorOutline className="text-red-600" title={error} />}
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="hover:bg-gray-200 p-1 rounded"
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
              className="relative group flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer"
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

export default CategoryDropdown;
