import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { calculatePnl, calculateResultRR, getDefaultMultiplier } from '../lib/pnl'

const SETUP_TYPES = ['10am-fvg', 'powell-model', 'other']
const EMOTIONAL_STATES = ['calm', 'confident', 'fomo', 'revenge-tempted', 'anxious', 'neutral']

const emptyForm = {
  trade_date: new Date().toISOString().slice(0, 10),
  symbol: '',
  direction: 'buy',
  entry_price: '',
  exit_price: '',
  stop_loss: '',
  take_profit: '',
  lot_size: '',
  multiplier: '',
  risk_amount: '',
  planned_rr: '',
  setup_type: SETUP_TYPES[0],
  session: '',
  followed_rules: true,
  emotional_state: 'calm',
  notes: '',
}

export default function TradeForm({ onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill a sensible multiplier default whenever the symbol changes,
  // but don't clobber a value the user already typed in by hand.
  useEffect(() => {
    if (form.symbol && !form.multiplier) {
      setForm((f) => ({ ...f, multiplier: String(getDefaultMultiplier(form.symbol)) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.symbol])

  const pnl = calculatePnl({
    direction: form.direction,
    entry: parseFloat(form.entry_price),
    exit: parseFloat(form.exit_price),
    lotSize: parseFloat(form.lot_size),
    multiplier: parseFloat(form.multiplier),
  })

  const resultRR = calculateResultRR(pnl, parseFloat(form.risk_amount))

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      let screenshot_url = null

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('trade-screenshots')
          .upload(filePath, screenshot)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(filePath)
        screenshot_url = urlData.publicUrl
      }

      const payload = {
        user_id: user.id,
        trade_date: form.trade_date,
        symbol: form.symbol.toUpperCase().trim(),
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
        take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
        lot_size: parseFloat(form.lot_size),
        risk_amount: form.risk_amount ? parseFloat(form.risk_amount) : null,
        planned_rr: form.planned_rr ? parseFloat(form.planned_rr) : null,
        result_amount: pnl,
        result_rr: resultRR,
        setup_type: form.setup_type,
        session: form.session || null,
        followed_rules: form.followed_rules,
        emotional_state: form.emotional_state,
        notes: form.notes || null,
        screenshot_url,
      }

      const { error: insertError } = await supabase.from('trades').insert(payload)
      if (insertError) throw insertError

      setForm(emptyForm)
      setScreenshot(null)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      <h2>Log a trade</h2>

      <div className="form-grid">
        <label>
          Date
          <input
            type="date"
            value={form.trade_date}
            onChange={(e) => update('trade_date', e.target.value)}
            required
          />
        </label>

        <label>
          Symbol
          <input
            type="text"
            placeholder="NAS100"
            value={form.symbol}
            onChange={(e) => update('symbol', e.target.value)}
            required
          />
        </label>

        <label>
          Direction
          <select value={form.direction} onChange={(e) => update('direction', e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label>
          Lot size
          <input
            type="number"
            step="any"
            placeholder="0.01"
            value={form.lot_size}
            onChange={(e) => update('lot_size', e.target.value)}
            required
          />
        </label>

        <label>
          Entry price
          <input
            type="number"
            step="any"
            value={form.entry_price}
            onChange={(e) => update('entry_price', e.target.value)}
            required
          />
        </label>

        <label>
          Exit price
          <input
            type="number"
            step="any"
            value={form.exit_price}
            onChange={(e) => update('exit_price', e.target.value)}
          />
        </label>

        <label>
          Stop loss
          <input
            type="number"
            step="any"
            value={form.stop_loss}
            onChange={(e) => update('stop_loss', e.target.value)}
          />
        </label>

        <label>
          Take profit
          <input
            type="number"
            step="any"
            value={form.take_profit}
            onChange={(e) => update('take_profit', e.target.value)}
          />
        </label>

        <label>
          $ per point (multiplier)
          <input
            type="number"
            step="any"
            value={form.multiplier}
            onChange={(e) => update('multiplier', e.target.value)}
          />
          <span className="field-hint">Auto-filled — adjust if it doesn't match your broker</span>
        </label>

        <label>
          Risk amount ($)
          <input
            type="number"
            step="any"
            placeholder="20"
            value={form.risk_amount}
            onChange={(e) => update('risk_amount', e.target.value)}
          />
        </label>

        <label>
          Planned R:R
          <input
            type="number"
            step="any"
            placeholder="3"
            value={form.planned_rr}
            onChange={(e) => update('planned_rr', e.target.value)}
          />
        </label>

        <label>
          Setup type
          <select value={form.setup_type} onChange={(e) => update('setup_type', e.target.value)}>
            {SETUP_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Session
          <input
            type="text"
            placeholder="New York"
            value={form.session}
            onChange={(e) => update('session', e.target.value)}
          />
        </label>

        <label>
          Emotional state
          <select
            value={form.emotional_state}
            onChange={(e) => update('emotional_state', e.target.value)}
          >
            {EMOTIONAL_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.followed_rules}
            onChange={(e) => update('followed_rules', e.target.checked)}
          />
          Followed my system rules on this trade
        </label>

        <label className="full-width">
          Notes
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
          />
        </label>

        <label className="full-width">
          Screenshot
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="pnl-preview">
        <span>Calculated P/L: </span>
        <strong className={pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : ''}>
          {pnl != null ? `$${pnl}` : '—'}
        </strong>
        {resultRR != null && <span className="pnl-rr"> ({resultRR}R)</span>}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save trade'}
      </button>
    </form>
  )
}
