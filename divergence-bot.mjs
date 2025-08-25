/*
  divergence-bot.mjs – HPS Quad Divergence (Bolt‑ready)
  -----------------------------------------------------
  Implements John Kurisko–style "HPS – Quad Divergence" long/short setup.
  • Detects two‑stage pullback with all Stoch bands < 20 (or > 80 for shorts)
  • Second low/high with Stoch(9,3) higher‑low / lower‑high (divergence)
  • Entry on Stoch(9,3) cross back through 20/80 + EMA filter
  • Stop under/over pattern low/high or ATR buffer
  • Take‑profit RR + optional Stoch(9,3) > 80 / < 20 exit + trailing ATR

  RUN (paper mode):
    EXCHANGE=binance SYMBOL=BTC/USDT TIMEFRAME=5m DRY_RUN=true node divergence-bot.mjs

  RUN (live; PRO only, at your own risk):
    EXCHANGE=binance SYMBOL=BTC/USDT TIMEFRAME=5m DRY_RUN=false API_KEY=xxx API_SECRET=yyy node divergence-bot.mjs

  Notes:
  • Educational reference. Tune parameters to your market/instrument.
  • Uses only ccxt spot by default. Futures/USDM swap require extra params.
*/

import ccxt from 'ccxt';

// ──────────────────────────────────────────────────────────────────────────────
// Env / Config
// ──────────────────────────────────────────────────────────────────────────────
const env = (k, d) => (process.env[k] ?? d);
const CONFIG = {
  exchangeId: env('EXCHANGE', 'binance'),
  symbol: env('SYMBOL', 'BTC/USDT'),
  timeframe: env('TIMEFRAME', '5m'),
  minBars: parseInt(env('MIN_BARS', '500')),
  dryRun: String(env('DRY_RUN', 'true')).toLowerCase() === 'true',
  apiKey: env('API_KEY', ''),
  apiSecret: env('API_SECRET', ''),
  // Risk / exits
  riskPct: parseFloat(env('RISK_PER_TRADE', '0.01')),
  rr: parseFloat(env('RR_RATIO', '1.5')),
  atrPeriod: parseInt(env('ATR_PERIOD', '14')),
  atrMultStop: parseFloat(env('ATR_MULT_STOP', '0.6')),
  atrMultTrail: parseFloat(env('ATR_MULT_TRAIL', '1.0')),
  // HPS parameters
  stochPeriods: (env('STOCH_PERIODS', '9,14,21,34')).split(',').map(s=>parseInt(s.trim(),10)),
  stochSmoothK: parseInt(env('STOCH_SMOOTH_K', '3')),
  stochSmoothD: parseInt(env('STOCH_SMOOTH_D', '3')),
  stageWindow: parseInt(env('STAGE_WINDOW', '30')),       // bars to find stage‑1 cluster
  stage2Lookahead: parseInt(env('STAGE2_LOOKAHEAD', '20')),// bars after stage‑1 to form stage‑2
  tolEqualLow: parseFloat(env('TOL_EQUAL_LOW', '0.0007')), // 0.07% tolerance for equal low/high
  emaPeriod: parseInt(env('EMA_PERIOD', '20')),
  useEmaFilter: String(env('EMA_FILTER', 'true')).toLowerCase() === 'true',
  // Sizing
  quoteCcy: env('QUOTE_CCY', 'USDT'),
};

const log = (...a) => console.log(new Date().toISOString(), ...a);

// ──────────────────────────────────────────────────────────────────────────────
// Math / Indicators
// ──────────────────────────────────────────────────────────────────────────────
function EMA(values, period) {
  const out = Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) out[i] = ema; else { ema = values[i] * k + ema * (1 - k); out[i] = ema; }
  }
  return out;
}

function SMA(values, period) {
  const out = Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += values[i - j];
    out[i] = sum / period;
  }
  return out;
}

function ATR(highs, lows, closes, period) {
  const tr = Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }
  return SMA(tr, period);
}

