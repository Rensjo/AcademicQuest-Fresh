import React from 'react';
import { useTheme, PALETTES } from '@/store/theme';
import PomodoroFloat from '@/components/PomodoroFloat';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const THEME_COLORS = PALETTES[theme.palette];
  const [accentLocal, setAccentLocal] = React.useState(theme.accent);
  React.useEffect(() => setAccentLocal(theme.accent), [theme.accent]);
  
  // Style for a fixed bottom glow, rendered above the body background
  const bottomGlowStyle = React.useMemo(() => {
    const alpha = Math.min(0.35, Math.max(0.12, accentLocal / 260));
    const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    const color = THEME_COLORS[2] + hex;
    return {
      position: 'fixed' as const,
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: '-15vh',
      width: '120vw',
      height: '50vh',
      backgroundImage: `radial-gradient(closest-side at 50% 50%, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none' as const,
      zIndex: 0,
      filter: 'blur(12px)',
    };
  }, [accentLocal, THEME_COLORS]);
  
  // Apply theme settings to document
  React.useEffect(() => {
    // Apply dark mode class to root HTML element
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme.mode === 'dark' || (theme.mode === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    
    // Apply font family to body
    const fontMap: Record<string, string> = {
      'Inter': "'Inter', ui-sans-serif, system-ui, sans-serif",
      'Poppins': "'Poppins', ui-sans-serif, system-ui, sans-serif",
      'Nunito': "'Nunito', ui-sans-serif, system-ui, sans-serif",
      'Outfit': "'Outfit', ui-sans-serif, system-ui, sans-serif", 
      'Roboto': "Roboto, ui-sans-serif, system-ui, sans-serif",
      'Lato': "Lato, ui-sans-serif, system-ui, sans-serif",
      'Montserrat': "Montserrat, ui-sans-serif, system-ui, sans-serif",
      'Source Sans 3': "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    };
    
    document.body.style.fontFamily = fontMap[theme.font] || fontMap['Inter'];
  }, [theme.mode, theme.font]);

  // Global gradient background applied to body so it covers full scroll height on every page
  React.useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme.mode === 'dark' || (theme.mode === 'system' && prefersDark);

  const alpha = Math.min(0.35, Math.max(0.12, accentLocal / 260));
  const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  const bottomAlpha = Math.max(0.28, alpha); // ensure bottom blob is visible
  const bottomHex = Math.round(bottomAlpha * 255).toString(16).padStart(2, '0');
    const base = isDark
      ? 'linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)';
  const tintA = `radial-gradient(circle at 10% 0%, ${THEME_COLORS[0]}${hex} 0%, transparent 40%)`;
  const tintB = `radial-gradient(circle at 90% 10%, ${THEME_COLORS[3]}${hex} 0%, transparent 45%)`;
  // Larger and stronger bottom blob
  const tintC = `radial-gradient(circle at 50% 120%, ${THEME_COLORS[2]}${bottomHex} 0%, transparent 60%)`;

    // Apply to body
  document.body.style.backgroundImage = `${tintA}, ${tintB}, ${tintC}, ${base}`;
  // Individual layer controls to keep top blobs fixed and bottom blob near the page bottom
  document.body.style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat, no-repeat';
  document.body.style.backgroundAttachment = 'fixed, fixed, scroll, fixed';
  document.body.style.backgroundPosition = '10% 0%, 90% 10%, 50% 100%, 0 0';
  document.body.style.backgroundSize = 'auto, auto, 120vw 60vh, auto';
    document.body.style.backgroundColor = isDark ? '#0a0a0a' : '#ffffff';

    // Ensure body spans full height
    document.documentElement.style.minHeight = '100%';
    document.body.style.minHeight = '100%';

    return () => {
      // leave background applied; no cleanup needed between route changes
    };
  }, [theme.mode, theme.palette, THEME_COLORS, accentLocal]);

  return (
    <>
      {/* Bottom glow overlay (non-interactive) */}
      <div aria-hidden style={bottomGlowStyle} />
      {/* Ensure content paints above the glow */}
  <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  {/* Floating Pomodoro button (draggable, corner-snapping) */}
  <PomodoroFloat />
    </>
  );
}