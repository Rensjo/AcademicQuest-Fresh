// Sound Service for Academic Quest
export type SoundType = 'hover' | 'click' | 'taskComplete' | 'levelUp' | 'badgeEarned'

interface SoundConfig {
  src: string
  volume: number
  preload?: boolean
}

interface BackgroundMusicConfig {
  src: string
  volume: number
  loop: boolean
}

class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map()
  private backgroundMusic: HTMLAudioElement | null = null
  private enabled: boolean = true
  private masterVolume: number = 0.7
  private backgroundMusicEnabled: boolean = false
  private backgroundMusicVolume: number = 0.25 // 40% lower than default (0.4 * 0.6 = 0.24, rounded to 0.25)
  private backgroundMusicInitialized: boolean = false
  private hasUserInteracted: boolean = false
  private backgroundMusicCooldown: boolean = false
  private backgroundMusicTimeout: NodeJS.Timeout | null = null

  // Background music configuration
  private backgroundMusicConfig: BackgroundMusicConfig = {
    src: '/sounds/Golden-Hour-background-sound.mp3',
    volume: 0.25, // Lower volume to not be distracting
    loop: false // We'll handle replay manually with cooldown
  }

  // Sound configuration
  private soundConfigs: Record<SoundType, SoundConfig> = {
    hover: {
      src: '/sounds/hover-button-sound.mp3',
      volume: 0.3,
      preload: true
    },
    click: {
      src: '/sounds/single-mouse-button-click-351381.mp3',
      volume: 0.5,
      preload: true
    },
    taskComplete: {
      src: '/sounds/task-complete-sound.mp3',
      volume: 0.8,
      preload: true
    },
    levelUp: {
      src: '/sounds/level-up-sound.mp3',
      volume: 0.9,
      preload: true
    },
    badgeEarned: {
      src: '/sounds/badge-sound.mp3',
      volume: 0.8,
      preload: true
    }
  }

  constructor() {
    this.initializeSounds()
    this.initializeBackgroundMusic()
    this.loadSettings()
    this.syncWithSettingsStore()
    
    // Add some debug info
    console.log('🔊 SoundService initialized')

    // Add click listener to try playing background music after user interaction
    document.addEventListener('click', this.handleFirstUserInteraction.bind(this), { once: true })
    document.addEventListener('keydown', this.handleFirstUserInteraction.bind(this), { once: true })
  }

  private handleFirstUserInteraction() {
    if (this.hasUserInteracted) return // Prevent multiple triggers
    
    this.hasUserInteracted = true
    console.log('🎵 First user interaction detected, attempting to start background music')
    
    if (this.backgroundMusicEnabled && this.enabled && this.backgroundMusic && this.backgroundMusic.paused) {
      this.playBackgroundMusic()
    }
  }

  private initializeSounds() {
    Object.entries(this.soundConfigs).forEach(([soundType, config]) => {
      try {
        const audio = new Audio(config.src)
        audio.volume = config.volume * this.masterVolume
        audio.preload = config.preload ? 'auto' : 'none'
        
        // Handle loading errors gracefully
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load sound: ${config.src}`, e)
        })
        
        this.sounds.set(soundType as SoundType, audio)
      } catch (error) {
        console.warn(`Failed to create audio for ${soundType}:`, error)
      }
    })
  }

  private initializeBackgroundMusic() {
    try {
      console.log('🎵 Initializing background music with config:', this.backgroundMusicConfig)
      
      this.backgroundMusic = new Audio(this.backgroundMusicConfig.src)
      this.backgroundMusic.loop = this.backgroundMusicConfig.loop // Set to false for manual control
      this.backgroundMusic.volume = this.backgroundMusicConfig.volume * this.masterVolume
      this.backgroundMusic.preload = 'auto'
      
      console.log('🎵 Background music audio element created:', {
        src: this.backgroundMusic.src,
        volume: this.backgroundMusic.volume,
        loop: this.backgroundMusic.loop
      })
      
      // Handle loading errors gracefully
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error(`🎵 Failed to load background music: ${this.backgroundMusicConfig.src}`, e)
        console.error('🎵 Audio element error details:', {
          error: this.backgroundMusic?.error,
          networkState: this.backgroundMusic?.networkState,
          readyState: this.backgroundMusic?.readyState
        })
      })
      
      // Handle successful loading
      this.backgroundMusic.addEventListener('loadeddata', () => {
        console.log('🎵 Background music loaded successfully')
      })

      // Handle when enough data is loaded to start playing
      this.backgroundMusic.addEventListener('loadedmetadata', () => {
        console.log('🎵 Background music metadata loaded:', {
          duration: this.backgroundMusic?.duration,
          volume: this.backgroundMusic?.volume
        })
      })
      
      // Auto-play if enabled (will respect browser autoplay policies)
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        console.log('🎵 Background music can play through, checking if should auto-start:', {
          backgroundMusicEnabled: this.backgroundMusicEnabled,
          soundsEnabled: this.enabled,
          alreadyInitialized: this.backgroundMusicInitialized,
          hasUserInteracted: this.hasUserInteracted
        })
        
        // Only auto-start once and if not already playing
        if (this.backgroundMusicEnabled && this.enabled && !this.backgroundMusicInitialized && (!this.backgroundMusic || this.backgroundMusic.paused)) {
          console.log('🎵 Auto-starting background music...')
          this.backgroundMusicInitialized = true
          this.playBackgroundMusic()
        }
      })
      
    } catch (error) {
      console.error('🎵 Failed to initialize background music:', error)
    }
  }

  private loadSettings() {
    try {
      const settings = localStorage.getItem('aq:sound-settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        this.enabled = parsed.enabled ?? true
        this.masterVolume = parsed.masterVolume ?? 0.7
        this.backgroundMusicEnabled = parsed.backgroundMusicEnabled ?? false
        this.backgroundMusicVolume = parsed.backgroundMusicVolume ?? 0.25
        this.updateAllVolumes()
        this.updateBackgroundMusicVolume()
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error)
    }
  }

  private syncWithSettingsStore() {
    // Sync with the main settings store if available
    try {
      const settingsData = localStorage.getItem('aq:settings')
      if (settingsData) {
        const parsed = JSON.parse(settingsData)
        if (parsed.state?.soundsEnabled !== undefined) {
          this.enabled = parsed.state.soundsEnabled
        }
      }
    } catch (error) {
      console.warn('Failed to sync with settings store:', error)
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('aq:sound-settings', JSON.stringify({
        enabled: this.enabled,
        masterVolume: this.masterVolume,
        backgroundMusicEnabled: this.backgroundMusicEnabled,
        backgroundMusicVolume: this.backgroundMusicVolume
      }))

      // Also update the main settings store
      const settingsData = localStorage.getItem('aq:settings')
      if (settingsData) {
        const parsed = JSON.parse(settingsData)
        parsed.state.soundsEnabled = this.enabled
        localStorage.setItem('aq:settings', JSON.stringify(parsed))
      }
    } catch (error) {
      console.warn('Failed to save sound settings:', error)
    }
  }

  private updateAllVolumes() {
    Object.entries(this.soundConfigs).forEach(([soundType, config]) => {
      const audio = this.sounds.get(soundType as SoundType)
      if (audio) {
        audio.volume = config.volume * this.masterVolume
      }
    })
  }

  private updateBackgroundMusicVolume() {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.backgroundMusicVolume * this.masterVolume
    }
  }

  // Background music methods
  playBackgroundMusic() {
    console.log('🎵 playBackgroundMusic called with state:', {
      hasBackgroundMusic: !!this.backgroundMusic,
      backgroundMusicEnabled: this.backgroundMusicEnabled,
      soundsEnabled: this.enabled,
      currentVolume: this.backgroundMusic?.volume,
      readyState: this.backgroundMusic?.readyState,
      paused: this.backgroundMusic?.paused,
      currentTime: this.backgroundMusic?.currentTime,
      cooldown: this.backgroundMusicCooldown,
      src: this.backgroundMusic?.src
    })

    if (!this.backgroundMusic) {
      console.warn('🎵 No background music audio element available')
      return
    }

    if (!this.backgroundMusicEnabled) {
      console.log('🎵 Background music is disabled, skipping playback')
      return
    }

    if (!this.enabled) {
      console.log('🎵 Overall sounds are disabled, skipping background music')
      return
    }

    // Check cooldown to prevent overlapping
    if (this.backgroundMusicCooldown) {
      console.log('🎵 Background music is in cooldown, skipping playback')
      return
    }

    // Check if already playing to avoid restarting
    if (!this.backgroundMusic.paused) {
      console.log('🎵 Background music is already playing, skipping restart')
      return
    }

    try {
      // Set cooldown flag
      this.backgroundMusicCooldown = true
      
      // Ensure volume is set correctly
      this.backgroundMusic.volume = this.backgroundMusicVolume * this.masterVolume
      
      // Reset to beginning
      this.backgroundMusic.currentTime = 0
      
      console.log('🎵 Attempting to play background music...', {
        volume: this.backgroundMusic.volume,
        readyState: this.backgroundMusic.readyState,
        networkState: this.backgroundMusic.networkState,
        paused: this.backgroundMusic.paused
      })
      
      // Add event listener for when the music ends
      const handleEnded = () => {
        console.log('🎵 Background music ended, starting 5-second cooldown')
        this.backgroundMusic?.removeEventListener('ended', handleEnded)
        
        // Start 5-second cooldown
        this.backgroundMusicTimeout = setTimeout(() => {
          console.log('🎵 Cooldown finished, background music can play again')
          this.backgroundMusicCooldown = false
          
          // Auto-restart if still enabled
          if (this.backgroundMusicEnabled && this.enabled) {
            console.log('🎵 Auto-restarting background music after cooldown')
            this.playBackgroundMusic()
          }
        }, 5000) // 5 seconds cooldown
      }
      
      this.backgroundMusic.addEventListener('ended', handleEnded)
      
      const playPromise = this.backgroundMusic.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎵 Background music started successfully')
          })
          .catch(error => {
            console.error('🎵 Failed to play background music:', error)
            
            // Reset cooldown on error
            this.backgroundMusicCooldown = false
            
            // Common browser autoplay policy issue
            if (error.name === 'NotAllowedError') {
              console.log('🎵 Background music blocked by browser autoplay policy. User interaction required.')
            }
          })
      } else {
        console.log('🎵 Play method did not return a promise (older browser)')
      }
    } catch (error) {
      console.error('🎵 Error playing background music:', error)
      // Reset cooldown on error
      this.backgroundMusicCooldown = false
    }
  }

  pauseBackgroundMusic() {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause()
      console.log('🎵 Background music paused')
    }
    
    // Clear any pending cooldown
    if (this.backgroundMusicTimeout) {
      clearTimeout(this.backgroundMusicTimeout)
      this.backgroundMusicTimeout = null
    }
    
    // Reset cooldown when manually paused
    this.backgroundMusicCooldown = false
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
      console.log('🎵 Background music stopped')
    }
    
    // Clear any pending cooldown
    if (this.backgroundMusicTimeout) {
      clearTimeout(this.backgroundMusicTimeout)
      this.backgroundMusicTimeout = null
    }
    
    // Reset cooldown when manually stopped
    this.backgroundMusicCooldown = false
  }

  // Public methods
  play(soundType: SoundType, options?: { volume?: number; delay?: number }) {
    const enabled = this.isEnabled()
    console.log(`🔊 Attempting to play sound: ${soundType}, enabled: ${enabled}`)
    
    if (!enabled) {
      console.log(`🔇 Sound disabled, skipping ${soundType}`)
      return
    }

    const playSound = () => {
      const audio = this.sounds.get(soundType)
      if (!audio) {
        console.warn(`Sound not found: ${soundType}`)
        return
      }

      try {
        // Reset audio to beginning in case it's already playing
        audio.currentTime = 0
        
        // Apply temporary volume if specified
        if (options?.volume !== undefined) {
          audio.volume = options.volume * this.masterVolume
        }
        
        console.log(`🎵 Playing sound: ${soundType} at volume ${audio.volume}`)
        
        // Play the sound
        const playPromise = audio.play()
        
        // Handle promise-based play() method
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`✅ Successfully played sound: ${soundType}`)
            })
            .catch(error => {
              console.warn(`Failed to play sound ${soundType}:`, error)
            })
        }
        
        // Reset volume after playing if it was temporarily changed
        if (options?.volume !== undefined) {
          setTimeout(() => {
            const config = this.soundConfigs[soundType]
            audio.volume = config.volume * this.masterVolume
          }, 100)
        }
      } catch (error) {
        console.warn(`Error playing sound ${soundType}:`, error)
      }
    }

    if (options?.delay) {
      setTimeout(playSound, options.delay)
    } else {
      playSound()
    }
  }

  // Settings methods
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.saveSettings()
    
    // Control background music based on overall sound setting
    if (enabled && this.backgroundMusicEnabled) {
      this.playBackgroundMusic()
    } else {
      this.pauseBackgroundMusic()
    }
    
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`)
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
    this.updateBackgroundMusicVolume()
    this.saveSettings()
    console.log(`🔊 Master volume set to ${Math.round(this.masterVolume * 100)}%`)
  }

  isEnabled(): boolean {
    // Check both internal state and settings store
    try {
      const settingsData = localStorage.getItem('aq:settings')
      if (settingsData) {
        const parsed = JSON.parse(settingsData)
        if (parsed.state?.soundsEnabled !== undefined) {
          return parsed.state.soundsEnabled
        }
      }
    } catch (error) {
      console.warn('Failed to read settings store for sound enabled state:', error)
    }
    return this.enabled
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  // Convenience methods for common actions
  playHover() {
    this.play('hover')
  }

  playClick() {
    this.play('click')
  }

  playTaskComplete() {
    this.play('taskComplete')
  }

  playLevelUp() {
    this.play('levelUp', { delay: 500 }) // Slight delay for dramatic effect
  }

  playBadgeEarned() {
    this.play('badgeEarned', { delay: 300 })
  }

  // Background music public methods
  setBackgroundMusicEnabled(enabled: boolean) {
    console.log('🎵 setBackgroundMusicEnabled called:', {
      enabled,
      previousState: this.backgroundMusicEnabled,
      overallSoundsEnabled: this.enabled,
      hasBackgroundMusic: !!this.backgroundMusic,
      currentlyPlaying: this.backgroundMusic ? !this.backgroundMusic.paused : false
    })
    
    this.backgroundMusicEnabled = enabled
    this.saveSettings()
    
    if (enabled && this.enabled) {
      console.log('🎵 Starting background music...')
      this.playBackgroundMusic()
    } else {
      console.log('🎵 Pausing background music...')
      this.pauseBackgroundMusic()
    }
    
    console.log(`🎵 Background music ${enabled ? 'enabled' : 'disabled'}`)
  }

  setBackgroundMusicVolume(volume: number) {
    this.backgroundMusicVolume = Math.max(0, Math.min(1, volume))
    this.updateBackgroundMusicVolume()
    this.saveSettings()
    console.log(`🎵 Background music volume set to ${Math.round(this.backgroundMusicVolume * 100)}%`)
  }

  isBackgroundMusicEnabled(): boolean {
    return this.backgroundMusicEnabled
  }

  getBackgroundMusicVolume(): number {
    return this.backgroundMusicVolume
  }

  toggleBackgroundMusic() {
    this.setBackgroundMusicEnabled(!this.backgroundMusicEnabled)
  }
}

// Create and export singleton instance
export const soundService = new SoundService()

// Export types for use in components
export { SoundService }
