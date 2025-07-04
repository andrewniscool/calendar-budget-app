import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import BudgetSummary from './BudgetSummary';
import BudgetSettings from './BudgetSettings';
import { FiSettings, FiChevronDown, FiChevronRight, FiChevronUp } from "react-icons/fi";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overall: true,
    categories: false,
    summary: true
  });

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const overallStatus = getBudgetStatus(monthlySpending.totalSpending, budgetLimits?.overall);

  // Count warnings for collapsed state
  const warningCount = Object.entries(budgetLimits || {})
    .filter(([category]) => category !== 'overall')
    .filter(([category, limit]) => {
      const spent = monthlySpending.categorySpending[category] || 0;
      const status = getBudgetStatus(spent, limit);
      return status.status !== 'good' && status.status !== 'none';
    }).length;

  return (
    <div className="">
      {/* Sidebar Header - Always Visible */}
      <div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-between py-2 px-0 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-bold text-gray-800 p-1">Budget Overview</h1>
            {!sidebarCollapsed && overallStatus.status !== 'good' && overallStatus.status !== 'none' && (
              <div className="flex items-center gap-1">
                {getStatusIcon(overallStatus.status)}
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Alert
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!sidebarCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                className="settings-btn"
              >
                <FiSettings />
              </button>
            )}
            {sidebarCollapsed ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
          </div>
        </button>
        
        {/* Collapsed State Summary */}
        {sidebarCollapsed && (
          <div className="pb-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${monthlySpending.totalSpending.toFixed(2)} spent</span>
              {budgetLimits?.overall && (
                <span className={`px-2 py-1 rounded text-xs ${
                  overallStatus.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                  overallStatus.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {overallStatus.percentage.toFixed(0)}%
                </span>
              )}
            </div>
            {warningCount > 0 && (
              <div className="mt-2 text-xs text-orange-600">
                {warningCount} category warning{warningCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Content - Collapsible */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        sidebarCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
      }`}>
        <div className="space-y-4">
          {/* Overall Budget Status - Collapsible */}
          {budgetLimits?.overall > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('overall')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Monthly Budget Status</span>
                  {getStatusIcon(overallStatus.status)}
                  <span className="text-sm text-gray-600">
                    ({overallStatus.percentage.toFixed(1)}% used)
                  </span>
                </div>
                {expandedSections.overall ? <FiChevronDown /> : <FiChevronRight />}
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.overall ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className={`p-4 ${getStatusColor(overallStatus.status)}`}>
                  <div className="items-center justify-between mb-2">
                    <h3 className="font-semibold mb-2">
                      {dayjs(selectedDate).format('MMMM YYYY')}
                    </h3>
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
              </div>
            </div>
          )}

          {/* Category Budget Warnings - Collapsible */}
          {Object.keys(budgetLimits || {}).length > 1 && (
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('categories')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Category Alerts</span>
                  <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {warningCount} warnings
                  </span>
                </div>
                {expandedSections.categories ? <FiChevronDown /> : <FiChevronRight />}
              </button>

              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.categories ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="p-4 space-y-3">
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
              </div>
            </div>
          )}

          {/* Budget Summary - Collapsible */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold">Budget Summary</span>
              {expandedSections.summary ? <FiChevronDown /> : <FiChevronRight />}
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              expandedSections.summary ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4">
                <BudgetSummary
                  events={events}
                  categories={categories}
                  selectedDate={selectedDate}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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