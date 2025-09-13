import React from 'react'


function getMonthMatrix(date = new Date()) {
const y = date.getFullYear();
const m = date.getMonth();
const first = new Date(y, m, 1);
const startDay = first.getDay(); // 0..6
const daysInMonth = new Date(y, m+1, 0).getDate();
const cells: Array<number|null> = Array(startDay).fill(null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1))
while (cells.length % 7 !== 0) cells.push(null)
return { y, m, cells }
}


export default function CalendarMini({ accent = '#0ea5e9' }: { accent?: string }) {
const { y, m, cells } = getMonthMatrix()
const today = new Date()
const isToday = (d: number|null) => d !== null && d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
const monthName = new Date(y, m, 1).toLocaleString(undefined, { month: 'long' })


return (
<div className="rounded-2xl border border-black/5 bg-white/90 p-3">
<div className="flex items-center justify-between mb-2">
<div className="text-sm font-semibold">{monthName} {y}</div>
<div className="text-xs text-neutral-500">Today: {today.toLocaleDateString()}</div>
</div>
<div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500 mb-1">
{['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
</div>
<div className="grid grid-cols-7 gap-1 text-center">
{cells.map((d, i) => (
<div key={i} className={`h-7 rounded-md flex items-center justify-center text-sm ${d? 'text-neutral-800' : 'text-transparent'}`}
style={isToday(d) ? { background: accent, color: '#fff' } : undefined}>
{d ?? '•'}
</div>
))}
</div>
</div>
)
}