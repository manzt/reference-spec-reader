## reference-spec-reader

Experimental parser for [`ReferenceFileSystem` description](https://github.com/intake/fsspec-reference-maker).
This repository also provides a `ReferenceStore` implementation, intended as a storage backend for
[`Zarr.js`](https://github.com/gzuidhof/zarr.js).

## Example V1 spec (JSON)

```json
// ref.json
{
  "version": 1,
  "templates": {
      "u": "server.domain/path",
      "f": "{{ c }}"
  },
  "gen": [
      {
        "key": "gen_key{{ i }}",
        "url": "http://{{ u }}_{{ i }}",
        "offset": "{{ (i + 1) * 1000 }}",
        "length": "1000",
        "dimensions": 
          {
            "i": {"stop":  5}
          }
      }   
  ],
  "refs": {
    "key0": "data",
    "key1": ["http://target_url", 10000, 100],
    "key2": ["http://{{ u }}", 10000, 100],
    "key3": ["http://{{ f(c='text') }}", 10000, 100],
    "key4": ["http://{{ f(c='text') }}"]
  }
}
```

## API Reference

### `parse`

<a name="parse" href="#parse">#</a><b>parse</b>(<i>spec</i>[, <i>renderString</i>]) · [Source](https://github.com/manzt/reference-spec-reader/blob/master/src/parse.js)

Parses both `v0` and `v1` references into `Map<string, Ref>`. A `Ref` is a union type of the following:

- `string`: Inline ascii/base64 encoded data.
- `[url: string]`: A url for a whole file.
- `[url: string | null, offset: number, length: number]`: A tuple describing a binary section of a url.

```javascript
const spec = await fetch('http://localhost:8080/ref.json').then(res => res.json());
const ref = parse(spec);
console.log(ref);
// Map(9) {
//  'key0' => 'data',
//  'key1' => [ 'http://target_url', 10000, 100 ],
//  'key2' => [ 'http://server.domain/path', 10000, 100 ],
//  'key3' => [ 'http://text', 10000, 100 ],
//  'key4' => [ 'http://text' ],
//  'gen_key0' => [ 'http://server.domain/path_0', 1000, 1000 ],
//  'gen_key1' => [ 'http://server.domain/path_1', 2000, 1000 ],
//  'gen_key2' => [ 'http://server.domain/path_2', 3000, 1000 ],
//  'gen_key3' => [ 'http://server.domain/path_3', 4000, 1000 ],
//  'gen_key4' => [ 'http://server.domain/path_4', 5000, 1000 ]
// }
```

This library includes a minimal built-in `render` method to render jinja-templates included in the `v1` spec. 
This method can be overriden by providing a custom `renderString` function as a second argument.

```javascript
import nunjucks from 'nunjucks';
const spec = await fetch('http://localhost:8080/ref.json').then(res => res.json());
const ref = parse(spec, nunjucks.renderString);
```

### `ReferenceStore`

A `Zarr.js` store reference implementation. Uses `fetch` API.

<a name="fromJSON" href="#fromJSON">#</a>
<em>ReferenceStore</em>.<b>fromJSON</b>(<i>url</i>, [, <i>options<i>]) · [Source](https://github.com/manzt/reference-spec-reader/blob/master/src/store.js)

* *data*: A string in a supported JSON format, or a corresponding Object instance. Must adhere to `v0` or `v1` reference specification.
* *options*:
  * *target*: A default target url for the reference.
  * *renderString*: A custom `renderString` function.

```javascript
// create store from an input JSON string (v0 references).
ReferenceStore.fromJSON(`{"key0":"data","key1":"base64:aGVsbG8sIHdvcmxk"}`);
```

```javascript
// create a store from an input JSON string loaded from `url`
ReferenceStore.fromJSON(await fetch(url).then(res => res.text()));
```

```javascript
// create a store from an input JSON object loaded from `url`
ReferenceStore.fromJSON(await fetch(url).then(res => res.json()));
```

```javascript
// create a store from an input JSON object loaded from `url` with default binary target
const res = await fetch('http://localhost:8080/data.tif.json');
ReferenceStore.fromJSON(await res.json(), { target: 'http://localhost:8080/data.tif' });
```