// AIProve agent — ech3lonn. Auth (keypair challenge) -> list -> enter -> submit.
// Transport via curl (Node fetch is flaky from this VM); signing via ethers.
// Keypair in agent-keypair.json (0600, never committed, never printed).
const { ethers } = require('ethers');
const fs = require('fs');
const { execFile } = require('child_process');

const API = 'https://aiprove.fun';
const HANDLE = 'ech3lonn';
const { address, privateKey } = JSON.parse(fs.readFileSync('./agent-keypair.json', 'utf8'));
const wallet = new ethers.Wallet(privateKey);

function curl(method, path, body, token) {
  return new Promise((resolve) => {
    const args = ['-s', '-m', '30', '-X', method, API + path,
      '-H', 'content-type: application/json'];
    if (token) args.push('-H', 'Authorization: Bearer ' + token);
    if (body) args.push('-d', JSON.stringify(body));
    args.push('-w', '\n%{http_code}');
    execFile('curl', args, { maxBuffer: 1e6 }, (err, out) => {
      if (err) return resolve({ status: 0, error: err.message });
      const i = out.lastIndexOf('\n');
      const code = parseInt(out.slice(i + 1), 10);
      let d; try { d = JSON.parse(out.slice(0, i)); } catch { d = { raw: out.slice(0, 200) }; }
      resolve({ status: code, ...d });
    });
  });
}

async function call(method, path, body, token) {
  for (let a = 1; a <= 3; a++) {
    const r = await curl(method, path, body, token);
    if (r.status !== 0) return r;
    console.log(`retry ${a} ${method} ${path}`);
    await new Promise((r) => setTimeout(r, 2000 * a));
  }
  return { status: 0, error: 'curl failed x3' };
}

(async () => {
  const ch = await call('GET', `/api/auth/challenge?address=${address}`);
  if (!ch.challenge) { console.log('CHALLENGE FAIL', JSON.stringify(ch)); process.exit(1); }
  const sig = await wallet.signMessage(ch.challenge);
  const v = await call('POST', '/api/auth/verify', { address, signature: sig });
  if (!v.token) { console.log('VERIFY FAIL', JSON.stringify(v)); process.exit(1); }
  const token = v.token;
  console.log('AUTH OK', address);

  const preds = [
    ['btc-tomorrow', { answer: 'no', confidence: 0.68 }],
    ['forecast-eth-24h', { answer: 'no', confidence: 0.66 }],
    ['forecast-btc-7d', { answer: 'no', confidence: 0.55 }],
    ['spy-close-1dollar', { answer: 748 }],
    ['forecast-gold-tomorrow', { answer: 356 }],
    ['forecast-nvda-3d', { answer: 154 }],
    ['signal-eth-pnl-24h', { answer: 'short' }],
  ];
  for (const [slug, prediction] of preds) {
    const enter = await call('POST', `/api/bounties/${slug}/enter`, { handle: HANDLE }, token);
    const sub = await call('POST', `/api/bounties/${slug}/submit`, { prediction, handle: HANDLE }, token);
    console.log(slug, 'enter:', enter.status, 'submit:', sub.status, JSON.stringify(sub).slice(0, 200));
  }

  const bugs = [
    { fn: 'factorial', input: 5, expected: 120 },
    { fn: 'countVowels', input: 'AEIOU', expected: 5 },
    { fn: 'titleCase', input: "don't", expected: "Don't" },
    { fn: 'reverse', input: 'a\u{1F600}b', expected: 'b\u{1F600}a' },
  ];
  const bsub = await call('POST', '/api/bounties/bug-hunt-utils/submit',
    { prediction: bugs, handle: HANDLE }, token);
  console.log('bug-hunt-utils submit:', bsub.status, JSON.stringify(bsub).slice(0, 300));

  const me = await call('GET', '/api/me', null, token);
  console.log('ME:', JSON.stringify(me).slice(0, 800));
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
