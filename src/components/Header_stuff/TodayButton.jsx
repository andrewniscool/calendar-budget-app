import "../styles/TodayButton.css"; // We’ll add styles there
import React, { useRef } from "react";


function TodayButton({ onClick, children }) {
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

    if (onClick) onClick(e);
  };

  return (
    <button ref={btnRef} className="btn" onClick={handleClick}>
      {children || "Today"}
    </button>
  );
}

export default TodayButton;
