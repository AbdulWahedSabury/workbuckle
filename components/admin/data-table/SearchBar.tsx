"use client";

import { useId, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useListQuery } from "./ListQueryProvider";

const DEBOUNCE_MS = 300;

/**
 * Search box bound to the `?q=` param. Typing updates the URL after a short
 * pause; Enter applies it immediately and Escape clears it.
 */
export default function SearchBar({
  label,
  placeholder,
  className,
}: {
  /** Accessible name, e.g. "Search cities". */
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const { q, isPending, setSearch } = useListQuery();
  const inputId = useId();
  const [value, setValue] = useState(q);

  // Adopt URL changes made elsewhere (back/forward, a shared link) without an
  // effect. Our own updates arrive as `value.trim()`; skipping those keeps a
  // trailing space the user is still typing.
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    if (q !== value.trim()) setValue(q);
  }

  const debouncedSearch = useDebouncedCallback(setSearch, DEBOUNCE_MS);

  function update(next: string) {
    setValue(next);
    debouncedSearch(next);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        debouncedSearch.flush();
      }}
      className={cn("group relative w-full sm:max-w-sm", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-2 transition-colors group-focus-within:text-primary-dark"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
      </span>
      <input
        id={inputId}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            update("");
            debouncedSearch.flush();
          }
        }}
        className="h-11 w-full rounded-full border border-line bg-white pr-11 pl-11 text-sm text-ink transition-[border-color,box-shadow] outline-none placeholder:text-gray-2/70 hover:border-ink/20 focus:border-primary focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            update("");
            debouncedSearch.flush();
          }}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-gray-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
