import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import TradeForm from '../components/TradeForm'
import TradeList from '../components/TradeList'
import Calendar from '../components/Calendar'
import Analytics from '../components/Analytics'

const TABS = ['Log Trade', 'Trades', 'Calendar', 'Analytics']

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Log Trade')

  const loadTrades = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })

    if (!error) setTrades(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Trading Journal</h1>
        <div className="dashboard-user">
          <span>{user?.email}</span>
          <button onClick={signOut}>Log out</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? 'tab-active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {loading ? (
          <p className="empty-state">Loading your trades…</p>
        ) : (
          <>
            {tab === 'Log Trade' && <TradeForm onSaved={loadTrades} />}
            {tab === 'Trades' && <TradeList trades={trades} />}
            {tab === 'Calendar' && <Calendar trades={trades} />}
            {tab === 'Analytics' && <Analytics trades={trades} />}
          </>
        )}
      </main>
    </div>
  )
}
