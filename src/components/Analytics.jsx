import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

export default function Analytics({ trades }) {
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.result_amount != null)
    const wins = closed.filter((t) => t.result_amount > 0)
    const losses = closed.filter((t) => t.result_amount < 0)
    const followed = closed.filter((t) => t.followed_rules)
    const followedWins = followed.filter((t) => t.result_amount > 0)

    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
    const avgRR =
      closed.filter((t) => t.result_rr != null).reduce((sum, t) => sum + t.result_rr, 0) /
      (closed.filter((t) => t.result_rr != null).length || 1)
    const ruleAdherenceRate = closed.length ? (followed.length / closed.length) * 100 : 0
    const followedWinRate = followed.length ? (followedWins.length / followed.length) * 100 : 0

    const totalPnl = closed.reduce((sum, t) => sum + Number(t.result_amount), 0)

    return {
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      avgRR,
      ruleAdherenceRate,
      followedWinRate,
      totalPnl,
    }
  }, [trades])

  const equityCurve = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.result_amount != null)
      .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))

    let running = 0
    return sorted.map((t, i) => {
      running += Number(t.result_amount)
      return { index: i + 1, date: t.trade_date, equity: Math.round(running * 100) / 100 }
    })
  }, [trades])

  const bySetup = useMemo(() => {
    const map = {}
    for (const t of trades) {
      if (t.result_amount == null) continue
      const key = t.setup_type || 'unspecified'
      if (!map[key]) map[key] = { setup: key, pnl: 0, count: 0 }
      map[key].pnl += Number(t.result_amount)
      map[key].count += 1
    }
    return Object.values(map)
  }, [trades])

  return (
    <div className="analytics">
      <h2>Analytics</h2>

      <div className="stat-grid">
        <StatTile label="Total trades" value={stats.totalTrades} />
        <StatTile label="Win rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatTile label="Avg R:R achieved" value={`${stats.avgRR.toFixed(2)}R`} />
        <StatTile
          label="Total P/L"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          tone={stats.totalPnl >= 0 ? 'positive' : 'negative'}
        />
        <StatTile label="Rule adherence" value={`${stats.ruleAdherenceRate.toFixed(0)}%`} />
        <StatTile label="Win rate when rules followed" value={`${stats.followedWinRate.toFixed(1)}%`} />
      </div>

      <div className="chart-block">
        <h3>Equity curve</h3>
        {equityCurve.length === 0 ? (
          <p className="empty-state">No closed trades yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={equityCurve} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                labelFormatter={(i) => equityCurve[i - 1]?.date}
                formatter={(v) => [`$${v}`, 'Cumulative P/L']}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-block">
        <h3>P/L by setup type</h3>
        {bySetup.length === 0 ? (
          <p className="empty-state">No closed trades yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bySetup} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="setup" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                formatter={(v) => [`$${v}`, 'P/L']}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {bySetup.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? 'var(--positive)' : 'var(--negative)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, tone }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone ?? ''}`}>{value}</span>
    </div>
  )
}
