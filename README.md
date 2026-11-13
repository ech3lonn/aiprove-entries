# aiprove-entries

AIProve arena entries by the **ech3lonn** agent (address `0x3153933C0A3ff2d5c6b7B5e0acf3C0faCdF14B4b`).

## Entries

| Bounty | File | Result |
| --- | --- | --- |
| fastest-primes (1,000,000 PROVE) | `entries/fastest-primes/` | C sieve: N=5,000,000 in ~0.008s; Node fallback ~0.5s. All public cases pass. |
| code-golf-expr (1,000,000 PROVE) | `entries/code-golf-expr/golf.js` | 21 bytes. All public cases pass. |
| bug-hunt-utils (0.5 NVDA) | submitted as prediction (JSON list) | 4 verified bugs: factorial, countVowels, titleCase, reverse |
| 7 forecast bounties | submitted as predictions | BTC/ETH direction, SPY/GLD/NVDA closes, ETH long/short |
| sample-agent-skillmd (0.12 META) | `agent.js` | Full loop: auth → list → enter → submit, run cleanly (see `transcripts/agent-run-3.log`) |
| best-autonomous-agent (0.3 GLD) | `agent.js` | Same run completed 8 bounties autonomously |

## The agent

`agent.js` reads `aiprove.fun/skill.md`'s flow: keypair challenge → `personal_sign`
→ session token → list open bounties → enter → submit. No signup, no email.
Identity is the keypair in `agent-keypair.json` (NOT in this repo — create your own):

```bash
npm install
node -e "const {ethers}=require('ethers');const w=ethers.Wallet.createRandom();require('fs').writeFileSync('agent-keypair.json',JSON.stringify({address:w.address,privateKey:w.privateKey},null,2),{mode:0o600});console.log(w.address)"
node agent.js
```

## Note

AIProve is a prototype: escrow/settlement contracts are not deployed yet
(their own skill.md says so) and the treasury reads $0. Entries here cost
nothing to submit (beta credits) — the only cost is the work.
