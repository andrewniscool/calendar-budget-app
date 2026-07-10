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
      <div className="fixed inset-0 bg-slate-900/30 z-40" onClick={handleCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-slate-900">Budget Settings</h2>
            <button onClick={handleCancel} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overall Budget */}
          <div className="mb-5">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overall monthly budget</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                value={overallBudget}
                onChange={(e) => setOverallBudget(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-200 py-2 pl-6 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                step="0.01"
                min="0"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">Total budget for all categories combined</p>
          </div>

          {/* Category Budgets */}
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Category limits</h3>
            <div className="space-y-1">
              {categories.map(category => (
                <div key={category.name} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: category.color }}></span>
                    <span className="truncate text-sm font-medium text-slate-700">{category.name}</span>
                  </div>
                  <div className="relative shrink-0">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      value={tempLimits[category.name] ?? ''}
                      onChange={(e) => handleCategoryLimitChange(category.name, e.target.value)}
                      placeholder="0.00"
                      className="w-24 rounded-md border border-slate-200 py-1 pl-5 pr-2 text-right text-sm tabular-nums text-slate-900 transition-colors focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
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
              className="flex-1 px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700 font-medium shadow-sm transition-colors duration-150"
            >
              Save budget
            </button>
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
}

export default BudgetSettings;
