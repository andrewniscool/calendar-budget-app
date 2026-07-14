import React from 'react'
import ViewModeDropdown from './Header_stuff/ViewModeDropdown'
import TodayButton from './Header_stuff/TodayButton'
import DateNavigationButtons from './Header_stuff/DateNavigationButtons'
import ProfilePopupMenu from './Header_stuff/ProfilePopupMenu';


const Header = ({ viewMode, setViewMode, setSelectedDate, selectedDate, setIsSidebarOpen, onLogout }) => {
  return (
    <header className="sticky top-0 z-[50] border-b border-slate-200 bg-white px-3">
      <div className="flex h-12 items-center">
        <div className="-ml-3 flex h-full w-64 shrink-0 items-center gap-2 pl-3">
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
        </div>

        <TodayButton setSelectedDate={setSelectedDate}>
          Today
        </TodayButton>

        <div className="ml-2">
          <DateNavigationButtons
            viewMode={viewMode}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ViewModeDropdown viewMode={viewMode} setViewMode={setViewMode} />
          <ProfilePopupMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

export default Header
