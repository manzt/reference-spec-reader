## reference-spec-reader

Experimental parser for [`ReferenceFileSystem` description](https://github.com/intake/fsspec-reference-maker).

#### Example spec (JSON)

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
    "key3": ["http://{{ f(c='text') }}", 10000, 100]
  }
}
```

#### Demo

The [demo](./test.js) requires `nunjucks.renderString`.

```bash
npm install
npm test
# {
#  key0: 'data',
#  key1: [ 'http://target_url', 10000, 100 ],
#  key2: [ 'http://server.domain/path', 10000, 100 ],
#  key3: [ 'http://text', 10000, 100 ],
#  gen_key0: [ 'http://server.domain/path_0', 1000, 1000 ],
#  gen_key1: [ 'http://server.domain/path_1', 2000, 1000 ],
#  gen_key2: [ 'http://server.domain/path_2', 3000, 1000 ],
#  gen_key3: [ 'http://server.domain/path_3', 4000, 1000 ],
#  gen_key4: [ 'http://server.domain/path_4', 5000, 1000 ]
# }
```