function Stochastic(highs, lows, closes, kPeriod, kSmooth, dSmooth) {
  const rawK = Array(closes.length).fill(null);
  for (let i = kPeriod - 1; i < closes.length; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      hh = Math.max(hh, highs[i - j]);
      ll = Math.min(ll, lows[i - j]);
    }
    rawK[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100;
  }
  const smoothK = SMA(rawK, kSmooth);
  const smoothD = SMA(smoothK, dSmooth);
  return { k: smoothK, d: smoothD };
}

// ──────────────────────────────────────────────────────────────────────────────
// HPS Quad Divergence Logic
// ──────────────────────────────────────────────────────────────────────────────
function findHPSSetups(bars) {
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const closes = bars.map(b => b.close);
  const len = bars.length;

  // Calculate all Stochastic bands
  const stochBands = CONFIG.stochPeriods.map(period => 
    Stochastic(highs, lows, closes, period, CONFIG.stochSmoothK, CONFIG.stochSmoothD)
  );
  
  // Primary Stoch(9,3) for divergence detection
  const primaryStoch = stochBands[0]; // First period should be 9
  
  // EMA filter
  const ema = CONFIG.useEmaFilter ? EMA(closes, CONFIG.emaPeriod) : null;
  
  const setups = [];
  
  // Look for Stage-1: All Stoch bands < 20 (or > 80 for shorts)
  for (let i = CONFIG.stageWindow; i < len - CONFIG.stage2Lookahead; i++) {
    // Check for Stage-1 Long (all bands < 20)
    const allBandsLow = stochBands.every(band => band.k[i] && band.k[i] < 20);
    const allBandsHigh = stochBands.every(band => band.k[i] && band.k[i] > 80);
    
    if (allBandsLow) {
      // Look for Stage-2 within lookahead window
      const stage1Low = lows[i];
      const stage1StochK = primaryStoch.k[i];
      
      for (let j = i + 1; j <= Math.min(i + CONFIG.stage2Lookahead, len - 1); j++) {
        const stage2Low = lows[j];
        const stage2StochK = primaryStoch.k[j];
        
        // Check for equal/lower low with higher Stoch (divergence)
        const isEqualOrLowerLow = stage2Low <= stage1Low * (1 + CONFIG.tolEqualLow);
        const isHigherStoch = stage2StochK > stage1StochK;
        
        if (isEqualOrLowerLow && isHigherStoch && primaryStoch.k[j] < 20) {
          // Look for entry signal: Stoch cross back above 20
          for (let k = j + 1; k < Math.min(j + 10, len); k++) {
            if (primaryStoch.k[k] > 20 && primaryStoch.k[k - 1] <= 20) {
              const emaOk = !CONFIG.useEmaFilter || !ema[k] || closes[k] > ema[k];
              if (emaOk) {
                setups.push({
                  type: 'long',
                  entryBar: k,
                  entryPrice: closes[k],
                  stage1Bar: i,
                  stage2Bar: j,
                  patternLow: Math.min(stage1Low, stage2Low),
                  stochDivergence: stage2StochK - stage1StochK,
                });
              }
              break;
            }
          }
        }
      }
    }
    
    if (allBandsHigh) {
      // Look for Stage-2 Short setup
      const stage1High = highs[i];
      const stage1StochK = primaryStoch.k[i];
      
      for (let j = i + 1; j <= Math.min(i + CONFIG.stage2Lookahead, len - 1); j++) {
        const stage2High = highs[j];
        const stage2StochK = primaryStoch.k[j];
        
        // Check for equal/higher high with lower Stoch (divergence)
        const isEqualOrHigherHigh = stage2High >= stage1High * (1 - CONFIG.tolEqualLow);
        const isLowerStoch = stage2StochK < stage1StochK;
        
        if (isEqualOrHigherHigh && isLowerStoch && primaryStoch.k[j] > 80) {
          // Look for entry signal: Stoch cross back below 80
          for (let k = j + 1; k < Math.min(j + 10, len); k++) {
            if (primaryStoch.k[k] < 80 && primaryStoch.k[k - 1] >= 80) {
              const emaOk = !CONFIG.useEmaFilter || !ema[k] || closes[k] < ema[k];
              if (emaOk) {
                setups.push({
                  type: 'short',
                  entryBar: k,
                  entryPrice: closes[k],
                  stage1Bar: i,
                  stage2Bar: j,
                  patternHigh: Math.max(stage1High, stage2High),
                  stochDivergence: stage1StochK - stage2StochK,
                });
              }
              break;
            }
          }
        }
      }
    }
  }
  
  return setups;
}

