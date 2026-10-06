'use strict';
/* Run: node work/qa/creator-art.cjs. No browser, network, screenshots or output files. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const T = require(path.join(root, 'outputs/YinShanHe/vendor/three.min.js'));
const source = fs.readFileSync(path.join(root, 'outputs/YinShanHe/creator-art.js'), 'utf8');
let checks = 0, failures = 0;
function test(name, fn) {
  try { fn(); checks++; console.log('PASS ' + name); }
  catch (error) { failures++; process.exitCode=1; console.error('FAIL ' + name + ': ' + error.message.slice(0,400)); }
}
function near(a, b, epsilon = 1e-6) { assert.ok(Math.abs(a - b) <= epsilon, `${a} != ${b}`); }
const mul = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
class Context {
  constructor() { this.matrix=[1,0,0,1,0,0];this.stack=[];this.calls=[];this.current=[];this.globalAlpha=1; }
  setTransform(...m){this.matrix=m;}
  save(){this.stack.push({matrix:this.matrix.slice(),globalAlpha:this.globalAlpha,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth});}
  restore(){Object.assign(this,this.stack.pop());}
  translate(x,z){this.matrix=mul(this.matrix,[1,0,0,1,x,z]);}
  rotate(r){this.matrix=mul(this.matrix,[Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);}
  scale(x,z){this.matrix=mul(this.matrix,[x,0,0,z,0,0]);}
  beginPath(){this.current=[];}
  moveTo(x,z){this.vertex(x,z);}
  lineTo(x,z){this.vertex(x,z);}
  vertex(x,z){const m=this.matrix;this.current.push([m[0]*x+m[2]*z+m[4],m[1]*x+m[3]*z+m[5]]);}
  closePath(){}
  clip(){}
  fill(){this.record('fill');}
  stroke(){this.record('stroke');}
  record(kind){this.calls.push({kind,points:this.current.map(p=>p.slice()),matrix:this.matrix.slice(),style:kind==='fill'?this.fillStyle:this.strokeStyle,alpha:this.globalAlpha});}
  createLinearGradient(...args){return {args,stops:[],addColorStop(t,c){this.stops.push([t,c]);}};}
}
const document = {createElement(tag){assert.equal(tag,'canvas');const ctx=new Context();return {width:0,height:0,getContext(kind){assert.equal(kind,'2d');return ctx;},ctx};}};
const window = {document};
vm.runInNewContext(source,{window,console});
const A=window.YSHCreatorArt;
const copy=x=>JSON.parse(JSON.stringify(x));
const item=(type,id,x=0,z=0,extra={})=>Object.assign(A.defaults(type,id,x,z),extra);
const plan=items=>({version:1,title:'测试',items,palette:['#567a78','#647a47','#a35338']});
const world=(i,x,z)=>{const a=i.rotation*Math.PI/180;return {x:i.x+i.scale*(x*Math.cos(a)-z*Math.sin(a)),z:i.z+i.scale*(x*Math.sin(a)+z*Math.cos(a))};};
const materials=new Map();let materialDisposals=0;
function material(color,kind){const key=color+kind;if(!materials.has(key)){const m=new T.MeshBasicMaterial({color});m.userData.kind=kind;m.addEventListener('dispose',()=>materialDisposals++);materials.set(key,m);}return materials.get(key);}
function create(p){return A.createLayers(T,p,{material});}
function meshes(layers){const result=[];layers.forEach(l=>l.traverse(o=>{if(o.isMesh)result.push(o);}));return result;}
function dispose(layers){meshes(layers).forEach(o=>o.geometry.dispose());}

test('exact public API and defaults',()=>{
  assert.deepEqual(Object.keys(A).sort(),['W','D','TYPES','VARIANTS','variants','SAMPLES','ORDER','layerOf','drawOrder','defaults','normalize','drawLayers','createLayers','validate','hitTest','bounds','samplePlan'].sort());
  assert.equal(A.W,9.5);assert.equal(A.D,6.2);assert.deepEqual(copy(A.TYPES),['mountain','water','tree','boat','house','rock','reeds','lantern']);
  near(A.defaults('mountain','m',0,0).height,1.5);near(A.defaults('tree','t',0,0).height,1);near(A.defaults('water','w',0,0).width,.55);
  assert.deepEqual(copy(A.defaults('water','w',0,0).points),[{x:-1.3,z:-.3},{x:0,z:.35},{x:1.3,z:-.2}]);
});
test('normalization is pure, finite, bounded, unique and lossless for valid items',()=>{
  const input=plan([item('mountain','same',0,0),item('water','same',1,1),item('house','same-2',2,1)]),before=JSON.stringify(input);
  input.title='<b>山河</b>'+ '🌿'.repeat(30);input.palette=['#AbC','bad','#123456'];input.items[0].x=NaN;input.items[0].scale=99;input.items[0].height=-1;input.items[1].rotation=450;input.items[1].width=Infinity;
  const badBefore=JSON.stringify(input),n=A.normalize(input);
  assert.equal(JSON.stringify(input),badBefore);assert.notEqual(before,badBefore);assert.equal(new Set(n.items.map(i=>i.id)).size,3);
  assert.equal(n.items[0].x,0);assert.equal(n.items[0].scale,1.6);assert.equal(n.items[0].height,.6);assert.equal(n.items[1].rotation,90);assert.equal(n.items[1].width,.55);
  assert.equal(Array.from(n.title).length,20);assert.ok(!n.title.includes('<'));assert.deepEqual(copy(n.palette),['#aabbcc','#647a47','#123456']);
  assert.deepEqual(copy(A.normalize(n)),copy(n));n.items[1].points[0].x=50;assert.notEqual(input.items[1].points[0].x,50);
  assert.equal(A.normalize(plan(Array.from({length:25},(_,i)=>item('tree','t'+i)))).items.length,25);
});
test('empty and >24 invalid; empty single plates allowed; forests and overlapping mountains allowed',()=>{
  assert.equal(A.validate(plan([])).ok,false);
  const only=A.validate(plan([item('tree','tree')]));assert.equal(only.ok,true);assert.deepEqual(copy(only.layers),[0,1,0]);
  assert.equal(A.validate(plan(Array.from({length:24},(_,i)=>item('tree','t'+i)))).ok,true);
  assert.equal(A.validate(plan(Array.from({length:25},(_,i)=>item('tree','t'+i)))).ok,false);
  assert.equal(A.validate(plan([item('mountain','a'),item('mountain','b',.2,.1),item('tree','c')])).ok,true);
});
test('sample has nine items, all five types, all three printable plates and passes rules',()=>{
  const s=A.samplePlan(),v=A.validate(s);assert.equal(s.items.length,9);assert.equal(new Set(s.items.map(i=>i.type)).size,5);assert.equal(v.ok,true,JSON.stringify(v));assert.ok(v.layers.every(n=>n>0));
  s.items[0].x=100;assert.notEqual(A.samplePlan().items[0].x,100);
});
test('water bounds include true quadratic extrema, round width, rotation and scale',()=>{
  const w=item('water','w',.2,-.3,{scale:1.4,rotation:37,width:.8,points:[{x:-1,z:0},{x:0,z:2},{x:1,z:0}]}),b=A.bounds(w),r=w.width*w.scale/2;
  for(let k=0;k<=1000;k++){
    const t=k/1000,p=world(w,-1+2*t,4*t*(1-t));
    assert.ok(p.x-r>=b.minX-1e-8&&p.x+r<=b.maxX+1e-8&&p.z-r>=b.minZ-1e-8&&p.z+r<=b.maxZ+1e-8);
    assert.equal(A.hitTest(w,p.x,p.z),true);
  }
  const simple=item('water','s',0,0,{points:[{x:-1,z:0},{x:1,z:0}],width:1,rotation:90,scale:1.5}),bb=A.bounds(simple);
  near(bb.minX,-.75);near(bb.maxX,.75);near(bb.minZ,-2.25);near(bb.maxZ,2.25);
});
test('picking handles rotated local geometry and rejects outside coordinates',()=>{
  for(const type of A.TYPES){
    const i=item(type,type,.6,-.3,{rotation:71,scale:1.25}),p=world(i,type==='water'?.0:0,type==='water'?.05:0);
    assert.equal(A.hitTest(i,p.x,p.z),true,type);assert.equal(A.hitTest(i,20,-20),false,type);assert.equal(A.hitTest(i,NaN,0),false);
  }
});
test('margin applies to complete rotated outlines, including scaled water width',()=>{
  const w=item('water','w',0,0,{width:1,scale:1.6,points:[{x:-1,z:0},{x:1,z:0}]}),b=A.bounds(w);
  w.x=A.W/2-.3-b.maxX;assert.equal(A.validate(plan([w])).ok,true);
  w.x+=.001;assert.match(A.validate(plan([w])).issues[0].reason,/越界/);
  const h=item('house','h',4,2,{rotation:45});assert.equal(A.validate(plan([h])).ok,false);
});
test('houses cannot intersect mountains, narrow crossing water, or rotated houses',()=>{
  assert.ok(A.validate(plan([item('house','h'),item('mountain','m')])).issues.some(i=>i.id==='h'&&/山体/.test(i.reason)));
  const w=item('water','w',0,0,{width:.25,points:[{x:-2,z:.40},{x:2,z:.40}]});
  assert.ok(A.validate(plan([item('house','h'),w])).issues.some(i=>/水道/.test(i.reason)));
  const result=A.validate(plan([item('house','a'),item('house','b',.85,0,{rotation:45})]));assert.ok(result.issues.some(i=>i.id==='a'));assert.ok(result.issues.some(i=>i.id==='b'));
  assert.equal(A.validate(plan([item('house','a',-2,0),item('house','b',2,0)])).ok,true);
});
test('whole hull containment, interior water gaps and mountain occlusion are enforced',()=>{
  const boat=item('boat','b'),water=item('water','w',0,0,{width:.8,points:[{x:-2,z:0},{x:2,z:0}]});
  assert.equal(A.validate(plan([boat,water])).ok,true);
  assert.equal(A.validate(plan([boat])).ok,false);
  assert.equal(A.validate(plan([boat,Object.assign({},water,{width:.25})])).ok,false);
  assert.equal(A.validate(plan([item('boat','edge',0,.31),water])).ok,false);
  const ends=[item('water','left',-.65,0,{width:.4,points:[{x:-.4,z:0},{x:.1,z:0}]}),item('water','right',.65,0,{width:.4,points:[{x:-.1,z:0},{x:.4,z:0}]})];
  assert.equal(A.validate(plan([boat,...ends])).ok,false);
  const occluded=A.validate(plan([boat,water,item('mountain','m')]));assert.ok(occluded.issues.some(i=>i.id==='b'&&/遮住/.test(i.reason)));
  assert.equal(A.validate(plan([water,item('mountain','m')])).ok,false,'water is now kept clear of mountain ground');
});
test('2D canvases are transparent, deterministic, sized and partitioned into correct plates',()=>{
  const empty=A.drawLayers(plan([]),950,620);assert.equal(empty.length,3);empty.forEach(c=>{assert.equal(c.width,950);assert.equal(c.height,620);assert.equal(c.ctx.calls.length,0);});
  const s=A.samplePlan(),before=JSON.stringify(s),a=A.drawLayers(s,950,620),b=A.drawLayers(s,950,620);assert.equal(JSON.stringify(s),before);
  // Gradient methods belong to separate mock objects; compare recorded drawing data.
  assert.equal(JSON.stringify(a.map(c=>c.ctx.calls)),JSON.stringify(b.map(c=>c.ctx.calls)));assert.ok(a.every(c=>c.ctx.calls.length>0));
  const only=A.drawLayers(plan([item('tree','t')]),950,620);assert.equal(only[0].ctx.calls.length,0);assert.equal(only[2].ctx.calls.length,0);
  assert.ok(only[1].ctx.calls.every(c=>c.points.every(p=>p.every(Number.isFinite))));
});
test('Canvas and THREE use identical centered coordinates and opposite rotation signs',()=>{
  for(const type of A.TYPES){
    const i=item(type,type,.9,-.6,{scale:1.3,rotation:43}),p=plan([i]),canvases=A.drawLayers(p,1235,806),layers=create(p),layer=A.layerOf(type),group=layers[layer].children[0];
    layers[layer].updateMatrixWorld(true);near(group.rotation.y,-i.rotation*Math.PI/180);near(group.position.x,i.x);near(group.position.z,i.z);assert.equal(group.userData.itemId,i.id);assert.equal(group.userData.type,type);
    const call=canvases[layer].ctx.calls[0],m=call.matrix;
    for(const q of [[0,0],[.31,-.27],[-.45,.12]]){
      const v=new T.Vector3(q[0],0,q[1]).applyMatrix4(group.matrixWorld);
      near(m[0]*q[0]+m[2]*q[1]+m[4],(v.x+A.W/2)*1235/A.W);
      near(m[1]*q[0]+m[3]*q[1]+m[5],(v.z+A.D/2)*806/A.D);
    }
    dispose(layers);
  }
});
test('mountain slopes reach paper; water is thin at .035; all geometry is finite and within bounds',()=>{
  const p=A.samplePlan(),layers=create(p);layers.forEach(l=>l.updateMatrixWorld(true));
  layers.forEach(l=>l.children.forEach(group=>{
    const it=p.items.find(i=>i.id===group.userData.itemId),b=A.bounds(it);
    if(it.type==='water')near(group.position.y,.035);
    group.traverse(o=>{if(!o.isMesh)return;const position=o.geometry.attributes.position,normal=o.geometry.attributes.normal;assert.ok(position.count>0);assert.ok(normal);
      for(let j=0;j<position.count;j++){
        const v=new T.Vector3().fromBufferAttribute(position,j).applyMatrix4(o.matrixWorld);assert.ok([v.x,v.y,v.z].every(Number.isFinite),o.name);
        assert.ok([normal.getX(j),normal.getY(j),normal.getZ(j)].every(Number.isFinite),'finite normals');
        assert.ok(v.x>=b.minX-1e-5&&v.x<=b.maxX+1e-5&&v.z>=b.minZ-1e-5&&v.z<=b.maxZ+1e-5,`${it.id}/${o.name} outside footprint`);
        if(it.type==='water')near(v.y,.035);
      }
    });
    if(it.type==='mountain'){
      const g=group.children[0].geometry,pos=g.attributes.position,n=pos.count;let max=0;
      for(let j=0;j<n;j++)max=Math.max(max,pos.getY(j));near(max,it.height,1e-5);
      for(let j=n-88;j<n;j++)near(pos.getY(j),0);assert.ok(pos.getY(1)>pos.getY(n-89),'broad slopes taper down');
      const index=g.index.array;for(let j=0;j<index.length;j+=3){const a=new T.Vector3().fromBufferAttribute(pos,index[j]),b=new T.Vector3().fromBufferAttribute(pos,index[j+1]),c=new T.Vector3().fromBufferAttribute(pos,index[j+2]);assert.ok(b.sub(a).cross(c.sub(a)).y>0,'mountain triangles face up');}
    }
  }));dispose(layers);
});
test('tree roots match actual mountain mesh intersection and boats preserve placement',()=>{
  const m=item('mountain','m',.2,-.1,{rotation:24,scale:1.15,height:2.1}),t=item('tree','t',-.1,.12,{scale:.7}),b=item('boat','b',2,1,{rotation:29,scale:.8}),layers=create(plan([m,t,b]));
  layers.forEach(l=>l.updateMatrixWorld(true));const mountain=layers[0].children[0].children[0],tree=layers[1].children[0],boat=layers[2].children[0];
  const ray=new T.Raycaster(new T.Vector3(t.x,10,t.z),new T.Vector3(0,-1,0)),hits=ray.intersectObject(mountain);assert.ok(hits.length);near(tree.position.y,hits[0].point.y,1e-5);
  near(boat.position.x,b.x);near(boat.position.z,b.z);near(boat.position.y,.035);dispose(layers);
});
test('house gables meet the curved roof and hull geometry uses the printed leaf outline',()=>{
  const layers=create(plan([item('house','h',-2,0),item('boat','b',2,0)]));layers.forEach(l=>l.updateMatrixWorld(true));
  const house=layers[2].children[0],boat=layers[2].children[1];
  const ray=new T.Raycaster(new T.Vector3(-2,5,.27),new T.Vector3(0,-1,0));
  const plaster=ray.intersectObjects(house.children.filter(o=>o.material.userData.kind==='plaster'));
  const roof=ray.intersectObjects(house.children.filter(o=>o.name==='swept-eaves-roof'));
  assert.ok(plaster.length&&roof.length);assert.ok(Math.abs(roof[0].point.y-plaster[0].point.y)<.015,'no floating roof');
  const pos=boat.children.find(o=>o.name==='curved-open-hull').geometry.attributes.position;
  const expected=Array.from({length:64},(_,i)=>{const a=i*Math.PI/32,x=Math.cos(a);return [.59*x,.185*Math.sin(a)*Math.pow(Math.max(0,1-x*x),.2)];});
  for(let i=0;i<=32;i++)for(const j of [0,16]){
    const k=i*17+j;assert.ok(expected.some(p=>Math.hypot(p[0]-pos.getX(k),p[1]-pos.getZ(k))<1e-6),'same rim in 2D, rules and 3D');
  }
  dispose(layers);
});
test('fresh geometry per build, cached host material ownership, no fixed scenery',()=>{
  assert.ok(create(plan([])).every(l=>l.children.length===0));
  const a=create(A.samplePlan()),b=create(A.samplePlan()),ga=new Set(meshes(a).map(o=>o.geometry));
  assert.equal(ga.size,meshes(a).length);assert.ok(meshes(b).every(o=>!ga.has(o.geometry)));
  const hostMaterials=new Set(materials.values());assert.ok([...meshes(a),...meshes(b)].every(o=>hostMaterials.has(o.material)));
  let disposed=0;meshes(a).forEach(o=>o.geometry.addEventListener('dispose',()=>disposed++));dispose(a);assert.equal(disposed,ga.size);assert.equal(materialDisposals,0);dispose(b);assert.equal(materialDisposals,0);
  for(const kind of ['rock','water','leaf','wood','plaster','roof-tile'])assert.ok([...materials.values()].some(m=>m.userData.kind===kind),kind);
});
console.log(`creator-art: ${checks} targeted checks passed, ${failures} failed; sample layers ${A.validate(A.samplePlan()).layers.join('/')}; no files emitted.`);
