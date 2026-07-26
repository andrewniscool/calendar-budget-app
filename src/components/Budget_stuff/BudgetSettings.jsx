import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function limitsByCategory(limits) {
  return Object.fromEntries(
    (limits?.categories || []).map(({ categoryId, amount }) => [String(categoryId), amount])
  );
}

function BudgetSettings({
  categories,
  budgetLimits,
  onSaveBudgetLimits,
  currency,
  isOpen,
  setIsOpen,
}) {
  const [categoryLimits, setCategoryLimits] = useState(() => limitsByCategory(budgetLimits));
  const [overallBudget, setOverallBudget] = useState(
    budgetLimits?.overall?.toString() ?? ""
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setCategoryLimits(limitsByCategory(budgetLimits));
    setOverallBudget(budgetLimits?.overall?.toString() ?? "");
    setError("");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [budgetLimits, isOpen]);

  function handleCategoryLimitChange(categoryId, value) {
    setCategoryLimits((current) => ({ ...current, [String(categoryId)]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSaveBudgetLimits({
        period: budgetLimits.period,
        overall: overallBudget === "" ? 0 : Number(overallBudget),
        categories: categories.map((category) => ({
          categoryId: category.category_id,
          amount: categoryLimits[String(category.category_id)] === ""
            || categoryLimits[String(category.category_id)] === undefined
            ? 0
            : Number(categoryLimits[String(category.category_id)]),
        })),
      });
      setIsOpen(false);
    } catch (saveError) {
      setError(saveError.message || "Failed to save budget limits.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setIsOpen(false);
  }

  if (!isOpen) return null;
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={handleCancel} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Budget settings</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {budgetLimits.period} · {currency}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close budget settings"
              className="flex h-7 w-7 items-center justify-center rounded-md text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="mb-5">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Overall monthly budget
            </label>
            <input
              type="number"
              value={overallBudget}
              onChange={(event) => setOverallBudget(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Shared category limits
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between gap-2 rounded-md px-1 py-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate text-sm font-medium text-slate-700">
                      {category.name}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={categoryLimits[String(category.category_id)] ?? ""}
                    onChange={(event) =>
                      handleCategoryLimitChange(category.category_id, event.target.value)}
                    placeholder="0.00"
                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-right text-sm tabular-nums text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                    step="0.01"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save budget"}
            </button>
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
}

export default BudgetSettings;
