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
      const category = event.category || 'Uncategorized';
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          total: 0,
          events: [],
          color: categories.find(c => c.name === category)?.color || '#e0e0e0'
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
        return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
      }
      case 'month':
        return current.format('MMMM YYYY');
      case 'year':
        return current.format('YYYY');
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-gray-800">
          Budget Summary - 
        </h2>
        <h2 className="text-[16px] font-semibold text-gray-800">
          {getPeriodLabel()}
        </h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Total Spending */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm font-bold">Total Spending:</span>
          <span className="text-sm text-gray-500 mt-1">{budgetData.eventCount} events</span>
        </div>
          <span className="text-2xl font-bold text-gray-800">
            ${budgetData.totalSpending.toFixed(2)}
          </span>

      </div>

      {/* Category Breakdown */}
      {Object.keys(budgetData.categoryTotals).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-700 mb-2">By Category</h3>
          {Object.entries(budgetData.categoryTotals)
            .sort(([,a], [,b]) => b.total - a.total)
            .map(([categoryName, data]) => (
              <div key={categoryName} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: data.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {categoryName}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({data.events.length} events)
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  ${data.total.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Detailed Event List */}
      {showDetails && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Event Details</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
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
                <div key={event.id} className="flex items-center justify-between p-2 text-sm border-l-4" 
                     style={{ borderLeftColor: event.categoryColor }}>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{event.title}</div>
                    <div className="text-gray-500 text-xs">
                      {dayjs(event.date).format('MMM D')} • {event.timeStart} - {event.timeEnd}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      ${parseFloat(event.budget || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.categoryName}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {budgetData.totalSpending === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg">💰</div>
          <div className="mt-2">No expenses for this period</div>
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;