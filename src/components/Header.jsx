import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'
import TodayButton from './Header_stuff/TodayButton'

const Header = ({ viewMode, setViewMode, setSelectedDate }) => {
  return (
    <header className="bg-sky-400 shadow-md p-4 sticky top-0 z-[50] overflow-visible">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Budget Calendar</h1>

        <div className="flex justify-end p-2">
          <TodayButton setSelectedDate={setSelectedDate}>
            Today
          </TodayButton>
        </div>
        <div className="">
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
    </header>
  )
}

export default Header