import React from 'react'
import TopTabsInline from '@/components/TopTabsInline'
import useThemedGradient from '@/hooks/useThemedGradient'
import { CalendarDays, Plus, Link as LinkIcon, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useTheme, PALETTES } from '@/store/theme'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { saveToOPFS, getOPFSFileURL } from '@/lib/opfs'
import { useSettings } from '@/store/settingsStore'
import { useScholarships } from '@/store/scholarshipsStore'
import type { Row, Status } from '@/store/scholarshipsStore'

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

export default function Scholarships() {
	const bgStyle = useThemedGradient()
	const theme = useTheme()
	const COLORS = PALETTES[theme.palette]
	const settings = useSettings()

	const rows = useScholarships(s => s.rows)
	const addRowStore = useScholarships(s => s.addRow)
	const updateRowStore = useScholarships(s => s.updateRow)
	const removeRow = useScholarships(s => s.removeRow)

	function setRow(id: string, patch: Partial<Row>) {
		updateRowStore(id, patch)
	}

	function addRow() {
		addRowStore()
	}

	// Attachment helpers
		type AttachKind = 'resume' | 'essay' | 'otherDocs'
	async function attachFile(id: string, kind: AttachKind) {
		return new Promise<void>((resolve) => {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.pdf,.doc,.docx,.txt,.rtf,.md,.png,.jpg,.jpeg,.heic,.webp,.ppt,.pptx,.xls,.xlsx,application/*,text/*,image/*'
			if (kind === 'otherDocs') input.multiple = true
			input.onchange = async () => {
				const files = input.files ? Array.from(input.files) : []
				if (!files.length) return resolve()
				const savedPaths: string[] = []
				for (const f of files) {
					const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
					const path = `scholarships/${id}/${kind}/${Date.now()}_${safeName}`
					const res = await saveToOPFS(path, f)
					if (res.ok) savedPaths.push(path)
				}
				const r = rows.find(x => x.id === id)
				if (r) {
					const update: Partial<Row> = {}
					if (kind === 'resume') { update.resume = true; update.resumePath = savedPaths[0] }
					if (kind === 'essay') { update.essay = true; update.essayPath = savedPaths[0] }
					if (kind === 'otherDocs') { update.otherDocs = true; update.otherDocsPaths = [ ...(r.otherDocsPaths ?? []), ...savedPaths ] }
					updateRowStore(id, update)
				}
				resolve()
			}
			// trigger
			input.click()
		})
	}

	async function openAttachment(r: Row, kind: AttachKind) {
		const path = kind === 'resume'
			? r.resumePath
			: kind === 'essay'
				? r.essayPath
				: (r.otherDocsPaths && r.otherDocsPaths.length ? r.otherDocsPaths[r.otherDocsPaths.length - 1] : undefined)
		if (!path) return
		const url = await getOPFSFileURL(path)
		if (url) window.open(url, '_blank')
	}

	// days left helper
	function daysLeft(date?: string) {
		if (!date) return undefined
		const today = new Date()
		const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
	const d = new Date(date)
	if (Number.isNaN(d.getTime())) return undefined
		const d1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
		return Math.round((d1 - d0) / (1000 * 60 * 60 * 24))
	}

	const todayStr = React.useMemo(
		() => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()),
		[]
	)

	// donut data by status
	const counts = React.useMemo(() => {
		const base: Record<Status, number> = {
			'Received': 0,
			'Applied': 0,
			'In-Progress': 0,
			'Rejected': 0,
			'Not Started': 0,
		}
		for (const r of rows) base[r.status as keyof typeof base]++
		return base
	}, [rows])

	const donut = React.useMemo(
		() => [
			{ name: 'Received', value: counts['Received'] },
			{ name: 'Applied', value: counts['Applied'] },
			{ name: 'In-Progress', value: counts['In-Progress'] },
			{ name: 'Rejected', value: counts['Rejected'] },
			{ name: 'Not Started', value: counts['Not Started'] },
		],
		[counts]
	)

	return (
		<div className="min-h-screen w-full" style={bgStyle}>
			<style>{scrollbarStyles}</style>
			<div className="max-w-[1400px] mx-auto px-3 py-6 space-y-6">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<CalendarDays className="h-5 w-5" />
								<h1 className="text-2xl font-bold">Scholarships</h1>
							</div>
							<TopTabsInline active="scholarships" />
						</div>
					</div>
					<Card className="shrink-0 shadow-xl rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-white/20 dark:border-gray-600/20 w-[200px] sm:w-[220px]">
						<CardContent className="p-4">
							<div className="h-32">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie dataKey="value" data={donut} innerRadius={38} outerRadius={50} startAngle={90} endAngle={-270} paddingAngle={2} cornerRadius={3} stroke="transparent">
											{donut.map((_, i) => (
												<Cell key={i} fill={COLORS[i % COLORS.length]} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="text-center text-sm mt-1">Status mix</div>
							<div className="text-center text-xs text-muted-foreground">{todayStr}</div>
						</CardContent>
					</Card>
				</div>

				{/* Table card */}
				<Card className="shadow-xl rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-white/20 dark:border-gray-600/20">
					<CardContent className="p-6">
						<div className="flex items-center justify-between mb-6">
							<div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Applications</div>
							<Button 
								size="sm" 
								className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 
										  hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-400 dark:hover:to-emerald-400 
										  text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium tracking-wide
										  border-0 backdrop-blur-sm hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
										  ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40" 
								onClick={addRow}
							>
								<Plus className="h-4 w-4 mr-1"/>Add Scholarship
							</Button>
						</div>
						<div className="w-full overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 shadow-sm backdrop-blur-sm">
							<table className="w-full text-xs">
								<thead className="sticky top-0 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/40 border-b border-black/10 dark:border-white/10">
									<tr className="text-left">
										<th className="px-3 py-2 w-[50px] font-semibold text-gray-700 dark:text-gray-200"></th>
										<th className="px-3 py-2 w-[170px] font-semibold text-gray-700 dark:text-gray-200">Status</th>
										<th className="px-3 py-2 w-[320px] font-semibold text-gray-700 dark:text-gray-200">Scholarship Name</th>
										<th className="px-3 py-2 w-[180px] font-semibold text-gray-700 dark:text-gray-200">Location</th>
										<th className="px-3 py-2 w-[140px] font-semibold text-gray-700 dark:text-gray-200">Date Due</th>
										<th className="px-3 py-2 w-[110px] font-semibold text-gray-700 dark:text-gray-200">Days Left</th>
										<th className="px-3 py-2 w-[150px] font-semibold text-gray-700 dark:text-gray-200">Date Submitted</th>
										<th className="px-3 py-2 w-[110px] font-semibold text-gray-700 dark:text-gray-200">Resume</th>
										<th className="px-3 py-2 w-[90px] font-semibold text-gray-700 dark:text-gray-200">Essay</th>
										<th className="px-3 py-2 w-[150px] font-semibold text-gray-700 dark:text-gray-200">Other Documents</th>
										<th className="px-3 py-2 w-[160px] font-semibold text-gray-700 dark:text-gray-200">Amount Awarded</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((r) => (
										<tr key={r.id} className="border-t border-black/5 dark:border-white/10 hover:bg-white/30 dark:hover:bg-neutral-700/20 transition-colors duration-200">
											<td className="px-2 py-2">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-black/10 text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-red-950/30"
													aria-label="Delete row"
													onClick={() => removeRow(r.id)}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</td>
											<td className="px-2 py-2">
												<Select value={r.status} onValueChange={(v) => setRow(r.id, { status: v as Status })}>
													<SelectTrigger className="h-8 text-left rounded-lg bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
																			  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
																			  transition-all duration-200 backdrop-blur-sm text-xs">
														<SelectValue placeholder="Status"/>
													</SelectTrigger>
													<SelectContent className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/30 rounded-xl shadow-lg">
														{(['Received','Applied','In-Progress','Rejected','Not Started'] as Status[]).map(s => (
															<SelectItem key={s} value={s}>{s}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</td>
											<td className="px-2 py-2">
												<Input 
													className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
															  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
															  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
													value={r.name} 
													onChange={(e) => setRow(r.id, { name: e.target.value })} 
													placeholder="Scholarship name"
												/>
											</td>
											<td className="px-2 py-2">
												<Input 
													className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
															  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
															  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
													value={r.location} 
													onChange={(e) => setRow(r.id, { location: e.target.value })} 
													placeholder="Location"
												/>
											</td>
											<td className="px-2 py-2">
												<Input 
													className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
															  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
															  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
													type="date" 
													value={r.dueDate || ''} 
													onChange={(e) => setRow(r.id, { dueDate: e.target.value })}
												/>
											</td>
											<td className="px-2 py-2 text-center">
												{(() => {
													const d = daysLeft(r.dueDate)
													if (d === undefined) return <span className="text-muted-foreground text-xs">—</span>
													const cls = d < 0 ? 'text-red-500' : d === 0 ? 'text-amber-600' : ''
													return <span className={`${cls} text-xs font-medium`}>{d}d</span>
												})()}
											</td>
											<td className="px-2 py-2">
												<Input 
													className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
															  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
															  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
													type="date" 
													value={r.submittedDate || ''} 
													onChange={(e) => setRow(r.id, { submittedDate: e.target.value })}
												/>
											</td>
											<td className="px-2 py-2">
												<Button
													variant="link"
													size="sm"
													className="group h-8 px-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
													title={r.resumePath ? r.resumePath.split('/').pop() : undefined}
													aria-label={r.resume ? 'Open resume' : 'Attach resume'}
													onClick={() => (r.resumePath ? openAttachment(r, 'resume') : attachFile(r.id, 'resume'))}
												>
													{r.resume ? <span className="text-xs">Attached</span> : <LinkIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />}
												</Button>
											</td>
											<td className="px-2 py-2">
												<Button
													variant="link"
													size="sm"
													className="group h-6 w-6 px-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
													title={r.essayPath ? r.essayPath.split('/').pop() : undefined}
													aria-label={r.essay ? 'Open essay' : 'Attach essay'}
													onClick={() => (r.essayPath ? openAttachment(r, 'essay') : attachFile(r.id, 'essay'))}
												>
													{r.essay ? <span className="text-xs">Attached</span> : <LinkIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />}
												</Button>
											</td>
											<td className="px-2 py-2">
												<Button
													variant="link"
													size="sm"
													className="group h-6 w-6 px-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
													title={r.otherDocsPaths && r.otherDocsPaths.length ? `${r.otherDocsPaths.length} file(s)` : undefined}
													aria-label={r.otherDocs ? 'Open other documents' : 'Attach other documents'}
													onClick={() => ((r.otherDocsPaths && r.otherDocsPaths.length) ? openAttachment(r, 'otherDocs') : attachFile(r.id, 'otherDocs'))}
												>
													{r.otherDocs ? <span className="text-xs">{`${r.otherDocsPaths?.length ?? 0} file(s)`}</span> : <LinkIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />}
												</Button>
											</td>
											<td className="px-2 py-2">
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground w-8 text-right text-xs">
														{new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.preferredCurrency }).formatToParts(0).find(p => p.type === 'currency')?.value}
													</span>
													<Input 
														className="h-8 rounded-lg bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
																  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
																  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
														type="number" 
														step="0.01" 
														value={r.amountAwarded ?? ''} 
														onChange={(e) => setRow(r.id, { amountAwarded: e.target.value === '' ? undefined : Number(e.target.value) })} 
														placeholder="0.00"
													/>
												</div>
											</td>
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