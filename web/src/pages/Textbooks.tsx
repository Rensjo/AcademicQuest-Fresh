import React from 'react'
import TopTabsInline from '@/components/TopTabsInline'
import useThemedGradient from '@/hooks/useThemedGradient'
import { CalendarDays, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useAcademicPlan } from '@/store/academicPlanStore'
import { useTheme, PALETTES } from '@/store/theme'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts'
import { saveToOPFS, getOPFSFileURL } from '@/lib/opfs'
import { useTextbooks } from '@/store/textbooksStore'
import type { Row, TBStatus } from '@/store/textbooksStore'

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

export default function Textbooks() {
	const bgStyle = useThemedGradient()
	const theme = useTheme()
	const COLORS = PALETTES[theme.palette]
	const plan = useAcademicPlan()

	// types moved to store

	// Build a unique, sorted list of courses across all years/terms
	const classOptions = React.useMemo(() => {
		const set = new Set<string>()
		for (const y of plan.years) {
			for (const t of y.terms) {
				for (const c of t.courses) {
					const label = [c.code, c.name].filter(Boolean).join(' — ').trim()
					if (label) set.add(label)
				}
			}
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b))
	}, [plan.years])

	const rows = useTextbooks(s => s.rows)
	const addRowStore = useTextbooks(s => s.addRow)
	const updateRow = useTextbooks(s => s.updateRow)
	const removeRow = useTextbooks(s => s.removeRow)

	function setRow(id: string, patch: Partial<Row>) { updateRow(id, patch) }
	function addRow() {
		const id = addRowStore()
		if (classOptions.length) updateRow(id, { classLabel: classOptions[0] })
	}

	async function attachOrOpen(row: Row) {
		if (row.status === 'Digital') {
			if (row.linkUrl) {
				window.open(row.linkUrl, '_blank')
				return
			}
			const url = window.prompt('Enter textbook link (URL)')
			if (url && /^https?:\/\//i.test(url)) setRow(row.id, { linkUrl: url })
			return
		}
		// File attach for non-digital; if already present, open it
		if (row.filePath) {
			const openUrl = await getOPFSFileURL(row.filePath)
			if (openUrl) window.open(openUrl, '_blank')
			return
		}
		await new Promise<void>((resolve) => {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.heic,.webp,.epub,.mobi,.txt,application/*,image/*,text/*'
			input.onchange = async () => {
				const f = input.files?.[0]
				if (!f) return resolve()
				const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
				const path = `textbooks/${row.id}/${Date.now()}_${safe}`
				const res = await saveToOPFS(path, f)
				if (res.ok) setRow(row.id, { filePath: path })
				resolve()
			}
			input.click()
		})
	}

	// Status counts for chart
	const counts = React.useMemo(() => {
		const base: Record<TBStatus, number> = { Ordered: 0, Shipped: 0, Received: 0, Returned: 0, Digital: 0 }
		for (const r of rows) base[r.status]++
		return base
	}, [rows])

	const chartData = React.useMemo(() => [
		{ name: 'Ordered', v: counts.Ordered },
		{ name: 'Shipped', v: counts.Shipped },
		{ name: 'Received', v: counts.Received },
		{ name: 'Returned', v: counts.Returned },
		{ name: 'Digital', v: counts.Digital },
	], [counts])

	return (
		<div className="min-h-screen w-full" style={bgStyle}>
			<style>{scrollbarStyles}</style>
			<div className="max-w-[1400px] mx-auto px-3 py-6 space-y-6">
				{/* Header + chart */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<CalendarDays className="h-5 w-5" />
								<h1 className="text-2xl font-bold">Textbooks</h1>
							</div>
							<TopTabsInline active="textbooks" />
						</div>
					</div>
					<Card className="shrink-0 border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60 w-[260px]">
						<CardContent className="p-4">
							<div className="h-36">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={chartData} barSize={16}>
										<CartesianGrid strokeDasharray="3 3" opacity={0.25} />
										<XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
										<Tooltip />
										<Bar dataKey="v" fill={COLORS[0]} radius={[6, 6, 0, 0]} isAnimationActive />
									</BarChart>
								</ResponsiveContainer>
							</div>
							<div className="text-center text-sm mt-1">Status overview</div>
						</CardContent>
					</Card>
				</div>

				{/* Table */}
				<Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
					<CardContent className="p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="text-sm font-semibold">Books</div>
							<Button size="sm" className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90 
																		hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
																		text-white shadow-lg ring-2 ring-green-200/50 dark:ring-green-400/30 backdrop-blur-sm border-0
																		transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
																		font-medium tracking-wide hover:ring-green-300/60 dark:hover:ring-green-300/40" onClick={addRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
						</div>
						<div className="w-full overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 shadow-sm">
							<table className="w-full text-xs">
								<thead className="sticky top-0 bg-white/70 dark:bg-neutral-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/40">
									<tr className="text-left">
										<th className="px-3 py-2 w-[50px]"></th>
										<th className="px-3 py-2 w-[220px]">Class</th>
										<th className="px-3 py-2 w-[260px]">Textbook Title</th>
										<th className="px-3 py-2 w-[200px]">Company</th>
										<th className="px-3 py-2 w-[220px]">Book Link</th>
										<th className="px-3 py-2 w-[150px]">Status</th>
										<th className="px-3 py-2 w-[150px]">Purchased On</th>
										<th className="px-3 py-2 w-[150px]">Return By</th>
									</tr>
								</thead>
								<tbody>
									{rows.map(r => (
										<tr key={r.id} className="border-t border-black/5 dark:border-white/10">
											<td className="px-2 py-2">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-black/10 text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-red-950/30"
													aria-label="Delete row"
													onClick={() => removeRow(r.id)}
												>
													<Trash2 className="h-4 w-4 bg-white/80 dark:bg-neutral-900/60 border-black/10" />
												</Button>
											</td>
											<td className="px-2 py-2">
												<Select value={r.classLabel} onValueChange={(v) => setRow(r.id, { classLabel: v })}>
													<SelectTrigger className="h-8 text-left text-xs bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40"><SelectValue placeholder="Select class"/></SelectTrigger>
													<SelectContent className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-black/10 dark:border-white/10 max-h-72 overflow-auto">
														{classOptions.length ? classOptions.map(lbl => (
															<SelectItem key={lbl} value={lbl}>{lbl}</SelectItem>
														)) : (
															<SelectItem disabled value="__no_courses__">No courses yet</SelectItem>
														)}
													</SelectContent>
												</Select>
											</td>
											<td className="px-2 py-2"><Input className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" value={r.title} onChange={(e) => setRow(r.id, { title: e.target.value })} placeholder="Title"/></td>
											<td className="px-2 py-2"><Input className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" value={r.company} onChange={(e) => setRow(r.id, { company: e.target.value })} placeholder="Publisher / Company"/></td>
											<td className="px-2 py-2">
												{r.status === 'Digital' ? (
														<div className="flex items-center gap-2 h-8 rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 px-2">
															<Input
																className="h-6 flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-500 text-xs"
																placeholder="https://..."
																value={r.linkUrl || ''}
																onChange={(e) => setRow(r.id, { linkUrl: e.target.value })}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') {
																		const url = (e.currentTarget.value || '').trim()
																		if (/^https?:\/\//i.test(url)) window.open(url, '_blank')
																	}
															}}
															/>
															<Button
																variant="ghost"
																size="icon"
																className="group h-6 w-6 bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:bg-transparent dark:hover:bg-transparent"
																onClick={() => {
																	const url = (r.linkUrl || '').trim()
																	if (/^https?:\/\//i.test(url)) {
																		window.open(url, '_blank')
																	} else {
																		// Fallback to prompt or focus input if invalid/empty
																		const prompted = window.prompt('Enter textbook link (URL)', url)
																		if (prompted && /^https?:\/\//i.test(prompted)) setRow(r.id, { linkUrl: prompted })
																	}
																}}
																aria-label={r.linkUrl ? 'Open textbook link' : 'Attach textbook link'}
															>
																<LinkIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />
															</Button>
														</div>
												) : (
													<div className="flex items-center gap-2 h-8 rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 px-2">
															<Button
															variant="ghost"
															size="sm"
																className="group h-6 px-1 bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:bg-transparent dark:hover:bg-transparent"
															aria-label={r.filePath ? 'Open textbook file' : 'Attach textbook file'}
															onClick={() => attachOrOpen(r)}
														>
																{r.filePath ? <span className="text-xs">Attached</span> : <LinkIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />}
														</Button>
													</div>
												)}
											</td>
											<td className="px-2 py-2">
												<Select value={r.status} onValueChange={(v) => setRow(r.id, { status: v as TBStatus })}>
													<SelectTrigger className="h-8 text-left text-xs bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40"><SelectValue placeholder="Status"/></SelectTrigger>
													<SelectContent className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-black/10 dark:border-white/10">
														{(['Ordered','Shipped','Received','Returned','Digital'] as TBStatus[]).map(s => (
															<SelectItem key={s} value={s}>{s}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</td>
											<td className="px-2 py-2"><Input className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" type="date" value={r.purchasedOn || ''} onChange={(e) => setRow(r.id, { purchasedOn: e.target.value })}/></td>
											<td className="px-2 py-2"><Input className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" type="date" value={r.returnBy || ''} onChange={(e) => setRow(r.id, { returnBy: e.target.value })}/></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}