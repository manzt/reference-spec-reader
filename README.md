## reference-spec-reader

Experimental parser for [`ReferenceFileSystem` description](https://github.com/intake/fsspec-reference-maker).
This repository also provides a `ReferenceStore` implementation, intended as a storage backend for
[`Zarr.js`](https://github.com/gzuidhof/zarr.js).

#### Example V1 spec (JSON)

```json
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

#### Usage

```javascript
import { parse } from './src/parse.js';

fetch('ref.json')
  .then(res => res.json())
  .then(spec => parse(spec))
  .then(console.log);

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


#### API

<a name="parse" href="#parse">#</a><b>parse</b>(<i>spec</i>[, <i>renderString</i>]) · [Source](https://github.com/manzt/reference-spec-reader/blob/master/src/parse.js)


<a name="ReferenceStore" href="#ReferenceStore">#</a>new <b>ReferenceStore</b>(<i>ref</i>) · [Source](https://github.com/manzt/reference-spec-reader/blob/master/src/store.js)