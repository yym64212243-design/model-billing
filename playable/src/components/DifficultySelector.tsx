"use client";

import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import type { DifficultyLevel } from "@/types";

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (v: DifficultyLevel) => void;
}

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {DIFFICULTY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`touch-target rounded-xl border p-4 text-left transition ${
            value === opt.value
              ? "border-playable-accent bg-playable-accent/10 text-white"
              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <span className="font-medium">{opt.label}</span>
          <p className="mt-1 text-sm opacity-80">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
