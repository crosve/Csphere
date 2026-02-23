"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function SplitPane({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const [leftWidth, setLeftWidth] = useState(40);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - container.left) / container.width) * 100;
      setLeftWidth(Math.min(80, Math.max(20, newLeftWidth)));
    };

    const onMouseUp = () => {
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  return (
    <div
      ref={containerRef}
      className="flex w-full h-full overflow-hidden rounded-sm "
    >
      <div
        style={{ width: `${leftWidth}%` }}
        className="h-full overflow-hidden relative"
      >
        {left}
        {/* Blocks iframe from eating mouse events while dragging */}
        {dragging && <div className="absolute inset-0 z-50" />}
      </div>

      <div
        className={`w-1 h-full flex-shrink-0 cursor-col-resize transition-colors ${dragging ? "bg-blue-400" : "bg-gray-200 hover:bg-blue-400"}`}
        onMouseDown={onMouseDown}
      />

      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full overflow-hidden"
      >
        {right}
      </div>
    </div>
  );
}
