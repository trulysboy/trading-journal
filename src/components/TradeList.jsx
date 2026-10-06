import { useMemo, useState } from 'react'

export default function TradeList({ trades }) {
  const [setupFilter, setSetupFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)

  const setupTypes = useMemo(
    () => ['all', ...new Set(trades.map((t) => t.setup_type).filter(Boolean))],
    [trades]
  )

  const filtered = useMemo(() => {
    let list = trades

    if (setupFilter !== 'all') {
      list = list.filter((t) => t.setup_type === setupFilter)
    }

    if (resultFilter === 'win') {
      list = list.filter((t) => (t.result_amount ?? 0) > 0)
    } else if (resultFilter === 'loss') {
      list = list.filter((t) => (t.result_amount ?? 0) < 0)
    } else if (resultFilter === 'breakeven') {
      list = list.filter((t) => (t.result_amount ?? 0) === 0)
    }

    return [...list].sort((a, b) =>
      sortDesc
        ? new Date(b.trade_date) - new Date(a.trade_date)
        : new Date(a.trade_date) - new Date(b.trade_date)
    )
  }, [trades, setupFilter, resultFilter, sortDesc])

  return (
    <div className="trade-list">
      <div className="trade-list-header">
        <h2>Trade log</h2>

        <div className="trade-list-filters">
          <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
            {setupTypes.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All setups' : s}
              </option>
            ))}
          </select>

          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
            <option value="all">All results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakeven</option>
          </select>

          <button type="button" onClick={() => setSortDesc((d) => !d)}>
            Date {sortDesc ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No trades match these filters yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Dir</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Lots</th>
                <th>Setup</th>
                <th>Rules?</th>
                <th>Mood</th>
                <th>P/L</th>
                <th>R</th>
                <th>Chart</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.trade_date}</td>
                  <td>{t.symbol}</td>
                  <td className={t.direction === 'buy' ? 'positive' : 'negative'}>
                    {t.direction}
                  </td>
                  <td>{t.entry_price}</td>
                  <td>{t.exit_price ?? '—'}</td>
                  <td>{t.lot_size}</td>
                  <td>{t.setup_type ?? '—'}</td>
                  <td>{t.followed_rules ? '✓' : '✗'}</td>
                  <td>{t.emotional_state ?? '—'}</td>
                  <td className={t.result_amount > 0 ? 'positive' : t.result_amount < 0 ? 'negative' : ''}>
                    {t.result_amount != null ? `$${t.result_amount}` : '—'}
                  </td>
                  <td>{t.result_rr != null ? `${t.result_rr}R` : '—'}</td>
                  <td>
                    {t.screenshot_url ? (
                      <a href={t.screenshot_url} target="_blank" rel="noreferrer">
                        view
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
