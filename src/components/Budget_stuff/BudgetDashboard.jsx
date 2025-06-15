import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import BudgetSummary from './BudgetSummary';
import BudgetSettings from './BudgetSettings';
import { FiSettings } from "react-icons/fi";
  import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';



const BudgetDashboard = ({ 
  events, 
  categories, 
  selectedDate, 
  viewMode,
  budgetLimits,
  setBudgetLimits 
}) => {
  const [showSettings, setShowSettings] = useState(false);

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
      const category = event.category || 'Uncategorized';
      
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
    // if (percentage >= 60) return { status: 'caution', percentage };
    return { status: 'good', percentage };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };


const getStatusIcon = (status) => {
  switch (status) {
    case 'exceeded':
      return <FiAlertCircle className="w-5 h-5 text-red-500" title="Exceeded" />;
    case 'warning':
      return <FiAlertTriangle className="w-5 h-5 text-yellow-500" title="Warning" />;
    case 'good':
      return <FiCheckCircle className="w-5 h-5 text-green-500" title="Good" />;
    default:
      return null;
  }
};


  const overallStatus = getBudgetStatus(monthlySpending.totalSpending, budgetLimits?.overall);

  return (
    <div className="space-y-4">
      {/* Header with Settings Button */}
      <div className="flex items-center justify-between py-2 px-0">
        <h1 className="text-[18px] font-bold text-gray-800">Budget Overview</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="settings-btn"
        >
          <FiSettings />
        </button>
      </div>

      {/* Overall Budget Status */}
      {budgetLimits?.overall > 0 && (
        <div className={`p-4 rounded-lg border ${getStatusColor(overallStatus.status)}`}>
          <div className="items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                Monthly Budget - {dayjs(selectedDate).format('MMMM YYYY')}
              </h3>
              {getStatusIcon(overallStatus.status)}
            </div>
            <span className="text-sm font-medium">
              {overallStatus.percentage.toFixed(1)}% used
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Spent: ${monthlySpending.totalSpending.toFixed(2)}</span>
            <span>Budget: ${budgetLimits.overall.toFixed(2)}</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                overallStatus.status === 'exceeded' ? 'bg-red-500' :
                overallStatus.status === 'warning' ? 'bg-orange-500' :
                overallStatus.status === 'caution' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(overallStatus.percentage, 100)}%` }}
            ></div>
          </div>
          
          {overallStatus.status === 'exceeded' && (
            <p className="text-sm mt-2">
              You've exceeded your monthly budget by ${(monthlySpending.totalSpending - budgetLimits.overall).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Category Budget Warnings */}
      {Object.keys(budgetLimits || {}).length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(budgetLimits)
            .filter(([category]) => category !== 'overall')
            .map(([category, limit]) => {
              const spent = monthlySpending.categorySpending[category] || 0;
              const status = getBudgetStatus(spent, limit);
              
              if (status.status === 'good' || status.status === 'none') return null;
              
              return (
                <div key={category} className={`p-3 rounded-lg border ${getStatusColor(status.status)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status.status)}
                    <span className="font-medium text-sm">{category}</span>
                  </div>
                  <div className="text-xs">
                    ${spent.toFixed(2)} / ${limit.toFixed(2)} ({status.percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Budget Summary Component */}
      <BudgetSummary
        events={events}
        categories={categories}
        selectedDate={selectedDate}
        viewMode={viewMode}
      />

      {/* Budget Settings Modal */}
      <BudgetSettings
        categories={categories}
        budgetLimits={budgetLimits}
        setBudgetLimits={setBudgetLimits}
        isOpen={showSettings}
        setIsOpen={setShowSettings}
      />
    </div>
  );
};

export default BudgetDashboard;