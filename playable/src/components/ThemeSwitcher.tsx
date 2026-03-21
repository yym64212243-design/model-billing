"use client";

const themes = [
  { id: "default", label: "默认" },
  { id: "warm", label: "暖色" },
  { id: "cool", label: "冷色" },
] as const;

export function ThemeSwitcher() {
  const setTheme = (id: string) => {
    document.documentElement.setAttribute("data-theme", id === "default" ? "" : id);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">主题</span>
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          className="touch-target rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
