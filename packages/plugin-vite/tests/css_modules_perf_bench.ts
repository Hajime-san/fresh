// Synthetic microbenchmarks for the hot paths changed by the CSS Modules fix.

let sink = 0;

function buildCssBatches(
  batchCount: number,
  batchSize: number,
  uniquePoolSize: number,
): string[][] {
  const batches: string[][] = [];

  for (let i = 0; i < batchCount; i++) {
    const batch: string[] = [];
    for (let j = 0; j < batchSize; j++) {
      const idx = (i * 7 + j * 13) % uniquePoolSize;
      batch.push(`/_fresh/css/module_${idx}.css`);
    }
    batches.push(batch);
  }

  return batches;
}

function collectAdditionalStylesBefore(batches: string[][]): number {
  let additionalStyles: string[] | null = null;

  for (let i = 0; i < batches.length; i++) {
    const css = batches[i];
    if (css.length === 0) continue;

    if (additionalStyles === null) {
      additionalStyles = css.slice();
      continue;
    }

    for (let j = 0; j < css.length; j++) {
      const href = css[j];
      if (!additionalStyles.includes(href)) {
        additionalStyles.push(href);
      }
    }
  }

  return additionalStyles?.length ?? 0;
}

function collectAdditionalStylesAfter(batches: string[][]): number {
  let additionalStyles: Set<string> | null = null;

  for (let i = 0; i < batches.length; i++) {
    const css = batches[i];
    if (css.length === 0) continue;

    if (additionalStyles === null) {
      additionalStyles = new Set(css);
      continue;
    }

    for (let j = 0; j < css.length; j++) {
      additionalStyles.add(css[j]);
    }
  }

  return additionalStyles?.size ?? 0;
}

interface MockModule {
  id: string | null;
}

function normalizeRouteCssId(id: string): string {
  return id.startsWith("\0fresh-route-css::")
    ? `/@id/fresh-route-css::${
      id.slice("\0fresh-route-css::".length)
    }.module.css`
    : id;
}

function buildMockSsrModules(
  moduleCount: number,
  routeCssCount: number,
): { modules: MockModule[]; tracked: Set<string> } {
  const modules: MockModule[] = [];
  const tracked = new Set<string>();

  for (let i = 0; i < moduleCount; i++) {
    modules.push({
      id: `/routes/generated/module_${i}.tsx`,
    });
  }

  for (let i = 0; i < routeCssCount; i++) {
    const id = `\0fresh-route-css::route_${i}`;
    modules[(i * 137) % moduleCount] = { id };
    tracked.add(id);
  }

  return { modules, tracked };
}

function discoverRouteCssIdsBefore(modules: MockModule[]): number {
  let count = 0;

  for (let i = 0; i < modules.length; i++) {
    const id = modules[i].id;
    if (id?.includes("fresh-route-css::")) {
      count += normalizeRouteCssId(id).length;
    }
  }

  return count;
}

function discoverRouteCssIdsAfter(tracked: Set<string>): number {
  let count = 0;

  for (const id of tracked) {
    count += normalizeRouteCssId(id).length;
  }

  return count;
}

interface MockGraphNode {
  id: string;
  url: string;
  imported: string[];
}

function buildRouteCssGraph(
  routeCount: number,
  componentDepth: number,
  cssPerRoute: number,
): { graph: Map<string, MockGraphNode>; roots: string[]; requests: string[] } {
  const graph = new Map<string, MockGraphNode>();
  const roots: string[] = [];
  const requests: string[] = [];

  for (let routeIdx = 0; routeIdx < routeCount; routeIdx++) {
    let previousId = `route:${routeIdx}:entry`;
    roots.push(previousId);

    for (let depth = 0; depth < componentDepth; depth++) {
      const nodeId = `route:${routeIdx}:component:${depth}`;
      graph.set(previousId, {
        id: previousId,
        url: previousId,
        imported: [nodeId],
      });
      previousId = nodeId;
    }

    const imported: string[] = [];
    for (let cssIdx = 0; cssIdx < cssPerRoute; cssIdx++) {
      const cssId = `route:${routeIdx}:css:${cssIdx}.module.css`;
      graph.set(cssId, {
        id: cssId,
        url: `/@fs/${cssId}`,
        imported: [],
      });
      imported.push(cssId);
    }

    graph.set(previousId, {
      id: previousId,
      url: previousId,
      imported,
    });
  }

  for (let i = 0; i < routeCount * 32; i++) {
    requests.push(roots[(i * 5) % roots.length]);
  }

  return { graph, roots, requests };
}

function collectRouteCssUncached(
  graph: Map<string, MockGraphNode>,
  id: string,
): string[] {
  const out = new Set<string>();
  const seen = new Set<string>();
  const queue = [id];

  let current: string | undefined;
  while ((current = queue.pop()) !== undefined) {
    if (seen.has(current)) continue;
    seen.add(current);

    const node = graph.get(current);
    if (node === undefined) continue;

    if (node.id.endsWith(".css") || node.id.endsWith(".module.css")) {
      out.add(node.url);
      continue;
    }

    for (let i = 0; i < node.imported.length; i++) {
      queue.push(node.imported[i]);
    }
  }

  return Array.from(out);
}

function collectRouteCssCached(
  graph: Map<string, MockGraphNode>,
  id: string,
  cache: Map<string, string[]>,
): string[] {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;

  const collected = collectRouteCssUncached(graph, id);
  cache.set(id, collected);
  return collected;
}

const CSS_BATCHES = buildCssBatches(128, 24, 192);
const SSR_MODULES = buildMockSsrModules(20_000, 192);
const ROUTE_GRAPH = buildRouteCssGraph(48, 40, 8);

Deno.bench({
  name: "css perf/additional styles dedupe before",
  baseline: true,
  fn() {
    sink ^= collectAdditionalStylesBefore(CSS_BATCHES);
  },
});

Deno.bench("css perf/additional styles dedupe after", () => {
  sink ^= collectAdditionalStylesAfter(CSS_BATCHES);
});

Deno.bench({
  name: "css perf/route css id discovery before",
  baseline: true,
  fn() {
    sink ^= discoverRouteCssIdsBefore(SSR_MODULES.modules);
  },
});

Deno.bench("css perf/route css id discovery after", () => {
  sink ^= discoverRouteCssIdsAfter(SSR_MODULES.tracked);
});

Deno.bench({
  name: "css perf/repeated route css graph walk before",
  baseline: true,
  fn() {
    let total = 0;
    for (let i = 0; i < ROUTE_GRAPH.requests.length; i++) {
      total +=
        collectRouteCssUncached(ROUTE_GRAPH.graph, ROUTE_GRAPH.requests[i])
          .length;
    }
    sink ^= total;
  },
});

Deno.bench("css perf/repeated route css graph walk after", () => {
  const cache = new Map<string, string[]>();
  let total = 0;

  for (let i = 0; i < ROUTE_GRAPH.requests.length; i++) {
    total += collectRouteCssCached(
      ROUTE_GRAPH.graph,
      ROUTE_GRAPH.requests[i],
      cache,
    ).length;
  }

  sink ^= total;
});

if (sink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", sink);
}
