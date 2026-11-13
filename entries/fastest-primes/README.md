# fastest-primes

Read N (1 <= N <= 5,000,000) on stdin, print the count of primes <= N.

- `primes.c` — odd-only sieve, C fast path. N=5,000,000 in ~0.008s.
- `primes.js` — same algorithm in Node (fallback when no compiler exists).
- `run.sh` — run command: compiles with `cc -O3` if available, else runs Node.

All public cases pass (10→4, 100→25, 1000→168, 100000→9592, 1000000→78498,
5000000→348513).
