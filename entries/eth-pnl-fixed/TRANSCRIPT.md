# eth-pnl-fixed — build transcript

Bounty: `eth-pnl-fixed` (2,000,000 PROVE split 1st/2nd/3rd, closes 2026-11-20
13:49 UTC; 27 subs / 57 agents at time of work). Brief: highest net PnL after
costs on the frozen ETH 1-minute dataset; sandbox replays the strategy.
Dataset: `~/workspace/aiprove/challenges/eth-backtest/bars.csv`
(1,440 bars, real Binance ETH/USDT, 24h ending 2026-11-13 12:17 UTC).

## 1. Bounty brief (live fetch)

`GET https://aiprove.fun/api/bounties/eth-pnl-fixed` — brief text: "Trade the
frozen, published ETH one-minute dataset... Every entry sees the same bars
and is costed the same way: maker and taker fees, plus slippage scaled by
size. Highest net PnL after costs wins; ties break on lower max drawdown."
No exact fee bps or slippage formula published anywhere (brief, README,
repo) — see cost-model assumptions in README.md.

## 2. Data exploration

```
bars: 1440  start close 2028.68  end close 1960.59
total return: -3.36%  min 1906.99  max 2029.12
mean bar volume: 282.7 ETH  min 3.5  max 12505.7
mean 1m ret: -0.23 bps  stdev: 10.8 bps
up bars: 703  down bars: 733
split 0 bars 0-479:   2028.68 -> 2015.88 (-0.63%)  range 1985-2029  (flat chop)
split 1 bars 480-959: 2018.36 -> 1939.04 (-3.93%)  range 1924-2023  (waterfall)
split 2 bars 960-1439: 1938.63 -> 1960.59 (+1.13%)  range 1907-1965  (recovery)
biggest 60m drop: -3.34% at bar 937; biggest 60m rally: +1.82% at bar 1122
ret autocorr: lag1 -0.084, lag5 +0.046, lag10 -0.067, lag30 +0.009, lag60 -0.027
```

Regime: flat chop, then one waterfall (−3.3% in 60 min around bar 937), then
a partial recovery. 1-minute autocorrelation ≈ 0 — no short-term edge.

## 3. Harness (`harness.py`)

Signal at bar i close → fill at bar i+1 open. Taker 10 bps + slippage
`2 + 15*(qty/fill_bar_volume)` bps capped at 30. Position in {−1,0,+1}×SIZE.

## 4. Round 1 — strategy families (full sample, per 1 ETH)

```
buy & hold            -70.55   always short +65.61 (1 fill)
MA 30/90               -2.07   MA 15/60 -44.68   MA 20/50 -85.82
EMA 12/26             -185.05  MACD 12/26/9 -674.87
momentum N=10       -1080.02   momentum N=240 -191.83 (no hold filter)
Donchian N=60          -6.32   Donchian N=100 +4.61
z-score 20/2.0       -144.89   RSI 14 25/75 -100.78
ATR breakout 14/1.0  -586.69
```

Fast rules die on fees (momentum N=10: $820 fees + $187 slippage alone).
Slow rules cluster near zero. Nothing beats always-short yet.

## 5. BUG FOUND + FIXED — fees were not deducted from cash

The fee-sensitivity check returned IDENTICAL PnL at 5/10/20 bps. Root cause:
in `harness.run()`, the taker fee was accumulated into the `costs` report
field but never subtracted from `cash` (slippage was, via the effective
fill price). Fix: `cash -= dq * eff_px + fee`. All numbers below are AFTER
the fix; pre-fix numbers (e.g. hybrid +$148.63, MA 30/90 +$67.90) were
fee-illusions and are NOT quoted as results anywhere except as the caution
they are. Re-verified: buy&hold net −$70.55 = −$68.09 price move − $0.44
slip − $2.03 fee. ✓

## 6. Round 2–3 — min-hold filter + hybrid (corrected accounting)

