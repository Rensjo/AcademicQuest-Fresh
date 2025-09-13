import React from 'react'
import { Outlet } from 'react-router-dom'
import { useTheme } from '@/store/theme'
import { useSettings } from '@/store/settingsStore'
import NotificationSystem from '@/components/NotificationSystem'
import { soundService } from '@/services/soundService'

const FONT_STACKS: Record<string, string> = {
  Inter: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Poppins: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Nunito: "'Nunito', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Outfit: "'Outfit', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Roboto: "Roboto, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Lato: "Lato, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Montserrat: "Montserrat, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  'Source Sans 3': "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
}

export default function App() {
  const theme = useTheme()
  const settings = useSettings()

  React.useEffect(() => {
    const stack = FONT_STACKS[theme.font] ?? FONT_STACKS['Inter']
    document.body.style.fontFamily = stack
  }, [theme.font])

  // Apply global text scale by changing root font-size (Tailwind uses rem units)
  React.useEffect(() => {
    const pct = Math.round(theme.textScale * 100)
    document.documentElement.style.fontSize = `${pct}%`
  }, [theme.textScale])

  // Apply global radius to CSS var used by components (shadcn/ui)
  React.useEffect(() => {
    const rem = (theme.radius / 16).toFixed(3)
    document.documentElement.style.setProperty('--radius', `${rem}rem`)
  }, [theme.radius])

  // Reduced motion: toggle a class that disables CSS transitions/animations globally
  React.useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !!settings.reducedMotion)
  }, [settings.reducedMotion])

  // Initialize sound service (this ensures it's loaded)
  React.useEffect(() => {
    console.log('🔊 App initializing sound service...')
    // Just accessing soundService ensures it's initialized
    const enabled = soundService.isEnabled()
    console.log('🔊 Sound service state:', { enabled })
  }, [])

  return (
    <div className="app-container">
      {/* Global app shell would go here (like persistent navigation) */}
      <Outlet />
      <NotificationSystem />
    </div>
  )
}