import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function BudgetSettings({ categories, budgetLimits, setBudgetLimits, isOpen, setIsOpen }) {
  const [tempLimits, setTempLimits] = useState(budgetLimits ?? {});
  const [overallBudget, setOverallBudget] = useState(tempLimits.overall ?? '');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleCategoryLimitChange = (categoryName, value) => {
    setTempLimits(prev => ({
      ...prev,
      [categoryName]: parseFloat(value) || 0
    }));
  };

  const handleSave = () => {
    const newLimits = {
      ...tempLimits,
      overall: parseFloat(overallBudget) || 0
    };
    setBudgetLimits(newLimits);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempLimits(budgetLimits ?? {});
    setOverallBudget(budgetLimits?.overall?.toString() ?? '');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Budget Settings</h2>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overall Budget */}
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={overallBudget}
                onChange={(e) => setOverallBudget(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total budget for all categories combined</p>
          </div>

          {/* Category Budgets */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Category Limits</h3>
            <div className="space-y-3">
              {categories.map(category => (
                <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                    <span className="font-medium text-gray-700">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={tempLimits[category.name] ?? ''}
                      onChange={(e) => handleCategoryLimitChange(category.name, e.target.value)}
                      placeholder="0.00"
                      className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Save Budget
            </button>
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
}

export default BudgetSettings;
