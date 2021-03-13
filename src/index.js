// @ts-check
/// <reference lib="esnext" />

/**
 *
 * @param {import('./types').ReferenceFileSystem} spec
 * @param {import('./types').RenderFn} renderString
 * @returns {Map<string, import('./types').Ref | ArrayBuffer>}
 */
export function parse(spec, renderString) {
  /**
   * @type {import('./types').RenderContext}
   */
  const context = {};
  for (const [key, template] of Object.entries(spec.templates)) {
    // TODO: better check for whether a template or not
    if (template.includes("{{")) {
      // Need to register filter in environment
      context[key] = (ctx) => renderString(template, ctx);
    } else {
      context[key] = template;
    }
  }

  /**
   * @type {(t: string, o?: Record<string, string | number>) => string} t
   */
  const render = (t, o) => {
    return renderString(t, { ...context, ...o });
  };

  /**
   * @type {Map<string, import('./types').Ref | ArrayBuffer>}
   */
  const refs = new Map();

  for (const [key, ref] of Object.entries(spec.refs)) {
    if (typeof ref === "string") {
      if (ref.startsWith("base64:")) {
        const buf = __toBinary(ref.slice(7)).buffer;
        refs.set(key, buf);
      } else {
        refs.set(key, ref);
      }
    } else {
      const url = render(ref[0]);
      refs.set(key, ref.length === 1 ? [url] : [url, ref[1], ref[2]]);
    }
  }

  for (const g of spec.gen) {
    for (const dims of iterDims(g.dimensions)) {
      const key = render(g.key, dims);
      const url = render(g.url, dims);
      const offset = render(g.offset, dims);
      const length = render(g.length, dims);
      refs.set(key, [url, parseInt(offset), parseInt(length)]);
    }
  }

  return refs;
}

/**
 * @param {Record<string, import('./types').Range | number[]>} dimensions
 * @returns {Generator<Record<string, number>>}
 */
function* iterDims(dimensions) {
  const keys = Object.keys(dimensions);
  const iterables = Object.values(dimensions).map((i) => (Array.isArray(i) ? i : range(i)));
  for (const values of product(...iterables)) {
    yield Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  }
}

function* product(...iterables) {
  if (iterables.length === 0) {
    return;
  }
  // make a list of iterators from the iterables
  const iterators = iterables.map((it) => it[Symbol.iterator]());
  const results = iterators.map((it) => it.next());
  if (results.some((r) => r.done)) {
    throw new Error("Input contains an empty iterator.");
  }
  for (let i = 0; ;) {
    if (results[i].done) {
      // reset the current iterator
      iterators[i] = iterables[i][Symbol.iterator]();
      results[i] = iterators[i].next();
      // advance, and exit if we've reached the end
      if (++i >= iterators.length) {
        return;
      }
    } else {
      yield results.map(({ value }) => value);
      i = 0;
    }
    results[i] = iterators[i].next();
  }
}

function* range({ stop, start = 0, step = 1 }) {
  for (let i = start; i < stop; i += step) {
    yield i;
  }
}


// This is for the "binary" loader (custom code is ~2x faster than "atob")
// from: https://github.com/evanw/esbuild/blob/150a01844d47127c007c2b1973158d69c560ca21/internal/runtime/runtime.go#L185

/**
 * @type {(str: string) => Uint8Array}
 */
const __toBinary = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length;
    // @ts-ignore
    const bytes = new Uint8Array((((n - (base64[n - 1] == '=') - (base64[n - 2] == '=')) * 3) / 4) | 0);
    for (let i = 0, j = 0; i < n;) {
      const c0 = table[base64.charCodeAt(i++)],
        c1 = table[base64.charCodeAt(i++)];
      var c2 = table[base64.charCodeAt(i++)],
        c3 = table[base64.charCodeAt(i++)];
      bytes[j++] = (c0 << 2) | (c1 >> 4);
      bytes[j++] = (c1 << 4) | (c2 >> 2);
      bytes[j++] = (c2 << 6) | c3;
    }
    return bytes;
  };
})();