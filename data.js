export const data = `
{
  "version": 1,
  "templates": {
      "u": "server.domain/path",
      "f": "{{c}}"
  },
  "gen": [
      {
        "key": "gen_key{{i}}",
        "url": "http://{{u}}_{{i}}",
        "offset": "{(i + 1) * 1000}",
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
    "key2": ["http://{{u}}", 10000, 100],
    "key3": ["http://{{f(c='text')}}", 10000, 100]
  }
}
`;
