import React, { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import Slider from '@/components/ui/slider'
import { soundService } from '@/services/soundService'
import { useSettings } from '@/store/settingsStore'
import { Volume2, VolumeX, Music } from 'lucide-react'

export function SoundSettings() {
  const settings = useSettings()
  const [masterVolume, setMasterVolume] = useState(soundService.getMasterVolume())
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(soundService.isBackgroundMusicEnabled())
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(soundService.getBackgroundMusicVolume())

  useEffect(() => {
    // Sync with sound service when component mounts
    setMasterVolume(soundService.getMasterVolume())
    setBackgroundMusicEnabled(soundService.isBackgroundMusicEnabled())
    setBackgroundMusicVolume(soundService.getBackgroundMusicVolume())
  }, [])

  const handleSoundToggle = (enabled: boolean) => {
    settings.set({ soundsEnabled: enabled })
    soundService.setEnabled(enabled)
  }

  const handleVolumeChange = (values: number[]) => {
    const volume = values[0]
    setMasterVolume(volume)
    soundService.setMasterVolume(volume)
  }

  const handleBackgroundMusicToggle = (enabled: boolean) => {
    setBackgroundMusicEnabled(enabled)
    soundService.setBackgroundMusicEnabled(enabled)
  }

  const handleBackgroundMusicVolumeChange = (values: number[]) => {
    const volume = values[0]
    setBackgroundMusicVolume(volume)
    soundService.setBackgroundMusicVolume(volume)
  }

  return (
    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            {settings.soundsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound Effects
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Play audio feedback for interactions and achievements</p>
        </div>
        <Switch 
          checked={settings.soundsEnabled} 
          onCheckedChange={handleSoundToggle}
        />
      </div>

      {/* Volume Control */}
      {settings.soundsEnabled && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 block">
              Master Volume: {Math.round(masterVolume * 100)}%
            </label>
            <Slider
              value={[masterVolume]}
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Background Music Section */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Background Music
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Ambient golden hour background music</p>
              </div>
              <Switch 
                checked={backgroundMusicEnabled} 
                onCheckedChange={handleBackgroundMusicToggle}
              />
            </div>

            {backgroundMusicEnabled && (
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 block">
                  Background Music Volume: {Math.round(backgroundMusicVolume * 100)}%
                </label>
                <Slider
                  value={[backgroundMusicVolume]}
                  onValueChange={handleBackgroundMusicVolumeChange}
                  max={1}
                  min={0}
                  step={0.05}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
