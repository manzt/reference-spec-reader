/// <reference lib="esnext" />
export interface ReferenceFileSystem {
  version: 1;
  templates: { [key: string]: string; };
  gen: {
    key: string;
    url: string;
    offset: string;
    length: string;
    dimensions: {
      [key: string]: Range | number[];
    };
  }[];
  refs: Refs;
}
interface Refs {
  [key: string]: string | [url: string] | [url: string, offset: number, length: number];
}

type RenderContext = { [key: string]: number | string | ((ctx: { [key: string]: string }) => string) };
type RenderFn = (template: string, ctx: RenderContext) => string;

export function parse(spec: ReferenceFileSystem, renderString: RenderFn): Refs {
  const context: RenderContext = {};
  for (const [key, template] of Object.entries(spec.templates)) {
    // TODO: better check for whether a template or not
    if (template.includes("{{")) {
      // Need to register filter in environment
      context[key] = (ctx: { [key: string]: number | string }) => renderString(template, ctx);
    } else {
      context[key] = template;
    }
  }

  const render = (t: string, o?: { [key: string]: number }) => {
    return renderString(t, { ...context, ...o });
  };

  const refs: Refs = {};

  for (const [key, ref] of Object.entries(spec.refs)) {
    if (typeof ref === "string") {
      refs[key] = ref;
    } else {
      const url = render(ref[0]);
      refs[key] = ref.length === 1 ? [url] : [url, ref[1], ref[2]];
    }
  }

  for (const g of spec.gen) {
    for (const dims of iterDims(g.dimensions)) {
      const key = render(g.key, dims);
      const url = render(g.url, dims);
      const offset = render(g.offset, dims);
      const length = render(g.length, dims);
      refs[key] = [url, parseInt(offset), parseInt(length)];
    }
  }

  return refs;
}

function* iterDims(dimensions: { [key: string]: Range | number[] }) {
  const keys = Object.keys(dimensions);
  const iterables = Object.values(dimensions).map((i) =>
    Array.isArray(i) ? i : range(i)
  );
  for (const values of product(...iterables)) {
    yield Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  }
}

// python-like itertools.product generator
// https://gist.github.com/cybercase/db7dde901d7070c98c48
function* product<T extends Array<Iterable<any>>>(
  ...iterables: T
): IterableIterator<
  { [K in keyof T]: T[K] extends Iterable<infer U> ? U : never }
> {
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
      yield results.map(({ value }) => value) as any;
      i = 0;
    }
    results[i] = iterators[i].next();
  }
}

interface Range {
  start?: number;
  stop: number;
  step?: number;
}

// python-like range generator
function* range({ stop, start = 0, step = 1 }: Range) {
  for (let i = start; i < stop; i += step) {
    yield i;
  }
}
