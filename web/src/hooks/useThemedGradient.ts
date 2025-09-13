import React from "react";
import { useTheme, PALETTES } from "@/store/theme";

// Returns a CSSProperties gradient background synced to the current theme accent & mode
export function useThemedGradient(): React.CSSProperties {
  const theme = useTheme();
  const COLORS = PALETTES[theme.palette];
  const [accentLocal, setAccentLocal] = React.useState(theme.accent);
  React.useEffect(() => setAccentLocal(theme.accent), [theme.accent]);

  return React.useMemo(() => {
    const alpha = Math.min(0.35, Math.max(0.12, (accentLocal as number) / 260));
    const hex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    const prefersDark = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
    const isDark = theme.mode === "dark" || (theme.mode === "system" && prefersDark);
    const base = isDark
      ? "linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)";
    const tintA = `radial-gradient(circle at 8% 0%, ${COLORS[0]}${hex} 0%, transparent 40%)`;
    const tintB = `radial-gradient(circle at 92% 12%, ${COLORS[3]}${hex} 0%, transparent 45%)`;
    const tintC = `radial-gradient(circle at 50% 120%, ${COLORS[2]}${hex} 0%, transparent 55%)`;
    return {
      backgroundImage: `${tintA}, ${tintB}, ${tintC}, ${base}`,
      backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat",
      backgroundAttachment: "fixed, fixed, scroll, fixed",
      backgroundPosition: "8% 0%, 92% 12%, 50% 100%, 0 0",
    } as React.CSSProperties;
  }, [accentLocal, theme.mode, COLORS]);
}

export default useThemedGradient;