// ──────────────────────────────────────────────────────────────────────────────
// Trading State
// ──────────────────────────────────────────────────────────────────────────────
let exchange = null;
let position = null;
let equity = 10000; // Starting paper equity
let tradeCount = 0;
let winCount = 0;

// ──────────────────────────────────────────────────────────────────────────────
// Main Bot Loop
// ──────────────────────────────────────────────────────────────────────────────
async function initExchange() {
  const ExchangeClass = ccxt[CONFIG.exchangeId];
  if (!ExchangeClass) throw new Error(`Exchange ${CONFIG.exchangeId} not supported`);
  
  const options = {
    apiKey: CONFIG.apiKey,
    secret: CONFIG.apiSecret,
    sandbox: CONFIG.dryRun,
    enableRateLimit: true,
  };
  
  exchange = new ExchangeClass(options);
  
  if (!CONFIG.dryRun && (!CONFIG.apiKey || !CONFIG.apiSecret)) {
    throw new Error('API_KEY and API_SECRET required for live trading');
  }
  
  log(`Initialized ${CONFIG.exchangeId} exchange (${CONFIG.dryRun ? 'PAPER' : 'LIVE'} mode)`);
}

async function fetchBars() {
  try {
    const ohlcv = await exchange.fetchOHLCV(CONFIG.symbol, CONFIG.timeframe, undefined, CONFIG.minBars);
    return ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    }));
  } catch (error) {
    log('Error fetching bars:', error.message);
    return [];
  }
}

async function executeOrder(side, amount, price) {
  if (CONFIG.dryRun) {
    log(`PAPER ${side.toUpperCase()}: ${amount} ${CONFIG.symbol} @ ${price}`);
    return { id: `paper_${Date.now()}`, filled: amount, average: price };
  }
  
  try {
    const order = await exchange.createMarketOrder(CONFIG.symbol, side, amount);
    log(`LIVE ${side.toUpperCase()}: ${order.filled} ${CONFIG.symbol} @ ${order.average}`);
    return order;
  } catch (error) {
    log(`Order error:`, error.message);
    return null;
  }
}

function calculatePositionSize(entryPrice, stopPrice, riskAmount) {
  const riskPerShare = Math.abs(entryPrice - stopPrice);
  return riskAmount / riskPerShare;
}

