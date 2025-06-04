import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'

const Header = ({ viewMode, setViewMode }) => {
  return (
    <header className="bg-sky-400 shadow-md p-4 sticky top-0 z-[50] overflow-visible">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Budget Calendar</h1>

        <div className="relative z-[9999]">
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
    </header>
  )
}

export default Header
