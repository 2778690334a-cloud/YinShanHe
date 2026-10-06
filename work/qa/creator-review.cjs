'use strict';
// Restricted review harness: reads only the five authorized production files.
// Node-only stubs verify data/control flow; they do not emulate WebGL or browser layout.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const dir = path.resolve(__dirname, '../../outputs/YinShanHe');
const sources = Object.fromEntries(['creator-art.js', 'creator.js', 'creator-studio.js', 'creator.html', 'creator.css'].map(n => [n, fs.readFileSync(path.join(dir, n), 'utf8')]));
const realm = {console};
vm.createContext(realm);
vm.runInContext(sources['creator-art.js'], realm);
const A = realm.YSHCreatorArt;
let count = 0;
function check(name, fn) { const evidence = fn(); count++; console.log(`PASS ${count}: ${name}${evidence ? ' | ' + evidence : ''}`); }
const plain = v => JSON.parse(JSON.stringify(v));
const item = (type, id, x = 0, z = 0, extra = {}) => Object.assign(A.defaults(type, id, x, z), extra);

class Vec {
  constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
  set(x, y, z) { Object.assign(this, {x, y, z}); return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { return new Vec(this.x, this.y, this.z); }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  setScalar(s) { return this.set(s, s, s); }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { return this.multiplyScalar(1 / (this.length() || 1)); }
}
class Group {
  constructor() { this.children = []; this.userData = {}; this.position = new Vec(); this.scale = new Vec(1, 1, 1); this.rotation = {}; this.quaternion = {setFromUnitVectors() {}}; }
  add(...nodes) { this.children.push(...nodes); }
  traverse(fn) { fn(this); this.children.forEach(n => n.traverse(fn)); }
}
class Geometry {
  constructor(...args) { this.args = args; this.attributes = {}; }
  setAttribute(k, v) { this.attributes[k] = v; }
  setIndex(v) { this.index = v; }
  computeVertexNormals() {}
}
class Mesh extends Group { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
const T = {Group, Mesh, Vector3: Vec, BufferGeometry: Geometry, BoxGeometry: Geometry, SphereGeometry: Geometry, CylinderGeometry: Geometry,
  Float32BufferAttribute: class { constructor(v, size) { this.array = new Float32Array(v); this.count = v.length / size; } }};
const sharedMaterial = {dispose() { throw new Error('Shared material must not be disposed'); }};
const make = p => A.createLayers(T, p, {material: () => sharedMaterial});

function editor(p) {
  const nodes = new Map();
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.dataset = {}; this.style = {}; this.classList = {add() {}, remove() {}, toggle() {}}; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    fire(type, e) { for (const fn of this.listeners[type] || []) fn(e); }
    setAttribute() {} appendChild(child) { this.children.push(child); child.parentElement = this; } querySelectorAll() { return []; }
    getContext() { return {}; } focus() {} setPointerCapture() {}
    getBoundingClientRect() { return {left: 0, top: 0, width: 1024, height: 672}; }
  }
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  const document = {createElement: () => new Element(), getElementById: get, addEventListener() {}, body: new Element()};
  let saved = JSON.stringify(p), submitted;
  const window = {YSHCreatorArt: A};
  vm.runInNewContext(sources['creator.js'], {window, document, localStorage: {getItem: () => saved, setItem: (_, s) => { saved = s; }}, requestAnimationFrame: () => 1, console});
  const api = window.YSHCreator.create({pause() {}, print(p) { submitted = p; }, preview(p) { submitted = p; }});
  api.open();
  return {api, get, saved: () => JSON.parse(saved), submitted: () => submitted};
}
function event(x, z) { return {button: 0, pointerId: 1, clientX: (x / A.W + .5) * 1024, clientY: (z / A.D + .5) * 672}; }

check('sample plan is valid; mountain/water/tree/house can individually form a valid plate', () => {
  assert.equal(A.validate(A.samplePlan()).ok, true);
  for (const type of ['mountain', 'water', 'tree', 'house']) assert.equal(A.validate({items: [item(type, type)]}).ok, true, type);
  assert.equal(A.validate({items: [item('boat', 'b')]}).ok, false, 'boat requires water by design');
});
check('plate sequence skips empty layers for all seven nonempty combinations and repeat runs', () => {
  const studio = sources['creator-studio.js'];
  const maskCtx = Array.from({length: 3}, () => ({filled: false, fillRect() { this.filled = true; }, clearRect() { this.filled = false; }}));
  const noop = () => {};
  const node = {classList: {add: noop, remove: noop}, setAttribute: noop};
  const ctx = {gallery: false, creator: null, reduced: true, CW: 1024, CH: 672, maskCtx,
    inkMaskCtx: maskCtx.map(() => ({fillRect: noop, clearRect: noop})),
    inkTargets: [[], [], []], groups: [new Group(), new Group(), new Group()],
    chapters: [{label: '0'}, {label: '1'}, {label: '2'}],
    document: {body: node}, $: () => node, dt: 1,
    bendPaper: noop, updatePrint: noop, updateBlock: noop, showPrintFace: noop, showPaperBack: noop,
    syncBlock: noop, setCamera: noop, updateUI: noop, toast: noop, tone: noop, updateBack: noop,
    guides: {}, customPlan: {title: 'test'}};
  vm.createContext(ctx);
  vm.runInContext(studio.slice(studio.indexOf('function reset(){'), studio.indexOf('function assist(){')), ctx);
  const laying = studio.split('\n').find(s => s.trim().startsWith("if(state==='laying'){revealTime"));
  const reveal = studio.split('\n').find(s => s.trim().startsWith("if(state==='reveal'){revealTime"));
  for (let repeat = 0; repeat < 3; repeat++) for (let bits = 1; bits < 8; bits++) {
    const active = [0, 1, 2].filter(i => bits & (1 << i));
    ctx.activePrintLayers = active; ctx.start();
    assert.ok(maskCtx.every(c => !c.filled), 'start clears masks after previous composition');
    const seen = [];
    for (const expected of active) {
      assert.equal(ctx.state, 'align'); assert.equal(ctx.layer, expected); seen.push(ctx.layer);
      ctx.offset = {x: 0, z: 0}; ctx.advance(); assert.equal(ctx.state, 'inking');
      ctx.inkCoverage = 1; ctx.advance(); assert.equal(ctx.state, 'laying');
      vm.runInContext(laying, ctx); assert.equal(ctx.state, 'brush');
      ctx.coverage = 1; ctx.advance(); assert.equal(ctx.state, 'reveal');
      vm.runInContext(reveal, ctx);
    }
    assert.deepEqual(seen, active);
    assert.equal(ctx.state, 'final');
    assert.deepEqual(maskCtx.map(c => c.filled), [0, 1, 2].map(i => active.includes(i)));
  }
});
check('storage limits reject excess items, water controls and oversized drafts', () => {
  for (const p of [{items: Array.from({length:25}, (_,i)=>item('tree','t'+i))}, {items:[item('water','w',0,0,{points:Array.from({length:10},()=>({x:0,z:0}))})]}, {items:[item('tree','t')],title:'x'.repeat(64001)}]) assert.equal(editor(p).api.getState().itemCount, 0);
});
check('extreme imported house height is bounded and all Float32 positions stay finite', () => {
  const p = {items: [item('house', 'h', 0, 0, {height: 1e40})]};
  assert.equal(A.validate(p).ok, true);
  assert.equal(editor(p).api.getState().valid, true);
  let nonfinite = 0;
  for (const g of make(p)) g.traverse(o => { for (const n of o.geometry?.attributes.position?.array || []) if (!Number.isFinite(n)) nonfinite++; });
  assert.equal(nonfinite, 0);
  assert.equal(A.normalize(p).items[0].height, 2.6);
  return `${nonfinite} non-finite vertex components`;
});
check('fixed sample handle: first pointermove preserves original endpoint', () => {
  const p = plain(A.samplePlan()), water = p.items.find(i => i.type === 'water');
  const ui = editor(p), canvas = ui.get('create-canvas');
  const x = water.x + water.points[0].x, z = water.z + water.points[0].z;
  canvas.fire('pointerdown', event(x + .2, z)); canvas.fire('pointerup', event(x + .2, z));
  assert.equal(ui.api.getState().selected, water.id);
  canvas.fire('pointerdown', event(x, z)); canvas.fire('pointermove', event(x, z)); canvas.fire('pointerup', event(x, z));
  const after = ui.saved().items.find(i => i.id === water.id);
  assert.ok(Math.abs(after.points[0].x - water.points[0].x) < 1e-10);
  return `local endpoint x: ${water.points[0].x} -> ${after.points[0].x} without pointer displacement`;
});
check('overlapping identical mountains select the last drawn, top item', () => {
  const p = {items: [item('mountain', 'bottom'), item('mountain', 'top')]};
  assert.equal(A.validate(p).ok, true);
  const ui = editor(p); ui.get('create-canvas').fire('pointerdown', event(0, 0));
  assert.equal(ui.api.getState().selected, 'top');
  assert.match(sources['creator-art.js'], /p\.items\.slice\(\)\.sort/);
  return `selected=${ui.api.getState().selected}; draw order=bottom,top`;
});
check('boat coverage and houses reject invalid grounding', () => {
  const water = item('water', 'w', 0, 0, {width: 1.1, points: [{x: -2, z: 0}, {x: 2, z: 0}]});
  const boat = item('boat', 'b');
  assert.equal(A.validate({items: [water, boat]}).ok, true);
  assert.equal(A.validate({items: [water, {...boat, z: .5}]}).ok, false);
  assert.equal(A.validate({items: [water, boat, item('mountain', 'm')]}).ok, false);
  assert.equal(A.validate({items: [water, item('house', 'h')]}).ok, false);
  assert.equal(A.validate({items: [item('house', 'h'), item('mountain', 'm')]}).ok, false);
  assert.equal(A.validate({items: [item('house', 'h1'), item('house', 'h2')]}).ok, false);
});
check('quadratic curve boundary uses its extrema, including stroke radius', () => {
  const water = item('water', 'w', 0, 0, {width: .25, points: [{x: -1, z: 0}, {x: 0, z: 5.3}, {x: 1, z: 0}]});
  assert.ok(Math.abs(A.bounds(water).maxZ - 2.775) < 1e-10);
  assert.equal(A.validate({items: [water]}).ok, true);
  water.points[1].z = 5.4;
  assert.equal(A.validate({items: [water]}).ok, false);
});
check('mirrored progress mapping is an involution; automatic brush targets map back exactly', () => {
  const match = sources['creator-studio.js'].match(/function progressPoint\(p\)\{[^\n]+\}/);
  const transform = vm.runInNewContext(`(${match[0]})`, {CW: 1024});
  for (const x of [8, 116, 512, 1004]) {
    assert.equal(transform({px: 1024 - x, py: 128}).px, x);
    assert.equal(transform(transform({px: x})).px, x);
  }
  assert.match(sources['creator-studio.js'], /pos\.setY\(i,-\.05\+data\[/);
  assert.match(sources['creator-studio.js'], /Math\.floor\(\(1-u\)\*CW\)/);
});
check('source review: remount disposes recorded geometry, not shared material; target flags reset', () => {
  const install = sources['creator-studio.js'].split('function installComposition(input){')[1].split('creator=window.YSHCreator.create')[0];
  assert.match(install, /galleryModel\.clear\(\)/);
  assert.match(install, /for\(const geometry of customGeometry\)geometry\.dispose\(\);customGeometry\.clear\(\)/);
  assert.doesNotMatch(install, /material\.dispose\(/);
  assert.match(install, /inkTargets\[l\]\.length=0/);
  assert.match(sources['creator-studio.js'], /q\.hit=q\.inkHit=false/);
});
check('source review: title consumers use textContent/value/download, not interpolated HTML', () => {
  const p = A.normalize({title: '<img src=x>&"\u0000题', items: [item('tree', 't')]});
  assert.equal(p.title, '&"题');
  assert.match(sources['creator-studio.js'], /textContent=customPlan\.title/);
  assert.match(sources['creator.js'], /\$\('create-title'\)\.value=plan\.title/);
  assert.doesNotMatch(sources['creator.js'] + sources['creator-studio.js'], /innerHTML\s*=\s*(?:customPlan|plan)\.title/);
});
console.log(`\n${count} checks passed (including regressions for bounded height and topmost selection).`);
console.log('Source SHA256 snapshot:');
for (const [name, text] of Object.entries(sources)) console.log(name + ' ' + crypto.createHash('sha256').update(text).digest('hex'));

