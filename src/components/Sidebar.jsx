import CategoryManager from "./CategoryManager";

function Sidebar({ categories, setCategories, onAddEventClick }) {
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
      <CategoryManager
        categories={categories}
        setCategories={setCategories}
      />
    </div>
  );
}

export default Sidebar;
