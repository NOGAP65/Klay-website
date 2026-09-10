import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';

const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = file => ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { WINDOW_ROOMS, defaultWindowRoom, windowRoomFor } = await import(moduleUrl(compile('src/features/visualiser/roomPresets.ts')));
assert.notEqual(defaultWindowRoom('blind').url, defaultWindowRoom('curtain').url);
for (const [category, rooms] of Object.entries(WINDOW_ROOMS)) {
  assert.ok(rooms.length >= 2);
  for (const room of rooms) {
    assert.ok(existsSync(`public${room.url}`), room.url);
    assert.equal(windowRoomFor(room.url), room);
    assert.equal(room.corners.length, 4);
    room.corners.flat().forEach(n => assert.ok(n > 0 && n < 1));
    const [tl, tr, br, bl] = room.corners;
    assert.ok(tl[0] < tr[0] && bl[0] < br[0] && tl[1] < bl[1] && tr[1] < br[1]);
    if (category === 'curtain') assert.ok(tr[0] - tl[0] > 0.8, 'Curtain presets cover the wide wall');
  }
}
assert.equal(windowRoomFor('data:image/jpeg;base64,customer-photo'), undefined);

// Exercise the real hook against out-of-order image loads. A previous room
// must never overwrite the newly selected category, or return after Clear.
const harness = { state: [], cleanup: [] };
globalThis.__photoHookTest = harness;
const fakeReact = moduleUrl(`
const h = globalThis.__photoHookTest;
export const useState = initial => {
  const i = h.state.length; h.state.push(initial);
  return [initial, value => { h.state[i] = typeof value === 'function' ? value(h.state[i]) : value; }];
};
export const useRef = current => ({current});
export const useCallback = fn => fn;
export const useEffect = fn => { h.cleanup.push(fn()); };
`);
const pending = [];
globalThis.Image = class { constructor() { pending.push(this); } };
const decoded = [];
globalThis.createImageBitmap = async () => {
  const bitmap = { width:1536, height:1024, closed:false, close() { this.closed = true; } };
  decoded.push(bitmap);
  return bitmap;
};
const hookCode = compile('src/features/visualiser/usePhotoUpload.ts').replace(/from ['"]react['"]/, `from '${fakeReact}'`);
const { usePhotoUpload } = await import(moduleUrl(hookCode));
const hook = usePhotoUpload();
hook.loadFromUrl(defaultWindowRoom('blind').url);
hook.loadFromUrl(defaultWindowRoom('curtain').url);
await pending[1].onload();
await pending[0].onload();
assert.equal(harness.state[0], defaultWindowRoom('curtain').url);
assert.equal(decoded[1].closed, true, 'Discard the late bitmap');
pending[0].onerror();
assert.equal(harness.state[2], null, 'Ignore errors from superseded requests');
hook.loadFromUrl('/another-room.webp');
hook.clear();
await pending[2].onload();
assert.equal(harness.state[0], null);
assert.equal(harness.state[1], null);
assert.ok(decoded[0].closed && decoded[2].closed);
hook.loadFromUrl('/unmounted-room.webp');
harness.cleanup.forEach(fn => fn?.());
await pending[3].onload();
assert.equal(harness.state[0], null);
assert.equal(decoded[3].closed, true);
console.log('Visualiser rooms: distinct presets, calibrated wide curtain areas, upload fallback and stale-load/clear/unmount races pass.');
