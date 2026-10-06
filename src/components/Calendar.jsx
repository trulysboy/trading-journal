import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Calendar({ trades }) {
  const [cursor, setCursor] = useState(new Date())

  const dailyTotals = useMemo(() => {
    const map = {}
    for (const t of trades) {
      const key = t.trade_date
      if (!map[key]) map[key] = { pnl: 0, count: 0 }
      map[key].pnl += Number(t.result_amount ?? 0)
      map[key].count += 1
    }
    return map
  }, [trades])

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor)
    const monthEnd = endOfMonth(cursor)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [cursor])

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h2>Trading Calendar</h2>
        <div className="calendar-nav">
          <button type="button" onClick={() => setCursor((c) => subMonths(c, 1))}>
            ‹
          </button>
          <span>{format(cursor, 'MMMM yyyy')}</span>
          <button type="button" onClick={() => setCursor((c) => addMonths(c, 1))}>
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid calendar-grid-labels">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-label">
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, cursor)
          const data = dailyTotals[key]
          const isWeekend = [0, 6].includes(day.getDay())

          let cellClass = 'calendar-cell'
          if (!inMonth) cellClass += ' calendar-cell-dim'
          else if (isWeekend && !data) cellClass += ' calendar-cell-weekend'
          else if (data?.pnl > 0) cellClass += ' calendar-cell-win'
          else if (data?.pnl < 0) cellClass += ' calendar-cell-loss'

          return (
            <div key={key} className={cellClass}>
              <span className="calendar-date">{format(day, 'd')}</span>
              {data && (
                <>
                  <span className={data.pnl >= 0 ? 'positive' : 'negative'}>
                    {data.pnl >= 0 ? '+' : ''}
                    {data.pnl.toFixed(2)}
                  </span>
                  <span className="calendar-trade-count">
                    {data.count} {data.count === 1 ? 'Trade' : 'Trades'}
                  </span>
                </>
              )}
              {!data && isWeekend && inMonth && (
                <span className="calendar-weekend-label">Weekend</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
