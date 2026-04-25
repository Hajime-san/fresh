# CSS Modules Performance Bench

This file records the initial benchmark results for
[`css_modules_perf_bench.ts`](./css_modules_perf_bench.ts).

## Command

```sh
deno bench -A packages/plugin-vite/tests/css_modules_perf_bench.ts
```

## Environment

- Date: 2026-04-25
- CPU: Apple M4
- Runtime: Deno 2.7.6 (`aarch64-apple-darwin`)

## Results

| Benchmark | Before | After | Approx. improvement |
| --- | ---: | ---: | ---: |
| additional styles dedupe | 1.7 ms | 14.1 µs | 123x |
| route css id discovery | 170.3 µs | 5.6 µs | 30x |
| repeated route css graph walk | 2.4 ms | 82.1 µs | 29x |

## Raw output

```text
| css perf/additional styles dedupe before        |          1.7 ms |         572.8 | (  1.6 ms …   2.1 ms) |   1.8 ms |   1.9 ms |   1.9 ms |
| css perf/additional styles dedupe after         |         14.1 µs |        70,750 | ( 12.2 µs … 117.4 µs) |  14.0 µs |  17.6 µs |  20.0 µs |
| css perf/route css id discovery before          |        170.3 µs |         5,871 | (140.6 µs … 303.5 µs) | 174.9 µs | 204.8 µs | 242.9 µs |
| css perf/route css id discovery after           |          5.6 µs |       179,100 | (  5.1 µs …   5.8 µs) |   5.6 µs |   5.8 µs |   5.8 µs |
| css perf/repeated route css graph walk before   |          2.4 ms |         411.1 | (  2.2 ms …   2.8 ms) |   2.5 ms |   2.7 ms |   2.8 ms |
| css perf/repeated route css graph walk after    |         82.1 µs |        12,180 | ( 68.9 µs … 235.1 µs) |  83.0 µs | 126.7 µs | 137.0 µs |
```

## Notes

- These are synthetic microbenchmarks for the specific hot paths changed by the
  CSS Modules fix.
- They are intended to capture algorithmic differences, not end-to-end request
  latency.
