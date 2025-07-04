import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'
import TodayButton from './Header_stuff/TodayButton'
import DateNavigationButtons from './Header_stuff/DateNavigationButtons'
import { CgProfile } from "react-icons/cg";
import ProfilePopupMenu from './Header_stuff/ProfilePopupMenu';


const Header = ({ viewMode, setViewMode, setSelectedDate, selectedDate, setIsSidebarOpen }) => {
  return (
    <header className="bg-sky-400 shadow-md p-4 sticky top-0 z-[50] overflow-visible">
      <div className="flex gap-10">
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="p-2 rounded-md hover:bg-blue-400 transition"
          title="Toggle Sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-black">Spendary</h1>

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
        <div justify-right className="ml-auto flex items-center">
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        <div className="pr-4" title="Profile">
          {/* <CgProfile /> */}
          <ProfilePopupMenu />
        </div>

      </div>
    </header>
  )
}

export default Header