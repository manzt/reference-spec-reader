export interface ReferencesV1 {
  version: 1;
  templates: Record<string, string>;
  gen: {
    key: string;
    url: string;
    offset: string;
    length: string;
    dimensions: Record<string, Range | number[]>;
  }[];
  refs: Record<string, Ref>;
}

export type Ref = string | [url: string] | [url: string, offset: number, length: number];

export type RenderContext = Record<string, number | string | ((ctx: Record<string, string | number>) => string)>;

export type RenderFn = (template: string, ctx: RenderContext) => string;

export interface Range {
  start?: number;
  stop: number;
  step?: number;
}
