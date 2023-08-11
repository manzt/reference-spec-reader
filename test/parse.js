import { test } from "uvu";
import * as assert from "uvu/assert";

import nunjucks from "nunjucks";
import { parse } from "../src/parse.js";

const v1 = `{
  "version": 1,
  "templates": {
      "u": "server.domain/path",
      "f": "{{c}}"
  },
  "gen": [
      {
        "key": "gen_key{{i}}",
        "url": "http://{{u}}_{{i}}",
        "offset": "{{ (i + 1) * 1000 }}",
        "length": "1000",
        "dimensions": 
          {
            "i": {"stop":  5}
          }
      },
      {
        "key": "gen_key{{i}}",
        "url": "http://{{u}}_{{i}}",
        "dimensions":
          {
            "i": {"start": 5, "stop":  7}
          }
      }   
  ],
  "refs": {
    "key0": "data",
    "key1": ["http://target_url", 10000, 100],
    "key2": ["http://{{u}}", 10000, 100],
    "key3": ["http://{{ f(c='text') }}", 10000, 100],
    "key4": ["http://{{ f(c='text') }}"]
  }
}`;

const expected = new Map(
	Object.entries({
		key0: "data",
		key1: ["http://target_url", 10000, 100],
		key2: ["http://server.domain/path", 10000, 100],
		key3: ["http://text", 10000, 100],
		key4: ["http://text"],
		gen_key0: ["http://server.domain/path_0", 1000, 1000],
		gen_key1: ["http://server.domain/path_1", 2000, 1000],
		gen_key2: ["http://server.domain/path_2", 3000, 1000],
		gen_key3: ["http://server.domain/path_3", 4000, 1000],
		gen_key4: ["http://server.domain/path_4", 5000, 1000],
		gen_key5: ["http://server.domain/path_5"],
		gen_key6: ["http://server.domain/path_6"],
	}),
);

test("Parse references builtin", async () => {
	const spec = JSON.parse(v1);
	assert.equal(parse(spec), expected);
});

test("Parse references nunjucks", async () => {
	const spec = JSON.parse(v1);
	assert.equal(parse(spec, nunjucks.renderString), expected);
});

test.run();
