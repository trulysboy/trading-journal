// P/L calculation helpers.
//
// Different brokers quote different "point/pip value per 1.0 lot" for the same
// instrument, so these are starting defaults, not universal truths — the form lets
// you override the multiplier per trade if your broker's number differs.
// Calibrate once against a real closed trade from your broker and these should hold.

export const SYMBOL_DEFAULTS = {
  NAS100: { label: 'NAS100 / US100 / NDX100', multiplier: 10 },  // $ per point per 1.0 lot
  US30: { label: 'US30', multiplier: 10 },
  SPX500: { label: 'SPX500 / US500', multiplier: 10 },
  XAUUSD: { label: 'XAUUSD (Gold)', multiplier: 100 },           // $ per $1 move per 1.0 lot
  EURUSD: { label: 'EURUSD', multiplier: 100000 },                // $ per 1.0 price unit per 1.0 lot (i.e. $10/pip)
  GBPUSD: { label: 'GBPUSD', multiplier: 100000 },
  USDJPY: { label: 'USDJPY', multiplier: 1000 },
}

export function getDefaultMultiplier(symbol) {
  const key = (symbol || '').toUpperCase().trim()
  return SYMBOL_DEFAULTS[key]?.multiplier ?? 100000
}

/**
 * Calculate P/L in account currency.
 * @param {object} params
 * @param {'buy'|'sell'} params.direction
 * @param {number} params.entry
 * @param {number} params.exit
 * @param {number} params.lotSize
 * @param {number} params.multiplier - $ per 1.0 price-unit move per 1.0 lot
 */
export function calculatePnl({ direction, entry, exit, lotSize, multiplier }) {
  if (
    entry == null ||
    exit == null ||
    lotSize == null ||
    multiplier == null ||
    Number.isNaN(entry) ||
    Number.isNaN(exit) ||
    Number.isNaN(lotSize) ||
    Number.isNaN(multiplier)
  ) {
    return null
  }

  const priceDiff = direction === 'buy' ? exit - entry : entry - exit
  const pnl = priceDiff * lotSize * multiplier
  return Math.round(pnl * 100) / 100
}

/**
 * Calculate the R-multiple actually achieved, given the planned risk amount.
 */
export function calculateResultRR(resultAmount, riskAmount) {
  if (resultAmount == null || !riskAmount) return null
  return Math.round((resultAmount / riskAmount) * 100) / 100
}
