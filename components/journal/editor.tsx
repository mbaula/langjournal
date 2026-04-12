"use client";

import { useRef, useCallback } from "react";

export function Editor() {
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Will submit / parse commands in a future commit
      }
    },
    [],
  );

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      aria-label="Journal entry"
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      data-placeholder="Start writing…"
      className="min-h-[40vh] w-full text-lg leading-relaxed text-foreground caret-foreground outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
    />
  );
}
