import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DefaultRoute = '/' | '/planner' | '/tasks' | '/schedule' | '/course-planner' | '/scholarships' | '/textbooks' | '/settings'
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CNY' | 'KRW' | 'NGN' | 'ZAR' | 'PHP'
export type GPAScale = '4-highest' | '1-highest'
export type PomodoroPosition = 'tl' | 'tr' | 'bl' | 'br' | 'draggable'
export type PomodoroSize = 'small' | 'medium' | 'large'

type ChartAnim = 'normal' | 'fast' | 'off'

type SettingsState = {
  defaultRoute: DefaultRoute
  gradientsEnabled: boolean
  reducedMotion: boolean
  chartAnimation: ChartAnim
  confettiEnabled: boolean
  soundsEnabled: boolean

  weekStart: 0 | 1
  time24h: boolean
  dateFormat: 'auto' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'

  autosaveSeconds: 10 | 30 | 60 | 120
  askBeforeLeave: boolean

  notificationsEnabled: boolean
  quietStart: string // HH:mm
  quietEnd: string   // HH:mm

  // formatting
  preferredCurrency: CurrencyCode
  gpaScale: GPAScale

  gamificationEnabled: boolean
  showStreaks: boolean
  achievements: boolean
  challenges: boolean

  // textbook defaults
  textbookDefaultStatus: 'Ordered' | 'Shipped' | 'Received' | 'Returned' | 'Digital'
  textbookDefaultLinkMode: 'url' | 'file'

  // pomodoro settings
  pomodoroPosition: PomodoroPosition
  pomodoroSize: PomodoroSize
  pomodoroAutoHide: boolean

  // actions
  set: (p: Partial<SettingsState>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRoute: '/',
      gradientsEnabled: true,
      reducedMotion: false,
      chartAnimation: 'normal',
      confettiEnabled: true,
      soundsEnabled: false,

      weekStart: 1,
      time24h: true,
      dateFormat: 'auto',

      autosaveSeconds: 30,
      askBeforeLeave: true,

      notificationsEnabled: false,
      quietStart: '22:00',
      quietEnd: '07:00',

  preferredCurrency: 'USD',
  gpaScale: '4-highest',

      gamificationEnabled: false,
      showStreaks: true,
      achievements: true,
      challenges: false,

      textbookDefaultStatus: 'Ordered',
      textbookDefaultLinkMode: 'file',

      // pomodoro defaults
      pomodoroPosition: 'draggable',
      pomodoroSize: 'medium',
      pomodoroAutoHide: false,

      set: (p) => set(p),
    }),
    { name: 'aq:settings' }
  )
)