async function processSetups(bars) {
  const setups = findHPSSetups(bars);
  const currentBar = bars[bars.length - 1];
  const atr = ATR(bars.map(b => b.high), bars.map(b => b.low), bars.map(b => b.close), CONFIG.atrPeriod);
  const currentATR = atr[atr.length - 1];
  
  // Process new setups if no position
  if (!position && setups.length > 0) {
    const setup = setups[setups.length - 1]; // Take most recent setup
    
    if (setup.entryBar === bars.length - 1) { // Entry on current bar
      const riskAmount = equity * CONFIG.riskPct;
      let stopPrice;
      
      if (setup.type === 'long') {
        stopPrice = Math.min(setup.patternLow, currentBar.close - currentATR * CONFIG.atrMultStop);
        const positionSize = calculatePositionSize(setup.entryPrice, stopPrice, riskAmount);
        const targetPrice = setup.entryPrice + (setup.entryPrice - stopPrice) * CONFIG.rr;
        
        const order = await executeOrder('buy', positionSize, setup.entryPrice);
        if (order) {
          position = {
            type: 'long',
            entryPrice: order.average,
            size: order.filled,
            stopPrice,
            targetPrice,
            trailStop: null,
            entryTime: currentBar.timestamp,
          };
          log(`LONG ENTRY: ${position.size} @ ${position.entryPrice}, Stop: ${stopPrice}, Target: ${targetPrice}`);
        }
      } else {
        stopPrice = Math.max(setup.patternHigh, currentBar.close + currentATR * CONFIG.atrMultStop);
        const positionSize = calculatePositionSize(setup.entryPrice, stopPrice, riskAmount);
        const targetPrice = setup.entryPrice - (stopPrice - setup.entryPrice) * CONFIG.rr;
        
        const order = await executeOrder('sell', positionSize, setup.entryPrice);
        if (order) {
          position = {
            type: 'short',
            entryPrice: order.average,
            size: order.filled,
            stopPrice,
            targetPrice,
            trailStop: null,
            entryTime: currentBar.timestamp,
          };
          log(`SHORT ENTRY: ${position.size} @ ${position.entryPrice}, Stop: ${stopPrice}, Target: ${targetPrice}`);
        }
      }
    }
  }
  
  // Manage existing position
  if (position) {
    const currentPrice = currentBar.close;
    let shouldExit = false;
    let exitReason = '';
    
    if (position.type === 'long') {
      // Stop loss
      if (currentPrice <= position.stopPrice) {
        shouldExit = true;
        exitReason = 'Stop Loss';
      }
      // Take profit
      else if (currentPrice >= position.targetPrice) {
        shouldExit = true;
        exitReason = 'Take Profit';
      }
      // Trailing stop
      else if (currentPrice > position.entryPrice) {
        const newTrailStop = currentPrice - currentATR * CONFIG.atrMultTrail;
        if (!position.trailStop || newTrailStop > position.trailStop) {
          position.trailStop = newTrailStop;
        }
        if (currentPrice <= position.trailStop) {
          shouldExit = true;
          exitReason = 'Trailing Stop';
        }
      }
    } else {
      // Stop loss
      if (currentPrice >= position.stopPrice) {
        shouldExit = true;
        exitReason = 'Stop Loss';
      }
      // Take profit
      else if (currentPrice <= position.targetPrice) {
        shouldExit = true;
        exitReason = 'Take Profit';
      }
      // Trailing stop
      else if (currentPrice < position.entryPrice) {
        const newTrailStop = currentPrice + currentATR * CONFIG.atrMultTrail;
        if (!position.trailStop || newTrailStop < position.trailStop) {
          position.trailStop = newTrailStop;
        }
        if (currentPrice >= position.trailStop) {
          shouldExit = true;
          exitReason = 'Trailing Stop';
        }
      }
    }
    
    if (shouldExit) {
      const side = position.type === 'long' ? 'sell' : 'buy';
      const order = await executeOrder(side, position.size, currentPrice);
      
      if (order) {
        const pnl = position.type === 'long' 
          ? (order.average - position.entryPrice) * position.size
          : (position.entryPrice - order.average) * position.size;
        
        equity += pnl;
        tradeCount++;
        if (pnl > 0) winCount++;
        
        log(`${position.type.toUpperCase()} EXIT (${exitReason}): ${position.size} @ ${order.average}`);
        log(`PnL: ${pnl.toFixed(2)} ${CONFIG.quoteCcy}, Equity: ${equity.toFixed(2)}, Win Rate: ${((winCount/tradeCount)*100).toFixed(1)}%`);
        
        position = null;
      }
    }
  }
}

async function runBot() {
  log('Starting HPS Quad Divergence Bot...');
  log(`Config: ${CONFIG.symbol} ${CONFIG.timeframe}, Risk: ${CONFIG.riskPct*100}%, RR: ${CONFIG.rr}`);
  log(`Stoch Periods: [${CONFIG.stochPeriods.join(',')}], EMA Filter: ${CONFIG.useEmaFilter}`);
  
  await initExchange();
  
  while (true) {
    try {
      const bars = await fetchBars();
      if (bars.length >= CONFIG.minBars) {
        await processSetups(bars);
      } else {
        log(`Insufficient bars: ${bars.length}/${CONFIG.minBars}`);
      }
      
      // Wait for next bar
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    } catch (error) {
      log('Bot error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Start Bot
// ──────────────────────────────────────────────────────────────────────────────
runBot().catch(error => {
  log('Fatal error:', error);
  process.exit(1);
});