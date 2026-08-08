import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useTheme } from "~/app/theme-provider.tsx";
import { IconButton } from "~/shared/ui-kit/icon-button.tsx";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = theme === "dark";
  const label = mounted
    ? isDark ? "Switch to light theme" : "Switch to dark theme"
    : "Toggle theme";
  return (
    <IconButton label={label} onClick={toggle}>
      {mounted
        ? isDark
          ? <SunIcon className="h-5 w-5" aria-hidden="true" />
          : <MoonIcon className="h-5 w-5" aria-hidden="true" />
        : <span className="h-5 w-5" aria-hidden="true" />}
    </IconButton>
  );
}
