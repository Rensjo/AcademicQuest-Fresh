import { useCallback } from 'react'
import { soundService } from '@/services/soundService'

// React hook for using sound effects in components
export function useSoundEffects() {
  const playHover = useCallback(() => {
    soundService.playHover()
  }, [])

  const playClick = useCallback(() => {
    soundService.playClick()
  }, [])

  const playTaskComplete = useCallback(() => {
    soundService.playTaskComplete()
  }, [])

  const playLevelUp = useCallback(() => {
    soundService.playLevelUp()
  }, [])

  const playBadgeEarned = useCallback(() => {
    soundService.playBadgeEarned()
  }, [])

  return {
    playHover,
    playClick,
    playTaskComplete,
    playLevelUp,
    playBadgeEarned,
    soundService // For direct access to the service
  }
}
