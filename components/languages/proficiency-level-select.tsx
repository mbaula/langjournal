"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { AnchoredFlowDropdown } from "@/components/languages/anchored-flow-dropdown";
import { marketingFlowFieldClassName } from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

export type ProficiencyLevelOption = {
  value: string;
  label: string;
  description?: string;
};

type ProficiencyLevelSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ProficiencyLevelOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  "aria-label"?: string;
};

export function ProficiencyLevelSelect({
  value,
  onChange,
  options,
  placeholder = "Select level...",
  disabled = false,
  className,
  triggerClassName,
  dropdownClassName,
  "aria-label": ariaLabel,
}: ProficiencyLevelSelectProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        document.getElementById(listboxId)?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [listboxId]);

  function selectLevel(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-0 w-full", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel ?? "Proficiency level"}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          marketingFlowFieldClassName,
          "flex w-full items-center truncate pr-12 text-left text-sm",
          !selected && "text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">
          {selected?.label ?? placeholder}
        </span>
      </button>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      <AnchoredFlowDropdown
        open={open}
        anchorRef={triggerRef}
        listboxId={listboxId}
        labelledBy={id}
        className={dropdownClassName}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLevel(option.value)}
                className={cn(
                  "flex w-full flex-col rounded-xl px-4 py-2.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="leading-snug">{option.label}</span>
                {option.description ? (
                  <span
                    className={cn(
                      "mt-1 text-xs font-normal leading-snug whitespace-normal",
                      isSelected
                        ? "text-primary-foreground/85"
                        : "text-muted-foreground",
                    )}
                  >
                    {option.description}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </AnchoredFlowDropdown>
    </div>
  );
}
