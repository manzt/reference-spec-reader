import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { render } from "../src/render.js";

test('Simple string/number substitution', () => {
  [
    ["{{ i }}", { i: 10 }, "10"],
    ["{{i }}", { i: 'text' }, 'text'],
    ["{{i}}", { i: 'text' }, 'text'],
    ["{{  i}}", { i: 'text' }, 'text'],
    ["{{  i }}", { i: 'text' }, 'text'],
    [`{{ aLongVariableName }}.png`, { aLongVariableName: 'hello-text' }, 'hello-text.png'],
  ].forEach(([template, ctx, expected]) => {
    assert.is(render(template, ctx), expected);
  });
});

test('Function with named arguments', () => {
  [
    ["http://{{ f(c='text') }}", { f: ({ c }) => c }, "http://text"],
    [`http://{{ f(c='text', f = 199, foo ="bar") }}`, { f: ({ c, f, foo }) => `${c}_${f}_${foo}` }, "http://text_199_bar"],
    [`http://{{ f(c='text', f = 199, foo ="bar"), }}`, { f: ({ c, f, foo }) => `${c}_${f}_${foo}` }, "http://text_199_bar"],
    [`http://{{f(c='text',f=199,foo ="bar")}}`, { f: ({ c, f, foo }) => `${c}_${f}_${foo}` }, "http://text_199_bar"],
    [`http://{{some_long_function_name(foo='bar',i=10)}}`, { some_long_function_name: ({ foo, i }) => `${foo}_${i}` }, "http://bar_10"],
  ].forEach(([template, ctx, expected]) => {
    assert.is(render(template, ctx), expected);
  });
});

test('Simple expressions', () => {
  [
    ["{{ (i + 1) + j }}", { i: 0, j: 200 }, "201"],
    ["{{ (i + 1) * foo + 2 }}", { i: 1, foo: 10 }, "22"],
    ["{{ x + (i + 1) * i + 2 }}", { i: 1, x: 10 }, "14"],
  ].forEach(([template, ctx, expected]) => {
    assert.is(render(template, ctx), expected);
  });
})

test('Throws', () => {
  [
    ["{{{ i }}", { i: 'text' }],
    ["{{ foo }}", {}],
    ["{{ x + i }}", { x: undefined, i: 10 }],
    ["{{ $ i }}", { i: 10 }],
    ["{{ i + 2 }}", { i: "hello" }],
    [`http://{{ f(c='text') }}`, {}],
    [`{{ i i }}`, { i: 10 }],
    [`{{ i + 2 }}`, { i: "10" }],
  ].forEach(([template, ctx]) => {
    assert.throws(() => render(template, ctx));
  });
});

test.run();