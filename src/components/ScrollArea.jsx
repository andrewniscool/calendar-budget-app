// src/components/ui/ScrollArea.jsx
export function ScrollArea({ children, className = "", ...props }) {
  return (
    <div
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
