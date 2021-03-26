import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { ReferenceStore } from '../src/store.js';

const ref = new Map()
  .set('key0', 'data')
  .set('key1', 'base64:aGVsbG8sIHdvcmxk');

const store = new ReferenceStore(ref);

test('Decode ascii data', async () => {
  const decoder = new TextDecoder();
  const bytes = await store.getItem('key0');
  assert.is(decoder.decode(bytes), 'data');
});

test('Decode base64 data', async () => {
  const decoder = new TextDecoder();
  const bytes = await store.getItem('key1');
  assert.is(decoder.decode(bytes), 'hello, world');
});

// TODO: test [url, offset, length] refs and [url] refs

test.run();