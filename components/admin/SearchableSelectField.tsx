"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell, inputClass, type BaseProps } from "./fields";

type Option = { value: string; label: string };

/** Case- and accent-insensitive form used for matching. */
function normalize(text: string): string {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * A select you can type into to filter its options (WAI-ARIA combobox with a
 * listbox popup). The chosen value is submitted from a hidden input under
 * `name`. When not `required`, an `emptyLabel` option clears the value
 * (submitted as "").
 */
export default function SearchableSelectField({
  options,
  defaultValue,
  placeholder = "Search…",
  emptyLabel = "None",
  ...base
}: BaseProps & {
  options: readonly Option[];
  defaultValue?: string | null;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const listId = useId();
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedLabel = options.find((o) => o.value === selected)?.label ?? "";
  const needle = normalize(query.trim());
  const matches = needle ? options.filter((o) => normalize(o.label).includes(needle)) : options;
  // The "none" choice is only offered while browsing, not as a search result.
  const items: readonly Option[] = !base.required && !needle ? [{ value: "", label: emptyLabel }, ...matches] : matches;

  function openList() {
    if (open) return;
    setActive(Math.max(0, items.findIndex((o) => o.value === selected)));
    setOpen(true);
  }

  /** Closes the list; anything typed but not chosen is dropped and the chosen label shows again. */
  function close() {
    setQuery("");
    setOpen(false);
  }

  function choose(option: Option) {
    setSelected(option.value);
    close();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) return openList();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((i) => (items.length ? (i + step + items.length) % items.length : 0));
        break;
      }
      case "Enter":
        // Pick the highlighted option instead of submitting the form.
        if (open) {
          event.preventDefault();
          if (items[active]) choose(items[active]);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case "Tab":
        close();
        break;
    }
  }

  const activeId = open && items[active] ? `${listId}-${active}` : undefined;
  const hasError = Boolean(base.error?.length);

  // Keep the keyboard-highlighted option visible in a long list.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  return (
    <FieldShell {...base}>
      <input type="hidden" name={base.name} value={selected} />
      <div className="relative">
        <input
          id={base.name}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${base.name}-error` : undefined}
          placeholder={selected ? selectedLabel : placeholder}
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={openList}
          onClick={openList}
          onBlur={close}
          onKeyDown={onKeyDown}
          className={cn(inputClass, "pr-16")}
        />

        <div className="absolute inset-y-0 right-3 flex items-center gap-1">
          {selected && !base.required && (
            <button
              type="button"
              aria-label={`Clear ${base.label.toLowerCase()}`}
              title="Clear"
              // Keep focus (and the list state) in the input.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose({ value: "", label: emptyLabel })}
              className="flex size-6 items-center justify-center rounded-full text-gray-2 hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn("pointer-events-none size-4 text-gray-2 transition-transform", open && "rotate-180")}
          />
        </div>

        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={base.label}
            className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg"
          >
            {items.length ? (
              items.map((option, index) => {
                const isSelected = option.value === selected;
                return (
                  <li
                    key={option.value || "__none"}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    // mousedown, not click: it fires before the input's blur closes the list.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(option);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink",
                      index === active && "bg-gray-3",
                      isSelected && "font-semibold",
                      !option.value && "text-gray-2"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-primary-dark" aria-hidden="true" />}
                  </li>
                );
              })
            ) : (
              <li role="presentation" className="px-3 py-2 text-sm text-gray-2">
                No matches for &ldquo;{query.trim()}&rdquo;
              </li>
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
