/// <reference lib="esnext" />
import nunjucks from "nunjucks";

export interface ReferenceSpec {
  version: 1;
  templates: {
    [key: string]: string;
  };
  gen: {
    key: string;
    url: string;
    offset: string;
    length: string;
    dimensions: {
      [key: string]: Range | number[];
    };
  }[];
  refs: {
    [key: string]: string | [url: string, offset: number, length: number];
  };
}

interface ExpandedReference {
  [key: string]: Uint8Array | [url: string, offset: number, length: number];
}

interface Range {
  start?: number;
  stop: number;
  step?: number;
}

export function parse(spec: ReferenceSpec) {
  const render = (t: string, o?: { [key: string]: number }) => {
    return nunjucks.render(t, { ...spec.templates, ...o });
  };

  const gen: ExpandedReference = {};
  for (const g of spec.gen) {
    for (const dims of iterDims(g.dimensions)) {
      console.log(dims);
      const key = render(g.key, dims);
      const url = render(g.url, dims);
      const offset = render(g.offset, dims);
      const length = render(g.length, dims);
      gen[key] = [url, eval(offset), eval(length)];
    }
  }

  const encoder = new TextEncoder();

  const refs: ExpandedReference = {};
  for (const [key, ref] of Object.entries(spec.refs)) {
    if (typeof ref === "string") {
      refs[key] = encoder.encode(ref);
    } else {
      const [url, offset, length] = ref;
      refs[key] = [render(url), offset, length];
    }
  }

  return { ...refs, ...gen };
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

// python-like range generator
function* range({ stop, start = 0, step = 1 }: Range) {
  for (let i = start; i < stop; i += step) {
    yield i;
  }
}
