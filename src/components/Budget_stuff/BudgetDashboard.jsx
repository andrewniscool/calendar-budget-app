import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import BudgetSummary from './BudgetSummary';
import BudgetSettings from './BudgetSettings';
import { FiSettings, FiChevronDown, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const BAR_COLORS = {
  exceeded: 'bg-red-500',
  warning: 'bg-amber-500',
  good: 'bg-emerald-500',
  none: 'bg-slate-300',
};

const BudgetDashboard = ({
  events,
  categories,
  selectedDate,
  viewMode,
  budgetLimits,
  setBudgetLimits
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Calculate current month spending for budget warnings
  const monthlySpending = useMemo(() => {
    const currentMonth = dayjs(selectedDate);
    const monthEvents = events.filter(event =>
      dayjs(event.date).isSame(currentMonth, 'month')
    );

    const categorySpending = {};
    let totalSpending = 0;

    monthEvents.forEach(event => {
      const budget = parseFloat(event.budget) || 0;
      const category = event.categoryName || 'Uncategorized';

      if (!categorySpending[category]) {
        categorySpending[category] = 0;
      }

      categorySpending[category] += budget;
      totalSpending += budget;
    });

    return { categorySpending, totalSpending };
  }, [events, selectedDate]);

  const getBudgetStatus = (spent, limit) => {
    if (!limit || limit === 0) return { status: 'none', percentage: 0 };

    const percentage = (spent / limit) * 100;

    if (percentage > 100) return { status: 'exceeded', percentage };
    if (percentage >= 80) return { status: 'warning', percentage };
    return { status: 'good', percentage };
  };

  const overallStatus = getBudgetStatus(monthlySpending.totalSpending, budgetLimits?.overall);

  const categoryAlerts = Object.entries(budgetLimits || {})
    .filter(([category]) => category !== 'overall')
    .map(([category, limit]) => {
      const spent = monthlySpending.categorySpending[category] || 0;
      return { category, limit, spent, ...getBudgetStatus(spent, limit) };
    })
    .filter((alert) => alert.status === 'warning' || alert.status === 'exceeded');

  return (
    <section>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="group -ml-1 flex items-center gap-1 rounded px-1 py-0.5"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-slate-600">
            Budget
          </span>
          <FiChevronDown
            className={`h-3 w-3 text-slate-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Budget settings"
          title="Budget settings"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <FiSettings className="h-3.5 w-3.5" />
        </button>
      </div>

      {collapsed ? (
        <div className="mt-1 px-1 text-[11px] tabular-nums text-slate-400">
          ${monthlySpending.totalSpending.toFixed(2)} spent
          {budgetLimits?.overall > 0 && ` · ${overallStatus.percentage.toFixed(0)}%`}
          {categoryAlerts.length > 0 &&
            ` · ${categoryAlerts.length} alert${categoryAlerts.length > 1 ? 's' : ''}`}
        </div>
      ) : (
        <div className="mt-2 space-y-4">
          {/* Monthly budget vs. limit */}
          {budgetLimits?.overall > 0 && (
            <div className="px-1">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold tabular-nums text-slate-900">
                  ${monthlySpending.totalSpending.toFixed(2)}
                </span>
                <span className="text-[11px] tabular-nums text-slate-400">
                  of ${budgetLimits.overall.toFixed(2)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${BAR_COLORS[overallStatus.status]}`}
                  style={{ width: `${Math.min(overallStatus.percentage, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {dayjs(selectedDate).format('MMMM YYYY')}
                </span>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    overallStatus.status === 'exceeded'
                      ? 'text-red-600'
                      : overallStatus.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                >
                  {overallStatus.status === 'exceeded'
                    ? `Over by $${(monthlySpending.totalSpending - budgetLimits.overall).toFixed(2)}`
                    : `${overallStatus.percentage.toFixed(0)}% used`}
                </span>
              </div>
            </div>
          )}

          {/* Category limit alerts */}
          {categoryAlerts.length > 0 && (
            <div className="space-y-1">
              {categoryAlerts.map((alert) => {
                const exceeded = alert.status === 'exceeded';
                return (
                  <div
                    key={alert.category}
                    className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${
                      exceeded ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                      {exceeded ? (
                        <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <FiAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{alert.category}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums">
                      ${alert.spent.toFixed(0)} / ${alert.limit.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spending for the current view period */}
          <BudgetSummary
            events={events}
            categories={categories}
            selectedDate={selectedDate}
            viewMode={viewMode}
          />
        </div>
      )}

      {/* Budget Settings Modal */}
      <BudgetSettings
        categories={categories}
        budgetLimits={budgetLimits}
        setBudgetLimits={setBudgetLimits}
        isOpen={showSettings}
        setIsOpen={setShowSettings}
      />
    </section>
  );
};

export default BudgetDashboard;