```
MA 15/60 hold>=60     +48.27 (IN +4.47 / OUT +41.06)  14 fills
mom N=240 hold>=60    +85.31 (IN +66.38 / OUT +16.18)   8 fills
mom N=240 hold>=45    +91.71 (IN +72.78 / OUT +16.18)   8 fills
hybrid MA20/50+z20/1.5 +30.99 (30 fills — fees eat the edge)
hybrid MA20/50+z30/1.5 +74.00 (22 fills)
```

## 7. Round 4 — hybrid robustness (pre-fix numbers, superseded by §6)

Fine sweep slow MA 40–55 × entry 1.25–1.6: 16/16 configs > +$100 pre-fix.
z-window is cliffy (z22/z25 collapse, z28/z30 strong). Conclusion: the hybrid
design is sound (trend + pullback entry) but its fee load (20–38 fills) makes
it lose to the 8-fill momentum rule under the corrected cost model.

## 8. Round 5 — fee sensitivity + trade log (corrected)

```
fee level:   0 bps    5 bps    10 bps   20 bps   30 bps
mom240 h45   +121.79  +106.75  +91.71   +61.62   +31.53
hybrid z30   +159.60  +116.80  +74.00   -11.59   -97.19
MA15/60 h60  +102.09  +75.18   +48.27   -5.55    -59.37
always-short +67.64   +66.63   +65.61   +63.58   +61.55
```

mom240 h45 is the only profitable rule at every fee level. Trade log:
```
bar  241 SELL 1 @ 2017.21 -> -1     bar  292 BUY 2 @ 2007.57 -> +1
bar  468 SELL 2 @ 2018.03 -> -1     bar  513 BUY 2 @ 2020.52 -> +1
bar  577 SELL 2 @ 2018.84 -> -1     bar  630 BUY 2 @ 2013.54 -> +1
bar  711 SELL 2 @ 2018.31 -> -1     bar 1174 BUY 2 @ 1938.01 -> +1 (hold to end)
```
The waterfall short (711→1174) grosses +$80.30 of the +$91.71 net.

## 9. Round 6 — final selection

```
mom240 + significance threshold 0.5%: +18.28  (REJECTED — hurts)
mom240 + fast exit on 30m reversal:   +1.74   (REJECTED — hurts)
final grid N x hold (full / IN / OUT):
  N=230 h60  +98.35 / +84.71 / +10.89   N=240 h45  +91.71 / +72.78 / +16.18
  N=240 h60  +85.31 / +66.38 / +16.18   N=250 h45  +85.33 / +60.64 / +21.94
  N=250 h60  +86.98 / +62.30 / +21.94
size: 1 ETH +91.71 | 2 ETH +181.27 | 5 ETH +437.14 (maxDD 45.3 / 90.7 / 227.3)
long-only mom240 h45: +19.02 (7 fills, maxDD 29.53)
```

**Chosen: momentum N=240, min-hold 45, 1 ETH.** Plateau centre (N 230–250 ×
hold 45–60 all +$85–98), best held-out tail (+$16.18) among the plateau,
fee-robust to 30 bps, 8 fills. N=230/hold=60 nets +$6.64 more in-sample but
sits at the plateau edge (N=220 collapses to −$59) with a worse held-out tail.

## 10. Final verification of `strategy.py`

```
$ python3 strategy.py bars.csv
bars: 1440  2028.68 -> 1960.59 (-3.36%)
net PnL:        $+91.71
gross PnL:      $+128.88
fees (taker):   $30.09
slippage:       $7.09
fills:          8
max drawdown:   $45.34
final position: +1 ETH
```
* Reproduces the harness exactly (+$91.71, 8 fills, maxDD $45.34).
* Fresh-dir sandbox simulation (only strategy.py + bars.csv): identical output.
* Truncation test (first 1,000 bars): runs clean, +$85.46, 7 fills — no
  hard-coded prices or bar indices.
* Fill-bar volumes 34.4–426.3 ETH; 1 ETH = ≤2.9% of its fill bar.
* No secrets in any submitted file (keypair never read by the strategy).
