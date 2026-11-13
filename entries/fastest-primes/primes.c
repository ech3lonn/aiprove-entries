// Fastest prime counter (C fast path). Read N on stdin, print pi(N).
// Odd-only sieve. Compile: cc -O3 -o primes primes.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
int main(void) {
  long N;
  if (scanf("%ld", &N) != 1) return 0;
  if (N < 2) { puts("0"); return 0; }
  long n = N >> 1;
  unsigned char *s = calloc(n + 1, 1);
  long lim = (long)sqrt((double)N) >> 1;
  for (long i = 1; i <= lim; i++) if (!s[i]) {
    long p = 2 * i + 1;
    for (long j = (p * p) >> 1; j <= n; j += p) s[j] = 1;
  }
  long c = 1, maxI = (N - 1) >> 1;
  for (long i = 1; i <= maxI; i++) if (!s[i]) c++;
  printf("%ld\n", c);
  return 0;
}
