import React, { useState } from 'react'
import TopTabsInline from '@/components/TopTabsInline'
import useThemedGradient from '@/hooks/useThemedGradient'
import { Trophy, Zap, RotateCcw, Trash2, Download, Upload, Settings as SettingsIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import Slider from '@/components/ui/slider'
import { useTheme, PALETTES, type Palette, type Mode } from '@/store/theme'
import { useSettings, type DefaultRoute, type CurrencyCode, type GPAScale, type PomodoroPosition, type PomodoroSize } from '@/store/settingsStore'
import { useGamification } from '@/store/gamificationStore'
import { SoundSettings } from '@/components/SoundSettings'
// stores imported in backup via localStorage keys; direct hooks not needed here

const scrollbarStyles = `
	.light-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
	.light-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 5px; }
	.light-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.20); border-radius: 5px; }
	.light-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.30); }
	.dark-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
	.dark-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.10); border-radius: 5px; }
	.dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.20); border-radius: 5px; }
	.dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.30); }
`;

export default function Settings() {
	const bgStyle = useThemedGradient()
	const theme = useTheme()
	const settings = useSettings()
	const gamification = useGamification()
	const [gamificationPanelOpen, setGamificationPanelOpen] = useState(false)

	function scrollTo(id: string) {
		const el = document.getElementById(id)
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	// Backup & restore (JSON of persisted slices)
	async function exportData() {
		const payload = {
			settings: localStorage.getItem('aq:settings'),
			theme: localStorage.getItem('aq:theme'),
			plan: localStorage.getItem('aq:academic-plan'),
			schedule: localStorage.getItem('aq:schedule'),
			tasks: localStorage.getItem('aq:tasks'),
			scholarships: localStorage.getItem('aq:scholarships'),
			textbooks: localStorage.getItem('aq:textbooks'),
			studySessions: localStorage.getItem('aq:study-sessions'),
			gamification: localStorage.getItem('aq:gamification'),
		}
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'academicquest-backup.json'
		a.click()
		URL.revokeObjectURL(url)
	}

	async function importData() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'application/json'
		input.onchange = async () => {
			const f = input.files?.[0]
			if (!f) return
			const text = await f.text()
			try {
				const obj = JSON.parse(text)
				if (obj.settings) localStorage.setItem('aq:settings', obj.settings)
				if (obj.theme) localStorage.setItem('aq:theme', obj.theme)
				if (obj.plan) localStorage.setItem('aq:academic-plan', obj.plan)
				if (obj.schedule) localStorage.setItem('aq:schedule', obj.schedule)
				if (obj.tasks) localStorage.setItem('aq:tasks', obj.tasks)
				if (obj.scholarships) localStorage.setItem('aq:scholarships', obj.scholarships)
				if (obj.textbooks) localStorage.setItem('aq:textbooks', obj.textbooks)
				if (obj.studySessions) localStorage.setItem('aq:study-sessions', obj.studySessions)
				if (obj.gamification) localStorage.setItem('aq:gamification', obj.gamification)
				window.location.reload()
			} catch {
				alert('Invalid backup file')
			}
		}
		input.click()
	}

	// Gamification reset functions
	const resetGamificationData = () => {
		if (confirm('Are you sure you want to reset all gamification data? This will clear your level, XP, badges, and streaks. This action cannot be undone.')) {
			localStorage.removeItem('aq:gamification')
			window.location.reload()
		}
	}

	const resetStreaks = () => {
		if (confirm('Are you sure you want to reset your streaks? This will set your current and longest streaks to 0.')) {
			gamification.updateStats({ 
				streakDays: 0, 
				longestStreak: 0 
			})
		}
	}

	const clearAllData = () => {
		if (confirm('Are you sure you want to clear ALL data? This will reset everything including settings, academic plans, tasks, and gamification progress. This action cannot be undone.')) {
			// Clear all localStorage data
			const keys = Object.keys(localStorage).filter(key => key.startsWith('aq:'))
			keys.forEach(key => localStorage.removeItem(key))
			window.location.reload()
		}
	}

	return (
		<div className="min-h-screen w-full" style={bgStyle}>
			<style>{scrollbarStyles}</style>
			<div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
				{/* Enhanced header section */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<SettingsIcon className="h-5 w-5" />
							<h1 className="text-2xl font-bold">Settings</h1>
						</div>
						<TopTabsInline active="settings" />
					</div>
					<div className="flex items-center gap-3">
						<Button 
							variant="outline"
							className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
										backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
										border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
										shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
										text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
										font-medium tracking-wide"
							onClick={importData}
						>
							<Upload className="h-4 w-4 mr-2" />
							Import Backup
						</Button>
					</div>
				</div>

				<div className="flex gap-8 lg:gap-12">
					{/* Enhanced navigation sidebar */}
					<div className="w-64 shrink-0 sticky top-6 self-start">
						<Card className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
							<CardContent className="p-6">
								<div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Quick Navigation</div>
								<div className="flex flex-col gap-2">
									{[
										{ id: 'appearance', label: 'Appearance', icon: '🎨' },
										{ id: 'pomodoro', label: 'Pomodoro Timer', icon: '⏰' },
										{ id: 'nav-defaults', label: 'Navigation & Defaults', icon: '🧭' },
										{ id: 'notifications', label: 'Notifications', icon: '🔔' },
										{ id: 'gamification', label: 'Gamification', icon: '🏆' },
										{ id: 'data', label: 'Data Management', icon: '💾' }
									].map(({ id, label, icon }) => (
										<Button 
											key={id}
											variant="ghost" 
											className="justify-start rounded-2xl h-11 px-4 text-left font-medium
													bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/60 dark:to-neutral-900/70
													border border-neutral-200/40 dark:border-neutral-700/40
													hover:from-neutral-50/90 hover:to-neutral-100/80 
													dark:hover:from-neutral-700/60 dark:hover:to-neutral-800/80 
													hover:border-neutral-300/60 dark:hover:border-neutral-600/60
													transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5
													text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100
													shadow-sm hover:shadow-md"
											onClick={() => scrollTo(id)}
										>
											<span className="mr-3 text-base">{icon}</span>
											{label}
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Enhanced main content area */}
					<div className="flex-1">
						<div className="mx-auto max-w-4xl space-y-8">
							{/* Appearance Section */}
							<Card id="appearance" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
											<span className="text-xl">🎨</span>
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Appearance</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Customize the look and feel of your interface</p>
										</div>
									</div>
									
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme mode</label>
											<Select value={theme.mode} onValueChange={(v) => theme.setMode(v as Mode)}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Mode"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="light">☀️ Light</SelectItem>
													<SelectItem value="dark">🌙 Dark</SelectItem>
													<SelectItem value="system">💻 System</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Color palette</label>
											<Select value={theme.palette} onValueChange={(v) => theme.setPalette(v as Palette)}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Palette"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													{Object.keys(PALETTES).map(p => (
														<SelectItem key={p} value={p}>{p}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Font family</label>
											<Select value={theme.font} onValueChange={(v)=> theme.setFont(v)}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Font"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													{["Inter","Poppins","Nunito","Outfit","Roboto","Lato","Montserrat","Source Sans 3"].map(f => (
														<SelectItem key={f} value={f}>{f}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Accent intensity</label>
											<div className="pt-3">
												<Slider 
													value={[theme.accent]} 
													min={0} 
													max={100} 
													step={1} 
													onValueChange={([v]) => theme.setAccent(v)}
													className="w-full" 
												/>
												<div className="flex justify-between text-xs text-neutral-500 mt-1">
													<span>Subtle</span>
													<span>Bold</span>
												</div>
											</div>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Border radius</label>
											<div className="pt-3">
												<Slider 
													value={[theme.radius]} 
													min={8} 
													max={24} 
													step={1} 
													onValueChange={([v]) => theme.setRadius(v)}
													className="w-full" 
												/>
												<div className="flex justify-between text-xs text-neutral-500 mt-1">
													<span>Sharp</span>
													<span>Rounded</span>
												</div>
											</div>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Text scale</label>
											<div className="pt-3">
												<Slider 
													value={[theme.textScale * 100]} 
													min={90} 
													max={110} 
													step={1} 
													onValueChange={([v]) => theme.setTextScale(Number((v/100).toFixed(2)))}
													className="w-full" 
												/>
												<div className="flex justify-between text-xs text-neutral-500 mt-1">
													<span>90%</span>
													<span>110%</span>
												</div>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60">
										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reduced motion</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Minimize animations for accessibility</p>
											</div>
											<Switch checked={settings.reducedMotion} onCheckedChange={(b)=>settings.set({ reducedMotion: b })} />
										</div>

										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Gradients</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Enable gradient backgrounds</p>
											</div>
											<Switch checked={settings.gradientsEnabled} onCheckedChange={(b)=>settings.set({ gradientsEnabled: b })} />
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Pomodoro Timer Section */}
							<Card id="pomodoro" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
											<span className="text-xl">⏰</span>
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Pomodoro Timer</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Configure your focus timer preferences</p>
										</div>
									</div>
									
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Timer position</label>
											<Select value={settings.pomodoroPosition} onValueChange={(v)=>settings.set({ pomodoroPosition: v as PomodoroPosition })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Position"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="draggable">🖱️ Draggable (Snap to corners)</SelectItem>
													<SelectItem value="tl">📍 Static - Top Left</SelectItem>
													<SelectItem value="tr">📍 Static - Top Right</SelectItem>
													<SelectItem value="bl">📍 Static - Bottom Left</SelectItem>
													<SelectItem value="br">📍 Static - Bottom Right</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Timer size</label>
											<Select value={settings.pomodoroSize} onValueChange={(v)=>settings.set({ pomodoroSize: v as PomodoroSize })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Size"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="small">📱 Small</SelectItem>
													<SelectItem value="medium">💻 Medium</SelectItem>
													<SelectItem value="large">🖥️ Large</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60">
										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Auto-hide when not running</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Hide timer when not actively counting down</p>
											</div>
											<Switch checked={settings.pomodoroAutoHide} onCheckedChange={(b)=>settings.set({ pomodoroAutoHide: b })} />
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Navigation & Defaults Section */}
							<Card id="nav-defaults" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
											<span className="text-xl">🧭</span>
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Navigation & Defaults</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Set your preferred navigation and format options</p>
										</div>
									</div>
									
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Default page</label>
											<Select value={settings.defaultRoute} onValueChange={(v)=>settings.set({ defaultRoute: v as DefaultRoute })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue placeholder="Route"/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													{[
														{ value: '/', label: '🏠 Dashboard' },
														{ value: '/planner', label: '📚 Academic Planner' },
														{ value: '/tasks', label: '✅ Tasks' },
														{ value: '/schedule', label: '📅 Schedule' },
														{ value: '/course-planner', label: '🎓 Course Planner' },
														{ value: '/scholarships', label: '💰 Scholarships' },
														{ value: '/textbooks', label: '📖 Textbooks' },
														{ value: '/settings', label: '⚙️ Settings' }
													].map(r => (
														<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Week starts on</label>
											<Select value={String(settings.weekStart)} onValueChange={(v)=>settings.set({ weekStart: Number(v) as 0|1 })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="0">📅 Sunday</SelectItem>
													<SelectItem value="1">📅 Monday</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Time format</label>
											<Select value={settings.time24h ? '24' : '12'} onValueChange={(v)=>settings.set({ time24h: v==='24' })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="12">🕐 12-hour (AM/PM)</SelectItem>
													<SelectItem value="24">🕐 24-hour</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Date format</label>
											<Select value={settings.dateFormat} onValueChange={(v: 'auto' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')=>settings.set({ dateFormat: v })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="auto">🌍 Auto</SelectItem>
													<SelectItem value="MM/DD/YYYY">🇺🇸 MM/DD/YYYY</SelectItem>
													<SelectItem value="DD/MM/YYYY">🇬🇧 DD/MM/YYYY</SelectItem>
													<SelectItem value="YYYY-MM-DD">📊 YYYY-MM-DD</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Autosave interval</label>
											<Select value={String(settings.autosaveSeconds)} onValueChange={(v)=>settings.set({ autosaveSeconds: Number(v) as 10|30|60|120 })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													{[
														{ value: 10, label: '⚡ 10 seconds' },
														{ value: 30, label: '🔄 30 seconds' },
														{ value: 60, label: '⏱️ 1 minute' },
														{ value: 120, label: '⏰ 2 minutes' }
													].map(v => (
														<SelectItem key={v.value} value={String(v.value)}>{v.label}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Currency</label>
											<Select value={settings.preferredCurrency} onValueChange={(v: CurrencyCode)=>settings.set({ preferredCurrency: v })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													{(['USD','EUR','GBP','CAD','AUD','JPY','INR','CNY','KRW','NGN','ZAR','PHP'] as CurrencyCode[]).map(c => (
														<SelectItem key={c} value={c}>💰 {c}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">GPA scale</label>
											<Select value={settings.gpaScale} onValueChange={(v: GPAScale)=>settings.set({ gpaScale: v })}>
												<SelectTrigger className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80">
													<SelectValue/>
												</SelectTrigger>
												<SelectContent className="rounded-2xl border-neutral-200/60 dark:border-neutral-600/40">
													<SelectItem value="4-highest">📊 4.00 is highest</SelectItem>
													<SelectItem value="1-highest">📊 1.00 is highest</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60">
										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Ask before leaving</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Show confirmation dialog when navigating away with unsaved changes</p>
											</div>
											<Switch checked={settings.askBeforeLeave} onCheckedChange={(b)=>settings.set({ askBeforeLeave: b })} />
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Notifications Section */}
							<Card id="notifications" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
											<span className="text-xl">🔔</span>
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Notifications & Effects</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Configure alerts and visual feedback preferences</p>
										</div>
									</div>
									
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">App notifications</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Enable browser notifications for important updates</p>
											</div>
											<Switch checked={settings.notificationsEnabled} onCheckedChange={(b)=>settings.set({ notificationsEnabled: b })} />
										</div>

										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Confetti effects</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Celebrate achievements with confetti animations</p>
											</div>
											<Switch checked={settings.confettiEnabled} onCheckedChange={(b)=>settings.set({ confettiEnabled: b })} />
										</div>

										{/* Enhanced Sound Settings */}
										<div className="col-span-1 md:col-span-2">
											<SoundSettings />
										</div>

										<div className="col-span-1 md:col-span-2">
											<div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">Quiet hours</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Set time range when notifications should be disabled</p>
												<div className="flex gap-3 items-center">
													<div className="flex-1">
														<label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">Start time</label>
														<Input 
															className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80" 
															value={settings.quietStart} 
															onChange={(e)=>settings.set({ quietStart: e.target.value })}
															placeholder="22:00"
														/>
													</div>
													<div className="flex-1">
														<label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">End time</label>
														<Input 
															className="h-10 rounded-2xl border-neutral-200/60 dark:border-neutral-600/40 bg-white/90 dark:bg-neutral-800/80" 
															value={settings.quietEnd} 
															onChange={(e)=>settings.set({ quietEnd: e.target.value })}
															placeholder="08:00"
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Gamification Section */}
							<Card id="gamification" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30">
											<Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Gamification System</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Track your progress and earn achievements</p>
										</div>
									</div>
									
					{/* Enhanced Stats Display */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 rounded-2xl bg-gradient-to-br from-neutral-50/80 to-neutral-100/60 dark:from-neutral-800/50 dark:to-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60">
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
								<span className="text-xl">🎯</span>
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">Level</div>
							<div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{Math.floor(gamification.stats.totalXp / 500) + 1}</div>
						</div>
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
								<span className="text-xl">⚡</span>
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">XP</div>
							<div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{gamification.stats.totalXp}</div>
						</div>
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40">
								<span className="text-xl">🏅</span>
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">Badges</div>
							<div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{gamification.stats.badges.filter(b => b.unlocked).length}</div>
						</div>
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40">
								<span className="text-xl">🔥</span>
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">Streak</div>
							<div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{gamification.stats.streakDays}</div>
						</div>
					</div>

					{/* Earned Badges Display */}
					{gamification.stats.badges.filter(b => b.unlocked).length > 0 && (
						<div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-neutral-50/80 to-neutral-100/60 dark:from-neutral-800/50 dark:to-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40">
									<span className="text-xl">🏆</span>
								</div>
								<div>
									<h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Earned Badges</h3>
									<p className="text-sm text-neutral-600 dark:text-neutral-400">
										{gamification.stats.badges.filter(b => b.unlocked).length} of {gamification.stats.badges.length} badges unlocked
									</p>
								</div>
							</div>
							
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
								{gamification.stats.badges
									.filter(badge => badge.unlocked)
									.sort((a, b) => {
										// Sort by rarity (legendary > epic > rare > common) then by name
										const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
										const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
										return rarityDiff !== 0 ? rarityDiff : a.name.localeCompare(b.name);
									})
									.map((badge) => (
										<div 
											key={badge.id}
											className={`relative p-4 rounded-2xl text-center transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl ${
												badge.rarity === 'legendary' 
													? 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-orange-900/30 border-2 border-yellow-300/60 dark:border-yellow-600/60' 
													: badge.rarity === 'epic'
													? 'bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 border-2 border-purple-300/60 dark:border-purple-600/60'
													: badge.rarity === 'rare'
													? 'bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-cyan-900/30 border-2 border-blue-300/60 dark:border-blue-600/60'
													: 'bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-2 border-green-300/60 dark:border-green-600/60'
											}`}
											title={`${badge.name}: ${badge.description}${badge.unlockedAt ? ` (Earned: ${new Date(badge.unlockedAt).toLocaleDateString()})` : ''}`}
										>
											{/* Rarity indicator */}
											<div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
												badge.rarity === 'legendary' 
													? 'bg-yellow-500 shadow-yellow-300/50' 
													: badge.rarity === 'epic'
													? 'bg-purple-500 shadow-purple-300/50'
													: badge.rarity === 'rare'
													? 'bg-blue-500 shadow-blue-300/50'
													: 'bg-green-500 shadow-green-300/50'
											} shadow-lg`} />
											
											<div className="text-3xl mb-2">{badge.icon}</div>
											<div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
												{badge.name}
											</div>
											<div className="text-xs text-neutral-600 dark:text-neutral-400 leading-tight">
												{badge.description}
											</div>
											
											{/* Progress indicator for badges with progress */}
											{badge.maxProgress && badge.maxProgress > 1 && (
												<div className="mt-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
													<div 
														className={`h-1.5 rounded-full transition-all duration-300 ${
															badge.rarity === 'legendary' ? 'bg-yellow-500' :
															badge.rarity === 'epic' ? 'bg-purple-500' :
															badge.rarity === 'rare' ? 'bg-blue-500' : 'bg-green-500'
														}`}
														style={{ width: '100%' }}
													/>
												</div>
											)}
											
											{/* Completion date */}
											{badge.unlockedAt && (
												<div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
													{new Date(badge.unlockedAt).toLocaleDateString()}
												</div>
											)}
										</div>
									))
								}
							</div>
							
							{/* Empty state */}
							{gamification.stats.badges.filter(b => b.unlocked).length === 0 && (
								<div className="text-center py-8">
									<div className="text-6xl mb-4 opacity-50">🎯</div>
									<h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">No Badges Earned Yet</h3>
									<p className="text-sm text-neutral-500 dark:text-neutral-500">
										Complete tasks, attend classes, and maintain streaks to earn your first badges!
									</p>
								</div>
							)}
						</div>
					)}									{/* Settings Grid */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable gamification</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Track XP, levels, and achievements</p>
											</div>
											<Switch checked={settings.gamificationEnabled} onCheckedChange={(b)=>settings.set({ gamificationEnabled: b })} />
										</div>

										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Show panel</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Display gamification panel in dashboard</p>
											</div>
											<Switch checked={gamificationPanelOpen} onCheckedChange={setGamificationPanelOpen} />
										</div>

										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Show streaks</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Display daily streak counters</p>
											</div>
											<Switch checked={settings.showStreaks} onCheckedChange={(b)=>settings.set({ showStreaks: b })} />
										</div>

										<div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30">
											<div>
												<label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Achievements</label>
												<p className="text-xs text-neutral-500 dark:text-neutral-400">Enable achievement notifications</p>
											</div>
											<Switch checked={settings.achievements} onCheckedChange={(b)=>settings.set({ achievements: b })} />
										</div>
									</div>

									{/* Action Buttons */}
									<div className="pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Button 
												onClick={resetStreaks} 
												variant="outline" 
												className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
														backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
														border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
														shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
														text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
														font-medium tracking-wide h-12"
											>
												<Zap className="mr-2 text-blue-500 dark:text-blue-400" size={16} />
												Reset Streaks
											</Button>
											<Button 
												onClick={resetGamificationData} 
												variant="outline"
												className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
														backdrop-blur-md hover:from-red-50/90 hover:to-pink-50/80 dark:hover:from-red-950/40 dark:hover:to-pink-950/30 
														border-neutral-200/60 dark:border-neutral-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
														shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
														text-neutral-700 dark:text-neutral-200 hover:text-red-700 dark:hover:text-red-300
														font-medium tracking-wide h-12"
											>
												<RotateCcw className="mr-2 text-red-500 dark:text-red-400" size={16} />
												Reset All Progress
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Data Management Section */}
							<Card id="data" className="border-0 bg-white/80 dark:bg-neutral-900/60 rounded-3xl shadow-xl backdrop-blur-md">
								<CardContent className="p-8">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
											<span className="text-xl">💾</span>
										</div>
										<div>
											<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Data Management</h2>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Export, import, or reset your Academic Quest data</p>
										</div>
									</div>
									
									<div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-50/80 to-neutral-100/60 dark:from-neutral-800/50 dark:to-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60 mb-6">
										<div className="flex items-start gap-3 mb-4">
											<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
												<Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<h3 className="font-medium text-neutral-900 dark:text-neutral-100">What's included in backups?</h3>
												<p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
													Export includes all your data: settings, theme preferences, academic plans, schedules, 
													tasks, scholarships, textbooks, study sessions, and gamification progress as a JSON file.
												</p>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<Button 
											variant="outline" 
											onClick={exportData}
											className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
													backdrop-blur-md hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
													border-neutral-200/60 dark:border-neutral-600/40 hover:border-green-200/60 dark:hover:border-emerald-400/30
													shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
													text-neutral-700 dark:text-neutral-200 hover:text-green-700 dark:hover:text-emerald-300
													font-medium tracking-wide h-14"
										>
											<Download size={18} className="mr-2" />
											<div className="text-left">
												<div className="font-medium">Export</div>
												<div className="text-xs opacity-75">Download backup</div>
											</div>
										</Button>
										<Button 
											variant="outline" 
											onClick={importData}
											className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
													backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
													border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
													shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
													text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
													font-medium tracking-wide h-14"
										>
											<Upload size={18} className="mr-2" />
											<div className="text-left">
												<div className="font-medium">Import</div>
												<div className="text-xs opacity-75">Restore backup</div>
											</div>
										</Button>
										<Button 
											variant="outline" 
											onClick={clearAllData}
											className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
													backdrop-blur-md hover:from-red-50/90 hover:to-pink-50/80 dark:hover:from-red-950/40 dark:hover:to-pink-950/30 
													border-neutral-200/60 dark:border-neutral-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
													shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
													text-neutral-700 dark:text-neutral-200 hover:text-red-700 dark:hover:text-red-300
													font-medium tracking-wide h-14"
										>
											<Trash2 size={18} className="mr-2" />
											<div className="text-left">
												<div className="font-medium">Clear All</div>
												<div className="text-xs opacity-75">⚠️ Reset everything</div>
											</div>
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}