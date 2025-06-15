import "../styles/RippleEffect.css";
import React, { useRef } from "react";
import dayjs from "dayjs";

function TodayButton({ setSelectedDate, children }) {
  const btnRef = useRef();

  const handleClick = (e) => {
    const button = btnRef.current;
    const rect = button.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement("span");
    ripple.className = "ripple-it";
    ripple.style.setProperty("--x", x / rect.width);
    ripple.style.setProperty("--y", y / rect.height);
    button.appendChild(ripple);

    // Remove ripple after animation completes
    setTimeout(() => ripple.remove(), 1200);

    // Set selected date to today (as dayjs object to maintain consistency)
    const today = dayjs();
    setSelectedDate(today);
    console.log("Selected date set to today:", today.format("YYYY-MM-DD"));
  };

  return (
    <button ref={btnRef} className="today-btn" onClick={handleClick}>
      {children || "Today"}
    </button>
  );
}

export default TodayButton;