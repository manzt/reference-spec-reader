import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { ReferenceStore } from '../src/store.js';

// prettier-ignore
const ref = new Map()
  .set('key0', 'data')
  .set('key1', 'base64:aGVsbG8sIHdvcmxk')
  .set('key2', [null, 1000, 100]);

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

test('Throws for missing target', async () => {
	try {
		await store.getItem('key2');
		assert.unreachable('show have thrown.');
	} catch (err) {
		assert.ok('threw error');
		assert.instance(err, Error);
	}
});

test('Static constructor', () => {
	const str = '{"key0":"data","key1":"base64:aGVsbG8sIHdvcmxk","key2":[null,1000,100]}';
	assert.equal(ReferenceStore.fromJSON(str).ref, ref);
	const spec = { key0: 'data', key1: 'base64:aGVsbG8sIHdvcmxk', key2: [null, 1000, 100] };
	assert.equal(ReferenceStore.fromJSON(spec).ref, ref);
});

// TODO: test [url, offset, length] refs and [url] refs

test.run();
