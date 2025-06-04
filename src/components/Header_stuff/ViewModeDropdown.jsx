import React, { useState, useRef, useEffect } from "react";
import "./ViewModeDropdown.css";

function ViewModeDropdown({ viewMode, setViewMode }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatLabel = (val) =>
    val.charAt(0).toUpperCase() + val.slice(1);

  return (
    <div ref={dropdownRef} className={`select ${open ? "open" : ""}`}>
      {/* Main button */}
      <div className="selected" onClick={() => setOpen(!open)}>
        <span>{formatLabel(viewMode)}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className="arrow"
        >
          <path
            fill="white"
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 
              12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 
              86.6 169.4c-12.5-12.5-32.8-12.5-45.3 
              0s-12.5 32.8 0 45.3l192 192z"
          />
        </svg>
      </div>

      {/* Dropdown options */}
      <div className="options">
        {["all", "day", "week", "month", "year"].map((mode, idx) => (
          <div key={mode}>
            <input
              type="radio"
              name="option"
              id={`option-${idx}`}
              checked={viewMode === mode}
              onChange={() => {
                setViewMode(mode);
                setOpen(false);
              }}
            />
            <label
              htmlFor={`option-${idx}`}
              className="option"
              data-txt={formatLabel(mode)}
            ></label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewModeDropdown;
