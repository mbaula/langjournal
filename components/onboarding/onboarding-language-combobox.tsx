"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { OnboardingFlowDropdown } from "@/components/onboarding/onboarding-flow-dropdown";
import { marketingFlowFieldClassName } from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

export type OnboardingLanguageOption = {
  code: string;
  name: string;
};

function filterLanguageOptions(options: OnboardingLanguageOption[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter(
    (language) =>
      language.name.toLowerCase().includes(normalized) ||
      language.code.toLowerCase().includes(normalized),
  );
}

type OnboardingLanguageComboboxProps = {
  options: OnboardingLanguageOption[];
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputAriaLabel?: string;
};

export function OnboardingLanguageCombobox({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Search languages...",
  className,
  inputAriaLabel = "Language",
}: OnboardingLanguageComboboxProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((language) => language.code === value);

  const filteredOptions = useMemo(
    () => filterLanguageOptions(options, query),
    [options, query],
  );

  const showList = open && filteredOptions.length > 0;

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
      setQuery("");
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [listboxId]);

  function selectLanguage(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative min-w-0 w-full", className)}
    >
      <label htmlFor={id} className="sr-only">
        {inputAriaLabel}
      </label>
      <div ref={anchorRef} className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : (selected?.name ?? query)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) {
              onChange("");
            }
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.name ?? "");
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
              inputRef.current?.blur();
              return;
            }

            if (event.key === "Enter" && filteredOptions[0]) {
              event.preventDefault();
              selectLanguage(filteredOptions[0].code);
            }
          }}
          className={cn(marketingFlowFieldClassName, "pl-11 text-sm")}
        />
      </div>
      <OnboardingFlowDropdown
        open={showList}
        anchorRef={anchorRef}
        listboxId={listboxId}
        labelledBy={id}
      >
        {filteredOptions.map((language) => {
          const isSelected = language.code === value;
          return (
            <li key={language.code} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLanguage(language.code)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="min-w-0 flex-1 leading-snug whitespace-normal">
                  {language.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium tracking-wide uppercase",
                    isSelected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {language.code}
                </span>
              </button>
            </li>
          );
        })}
      </OnboardingFlowDropdown>
    </div>
  );
}
