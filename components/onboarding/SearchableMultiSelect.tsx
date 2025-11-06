/**
 * SearchableMultiSelect - Searchable multi-select component with chips
 *
 * Features:
 * - Fuzzy search with synonym support
 * - Selected items displayed as removable chips
 * - Dropdown with search results
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Accessible (ARIA labels, focus management)
 *
 * Usage:
 * <SearchableMultiSelect
 *   items={dietItems}
 *   selected={selectedDiets}
 *   onSelect={(items) => setSelectedDiets(items)}
 *   placeholder="Buscar dietas..."
 *   emptyMessage="No se encontraron dietas"
 * />
 */

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectableItem {
  id: string;
  key: string;
  label: string;
  description?: string;
  synonyms?: string[];
}

export interface SearchableMultiSelectProps {
  items: SelectableItem[];
  selected: string[]; // Array of keys
  onSelect: (selectedKeys: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxHeight?: string;
  className?: string;
}

export function SearchableMultiSelect({
  items,
  selected,
  onSelect,
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  maxHeight = "max-h-64",
  className,
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase().trim();

    return items.filter((item) => {
      // Search in label
      if (item.label.toLowerCase().includes(lowerQuery)) return true;

      // Search in description
      if (item.description?.toLowerCase().includes(lowerQuery)) return true;

      // Search in synonyms
      if (
        item.synonyms?.some((syn) => syn.toLowerCase().includes(lowerQuery))
      ) {
        return true;
      }

      return false;
    });
  }, [items, query]);

  // Get selected item objects
  const selectedItems = useMemo(() => {
    return items.filter((item) => selected.includes(item.key));
  }, [items, selected]);

  // Handle item selection
  const toggleItem = (key: string) => {
    if (selected.includes(key)) {
      onSelect(selected.filter((k) => k !== key));
    } else {
      onSelect([...selected, key]);
    }
    setQuery("");
    inputRef.current?.focus();
  };

  // Handle item removal (from chips)
  const removeItem = (key: string) => {
    onSelect(selected.filter((k) => k !== key));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
          toggleItem(filteredItems[focusedIndex].key);
          setFocusedIndex(-1);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset focused index when query changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [query]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          aria-label="Buscar items"
          aria-expanded={isOpen}
          aria-controls="search-results"
        />

        {/* Dropdown with results */}
        {isOpen && query.trim() && (
          <div
            ref={dropdownRef}
            id="search-results"
            role="listbox"
            className={cn(
              "absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-auto",
              maxHeight
            )}
          >
            {filteredItems.length > 0 ? (
              <ul className="py-1">
                {filteredItems.map((item, index) => {
                  const isSelected = selected.includes(item.key);
                  const isFocused = index === focusedIndex;

                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "px-4 py-3 cursor-pointer transition-colors border-b border-neutral-100 last:border-b-0",
                        isFocused && "bg-primary-50",
                        !isFocused && "hover:bg-neutral-50"
                      )}
                      onClick={() => toggleItem(item.key)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900">
                              {item.label}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-accent-fresh flex-shrink-0" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-neutral-600 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-neutral-500">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected items as chips */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Seleccionados ({selectedItems.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 gap-2 bg-primary-soft text-primary-900 hover:bg-primary-100"
              >
                <span>{item.label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-primary-200 rounded-full"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Eliminar ${item.label}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Helper text when no items selected */}
      {selectedItems.length === 0 && !query && (
        <p className="text-sm text-neutral-500">
          Usa el buscador para agregar items
        </p>
      )}
    </div>
  );
}
