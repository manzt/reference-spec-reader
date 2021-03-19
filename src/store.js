// @ts-check
/// <reference lib="esnext" />

class KeyError extends Error {
  __zarr__ = "KeyError";
  constructor(msg) {
    super(msg);
    this.name = "KeyError";
  }
}

export class FileReferenceStore {

  /**
   * @param {Map<string, import('./types').Ref>} ref 
   */
  constructor(ref) {
    this.ref = ref;
  }

  /**
   * @param {string} url
   */
  static async fromUrl(url) {
    /**
     * @type {Record<string, import('./types').Ref> | import('./types').ReferenceFileSystem}
     */
    const json = await fetch(url).then((res) => res.json());

    /**
     * @type {Map<string, import('./types').Ref>}
     */
    let ref;
    if ("version" in json) {
      const { parse } = await import(new URL('./index.js', import.meta.url).href);
      const { default: nunjucks } = await import('nunjucks');
      ref = parse(json, nunjucks.renderString);
    } else {
      ref = new Map(Object.entries(json));
    }
    return new FileReferenceStore(ref);
  }

  /**
   * @param {string} url 
   */
  _url(url) {
    const [protocol, _path] = url.split('://');
    if (protocol === 'https' || protocol === 'http') {
      return url;
    }
    throw Error('Protocol not supported, got: ' + JSON.stringify(protocol));
  }

  /**
   * @param {{ url: string, offset?: number, size?: number }} props
   * @param {RequestInit} opts
   */
  _fetch({ url, offset, size }, opts) {
    if (offset !== undefined && size !== undefined) {
      // add range headers to request options
      opts = { ...opts, headers: { ...opts.headers, Range: `bytes=${offset}-${offset + size - 1}` } };
    }
    return fetch(this._url(url), opts);
  }

  /**
   * @param {string} key 
   * @param {RequestInit} opts 
   */
  async getItem(key, opts = {}) {
    const entry = this.ref.get(key);

    if (!entry) {
      throw new KeyError(key);
    }

    if (typeof entry === 'string') {
      if (entry.startsWith('base64:')) {
        return __toBinary(entry.slice(7)).buffer;
      }
      return __encoder.encode(entry).buffer;
    }

    const [url, offset, size] = entry;
    const res = await this._fetch({ url, offset, size }, opts);

    if (res.status === 200 || res.status === 206) {
      return res.arrayBuffer();
    }

    throw new Error(`Request unsuccessful for key ${key}. Response status: ${res.status}.`);
  }

  /**
   * @param {string} key
   */
  async containsItem(key) {
    return this.ref.has(key);
  }

  keys() {
    return Promise.resolve([...this.ref.keys()]);
  }

  /**
   * @param {string} key 
   * @param {ArrayBuffer} value 
   * @returns {never}
   */
  setItem(key, value) {
    throw Error('FileReferenceStore.setItem is not implemented.');
  }

  /**
   * @param {string} key 
   * @returns {never}
   */
  deleteItem(key) {
    throw Error('FileReferenceStore.deleteItem is not implemented.');
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

const __encoder = new TextEncoder();