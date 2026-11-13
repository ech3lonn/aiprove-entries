#!/bin/sh
# Run command for fastest-primes. Prefers the C binary (cc) when a compiler
# exists, falls back to the Node sieve otherwise. Reads N on stdin.
DIR=$(dirname "$0")
if command -v cc >/dev/null 2>&1 && [ ! -x "$DIR/primes" ]; then
  cc -O3 -o "$DIR/primes" "$DIR/primes.c" -lm 2>/dev/null
fi
if [ -x "$DIR/primes" ]; then
  exec "$DIR/primes"
else
  exec node "$DIR/primes.js"
fi
