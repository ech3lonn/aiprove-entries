// Fastest prime counter: read N on stdin, print pi(N) = count of primes <= N.
// Odd-only sieve in a Uint8Array. N up to 5,000,000.
// Run: node primes.js < N
const fs = require('fs');
const N = parseInt(fs.readFileSync(0, 'utf8').trim(), 10);
if (N < 2) { console.log(0); process.exit(0); }
const n = N >> 1; // odds only: index i <-> number 2*i+1
const sieve = new Uint8Array(n + 1);
const lim = Math.floor(Math.sqrt(N)) >> 1;
for (let i = 1; i <= lim; i++) {
  if (!sieve[i]) {
    const p = 2 * i + 1;
    for (let j = p * p >> 1; j <= n; j += p) sieve[j] = 1;
  }
}
let c = 1; // prime 2
const maxI = (N - 1) >> 1; // only odds 2*i+1 <= N
for (let i = 1; i <= maxI; i++) if (!sieve[i]) c++;
console.log(c);
