"use client";

import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";

interface TabsProps {
  defaultValue: string;
  tabs: Array<{ label: string; value: string }>;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ defaultValue, tabs, onChange, className }: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  const active = useMemo(() => tabs.find((tab) => tab.value === value) ?? tabs[0], [tabs, value]);

  return (
    <div className={cn("inline-flex rounded-full border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900", className)}>
      {tabs.map((tab) => {
        const selected = active.value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setValue(tab.value);
              onChange?.(tab.value);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition",
              selected
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
