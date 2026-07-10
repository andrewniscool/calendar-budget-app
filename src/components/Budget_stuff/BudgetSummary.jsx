import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';

const BudgetSummary = ({ events, categories, selectedDate, viewMode }) => {
  const [showDetails, setShowDetails] = useState(false);

  const budgetData = useMemo(() => {
    // Filter events based on current view period
    const filteredEvents = events.filter(event => {
      const eventDate = dayjs(event.date);
      const current = dayjs(selectedDate);

      switch (viewMode) {
        case 'day':
          return eventDate.isSame(current, 'day');
        case 'week':
          return eventDate.isSame(current, 'week');
        case 'month':
          return eventDate.isSame(current, 'month');
        case 'year':
          return eventDate.isSame(current, 'year');
        default:
          return true;
      }
    });

    // Calculate totals by category
    const categoryTotals = {};
    let totalSpending = 0;

    filteredEvents.forEach(event => {
      const budget = parseFloat(event.budget) || 0;
      const category = event.categoryName || 'Uncategorized';

      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          total: 0,
          events: [],
          color: event.categoryColor || categories.find(c => c.name === category)?.color || '#94a3b8'
        };
      }

      categoryTotals[category].total += budget;
      categoryTotals[category].events.push(event);
      totalSpending += budget;
    });

    return {
      categoryTotals,
      totalSpending,
      eventCount: filteredEvents.length
    };
  }, [events, selectedDate, viewMode, categories]);

  const getPeriodLabel = () => {
    const current = dayjs(selectedDate);
    switch (viewMode) {
      case 'day':
        return current.format('MMMM D, YYYY');
      case 'week': {
        const startOfWeek = current.startOf('week');
        const endOfWeek = current.endOf('week');
        return `${startOfWeek.format('MMM D')} – ${endOfWeek.format('MMM D, YYYY')}`;
      }
      case 'month':
        return current.format('MMMM YYYY');
      case 'year':
        return current.format('YYYY');
      default:
        return '';
    }
  };

  const sortedCategories = Object.entries(budgetData.categoryTotals).sort(
    ([, a], [, b]) => b.total - a.total
  );

  return (
    <div className="px-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">{getPeriodLabel()}</span>
        <span className="text-[11px] tabular-nums text-slate-400">
          {budgetData.eventCount} event{budgetData.eventCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
        ${budgetData.totalSpending.toFixed(2)}
      </div>

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {sortedCategories.map(([categoryName, data]) => (
            <div
              key={categoryName}
              className="-mx-1 flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-slate-50"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: data.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                {categoryName}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                {data.events.length}
              </span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-slate-900">
                ${data.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {budgetData.totalSpending === 0 && (
        <div className="py-2 text-xs text-slate-400">No expenses for this period</div>
      )}

      {budgetData.eventCount > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-700"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      )}

      {/* Detailed event list */}
      {showDetails && (
        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {Object.entries(budgetData.categoryTotals)
            .flatMap(([categoryName, data]) =>
              data.events.map(event => ({
                ...event,
                categoryName,
                categoryColor: data.color
              }))
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-r-md border-l-2 py-1 pl-2 pr-1 transition-colors hover:bg-slate-50"
                style={{ borderLeftColor: event.categoryColor }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-700">{event.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {dayjs(event.date).format('MMM D')} · {event.timeStart}–{event.timeEnd}
                  </div>
                </div>
                <div className="shrink-0 text-xs font-medium tabular-nums text-slate-900">
                  ${parseFloat(event.budget || 0).toFixed(2)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;
