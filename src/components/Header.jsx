import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'
import TodayButton from './Header_stuff/TodayButton'
import DateNavigationButtons from './Header_stuff/DateNavigationButtons'
import ProfilePopupMenu from './Header_stuff/ProfilePopupMenu';


const Header = ({ viewMode, setViewMode, setSelectedDate, selectedDate, setIsSidebarOpen, onLogout }) => {
  return (
    <header className="sticky top-0 z-[50] border-b border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="4.5" width="18" height="15" rx="2" />
            <path d="M9.5 4.5v15" />
          </svg>
        </button>

        <h1 className="px-1 text-sm font-semibold tracking-tight text-slate-900">Spendary</h1>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <TodayButton setSelectedDate={setSelectedDate}>
          Today
        </TodayButton>

        <DateNavigationButtons
          viewMode={viewMode}
          setSelectedDate={setSelectedDate}
          selectedDate={selectedDate}
        />

        <div className="ml-auto flex items-center gap-3">
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
          <ProfilePopupMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

export default Header
