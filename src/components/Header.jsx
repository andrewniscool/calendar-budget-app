import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'
import TodayButton from './Header_stuff/TodayButton'
import DateNavigationButtons from './Header_stuff/DateNavigationButtons'

const Header = ({ viewMode, setViewMode, setSelectedDate, selectedDate }) => {
  return (
    <header className="bg-sky-400 shadow-md p-4 sticky top-0 z-[50] overflow-visible">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Budget Calendar</h1>

        {/* Left side navigation group */}
        <div className="flex items-center gap-3">
          <TodayButton setSelectedDate={setSelectedDate}>
            Today
          </TodayButton>
          <DateNavigationButtons 
            viewMode={viewMode} 
            setSelectedDate={setSelectedDate} 
            selectedDate={selectedDate} 
          />
        </div>

        {/* Right side view mode dropdown */}
        <div>
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
    </header>
  )
}

export default Header