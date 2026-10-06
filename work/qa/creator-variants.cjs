'use strict';
// Node only. Reuse the existing THREE/canvas fixture, without running or editing
// the old suite's intentionally obsolete exact-key/type-count assertions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const fixture=fs.readFileSync(path.join(__dirname,'creator-art.cjs'),'utf8').split("test('exact public API")[0];
const realm={require,__dirname,console};
vm.runInNewContext(fixture+'\nglobalThis.fixture={A,T,item,plan,copy,world,create,dispose,meshes,near,materials,getDisposals:()=>materialDisposals};',realm);
const {A,T,item,plan,world,create,dispose,meshes,near,materials,getDisposals}=realm.fixture;
const copy=value=>JSON.parse(JSON.stringify(value));
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
function issues(items){return A.validate(plan(items));}
function isBad(items,pattern){const v=issues(items);assert.equal(v.ok,false,JSON.stringify(items));if(pattern)assert.ok(v.issues.some(i=>pattern.test(i.reason)),JSON.stringify(v));}
function water(width=.8){return item('water','water',0,0,{width,points:[{x:-2,z:0},{x:2,z:0}]});}
function allVertices(layers,fn){layers.forEach(l=>l.updateMatrixWorld(true));meshes(layers).forEach(m=>{const pos=m.geometry.attributes.position,n=m.geometry.attributes.normal;assert.ok(pos.count>0);for(let k=0;k<pos.count;k++){const p=new T.Vector3().fromBufferAttribute(pos,k).applyMatrix4(m.matrixWorld);assert.ok([p.x,p.y,p.z,n.getX(k),n.getY(k),n.getZ(k)].every(Number.isFinite),m.name);fn(p,m,k);}});}
function terrainMeshes(layers){return meshes(layers).filter(m=>m.userData.terrain);}
function floorAt(layers,x,z){const hits=new T.Raycaster(new T.Vector3(x,20,z),new T.Vector3(0,-1,0)).intersectObjects(terrainMeshes(layers));return hits.length?hits[0].point.y:0;}
function supportBottom(m){return new T.Vector3(0,-m.geometry.parameters.height/2,0).applyMatrix4(m.matrixWorld);}

check('public compatibility, fifteen variants, fallback and pure normalized old drafts',()=>{
  for(const k of ['normalize','defaults','drawLayers','createLayers','validate','bounds','hitTest','samplePlan','layerOf','drawOrder'])assert.equal(typeof A[k],'function',k);
  assert.equal(A.W,9.5);assert.equal(A.D,6.2);assert.equal(A.TYPES.length,8);
  assert.equal(Object.values(A.VARIANTS).reduce((n,v)=>n+v.length,0),15);
  for(const type of A.TYPES){for(const v of A.VARIANTS[type]){assert.ok(v.label&&v.note);assert.equal(A.defaults(type,'v',0,0,v.id).variant,v.id);assert.equal(A.normalize(plan([item(type,'v',0,0,{variant:v.id})])).items[0].variant,v.id);}
    assert.equal(A.defaults(type,'v',0,0,'unknown').variant,A.VARIANTS[type][0].id);
    const old=item(type,'old');delete old.variant;const before=JSON.stringify(old),n=A.normalize(plan([old]));assert.equal(n.items[0].variant,A.VARIANTS[type][0].id);assert.equal(JSON.stringify(old),before);assert.deepEqual(copy(A.normalize(n)),copy(n));
  }
  assert.equal(A.defaults('mountain').height,1.5);assert.equal(A.defaults('water').width,.55);
  const n=A.normalize(plan(Array.from({length:25},(_,i)=>item('tree','t'+i))));assert.equal(n.items.length,25);assert.equal(A.validate(n).ok,false);
  assert.equal(issues(Array.from({length:24},(_,i)=>item('tree','t'+i))).ok,true);
  assert.equal(issues([]).ok,false);
});

check('both distinct presets are valid and together demonstrate every variant',()=>{
  const river=A.samplePlan('river'),village=A.samplePlan('village');
  assert.equal(river.items.length,9);assert.notDeepEqual(copy(river),copy(village));
  for(const p of [river,village]){assert.ok(p.items.length<=24);const v=A.validate(p);assert.equal(v.ok,true,JSON.stringify(v));assert.ok(v.layers.every(n=>n>0));}
  const observed=new Set([...river.items,...village.items].map(i=>i.type+':'+i.variant));
  for(const [type,vs] of Object.entries(A.VARIANTS))for(const v of vs)assert.ok(observed.has(type+':'+v.id),type+':'+v.id);
  const legacy=copy(river);legacy.items.forEach(i=>delete i.variant);assert.equal(A.validate(legacy).ok,true);
  assert.deepEqual(copy(A.samplePlan()),copy(river));river.items[0].x=99;assert.notEqual(A.samplePlan().items[0].x,99);
});

check('layer and stable drawing/picking order are shared with geometry',()=>{
  const items=A.TYPES.map(t=>item(t,t));items.push(item('tree','last-tree',2,0));
  const ordered=A.drawOrder(plan(items)),before=JSON.stringify(items);
  for(let i=1;i<ordered.length;i++)assert.ok(A.ORDER[ordered[i].type]>=A.ORDER[ordered[i-1].type]);
  assert.deepEqual(copy(ordered.filter(i=>i.type==='tree').map(i=>i.id)),['tree','last-tree']);assert.equal(JSON.stringify(items),before);
  const layers=create(plan(items));layers.forEach((l,i)=>l.children.forEach(g=>assert.equal(A.layerOf(g.userData.type),i)));dispose(layers);
  assert.equal(A.layerOf('rock'),0);assert.equal(A.layerOf('reeds'),1);assert.equal(A.layerOf('lantern'),2);
});

check('all fifteen variants have finite 2D/3D geometry within the same rotated picking footprint',()=>{
  const fingerprints=new Map();
  for(const type of A.TYPES)for(const variant of A.VARIANTS[type]){
    for(const scale of [.55,1.6]){
      const i=item(type,type,.2,-.2,{variant:variant.id,rotation:37,scale}),p=plan([i]),b=A.bounds(i),layers=create(p),drawing=A.drawLayers(p,950,620);
      allVertices(layers,(v,m)=>{assert.ok(v.x>=b.minX-1e-5&&v.x<=b.maxX+1e-5&&v.z>=b.minZ-1e-5&&v.z<=b.maxZ+1e-5,`${type}/${variant.id}/${m.name}: outside bounds ${JSON.stringify(v)} ${JSON.stringify(b)}`);assert.equal(A.hitTest(i,v.x,v.z),true,`${type}/${variant.id}/${m.name}: vertex is unpickable`);if(type==='boat')assert.ok(v.y>=.014-1e-6);});
      assert.ok(drawing[A.layerOf(type)].ctx.calls.length>0);
      assert.ok(drawing.every(c=>c.ctx.calls.every(call=>call.points.every(q=>q.every(Number.isFinite)))));
      assert.equal(A.hitTest(i,30,30),false);assert.equal(A.hitTest(i,NaN,0),false);
      if(scale===.55){const key=type+':'+variant.id;fingerprints.set(key,JSON.stringify(meshes(layers).map(m=>[m.name,Array.from(m.geometry.attributes.position.array).slice(0,48)])));}
      dispose(layers);
    }
  }
  for(const type of ['mountain','tree','house','boat']){const list=A.VARIANTS[type].map(v=>fingerprints.get(type+':'+v.id));assert.equal(new Set(list).size,list.length,type+' is only a renamed shape');}
});

check('variants remain finite across permitted height limits and mountain elevations differ',()=>{
  const elevations=[];
  for(const type of A.TYPES)for(const v of A.VARIANTS[type])for(const height of [type==='mountain'?.6:.1,2.6]){
    const layers=create(plan([item(type,'v',0,0,{variant:v.id,height,scale:1.6})]));let top=0;
    allVertices(layers,p=>{top=Math.max(top,p.y);if(type==='boat')assert.ok(p.y>=.014-1e-6);});
    if(type==='mountain'&&height===2.6)elevations.push(top);dispose(layers);
  }
  assert.ok(elevations[0]>elevations[1]&&elevations[1]>elevations[2]);
});

check('complete roofs, branches, canopies, rocks, reeds and lanterns enforce clear space',()=>{
  for(const v of A.VARIANTS.house){
    const h=item('house','house',0,0,{variant:v.id}),b=A.bounds(h);
    isBad([h,item('mountain','m')],/山体/);isBad([h,water()],/水道/);
    isBad([h,item('rock','r',b.maxX+.15,0)],/间距/);
    isBad([h,item('reeds','r',0,0)],/间距/);isBad([h,item('lantern','l',0,0)],/间距/);
    isBad([h,item('house','other',.7,0,{rotation:45})],/间距/);
    for(const t of A.VARIANTS.tree)isBad([h,item('tree','t',0,0,{variant:t.id})],/间距/);
  }
  // The trunk is clear, but the bent tree crown reaches the cottage's eave.
  isBad([item('tree','t',-.95,0,{variant:'bent'}),item('house','h')],/间距/);
  isBad([water(),item('boat','a',-.1,0),item('boat','b',.3,0,{variant:'canopy'})],/舟之间/);
  isBad([item('lantern','l'),item('mountain','m')],/平地/);
  isBad([item('rock','r'),water()],/岸上/);
  assert.equal(issues([water(),item('reeds','r',0,.52)]).ok,true,'reeds may overhang water when roots are on shore');
  isBad([water(),item('reeds','r',0,.30)],/苇根/);
});

check('whole hulls, interior gaps, borders, river folds and terrain/water conflicts are rejected',()=>{
  for(const v of A.VARIANTS.boat){const b=item('boat','b',0,0,{variant:v.id});assert.equal(issues([b,water()]).ok,true);isBad([b]);isBad([b,water(.25)]);isBad([{...b,z:.31},water()]);
    const ends=[item('water','left',-.65,0,{width:.4,points:[{x:-.4,z:0},{x:.1,z:0}]}),item('water','right',.65,0,{width:.4,points:[{x:-.1,z:0},{x:.4,z:0}]})];isBad([b,...ends]);}
  isBad([water(),item('mountain','m')],/山体|河岸/);
  isBad([water(),{...water(),id:'second',rotation:90}],/水道/);
  isBad([item('water','fold',0,0,{points:[{x:-2,z:0},{x:2,z:0},{x:-2,z:0}]})],/折返/);
  isBad([item('water','zero',0,0,{points:[{x:0,z:0},{x:0,z:0}]})],/过短/);
  for(const type of A.TYPES){const i=item(type,type),b=A.bounds(i);i.x=A.W/2-.3-b.maxX+.001;isBad([i],/越界/);}
});

check('mountain merging creates one manifold upward surface and exact terrain roots',()=>{
  const m=item('mountain','m',-.3,0,{rotation:18,height:1.7}),m2=item('mountain','n',.75,-.1,{variant:'ridge',rotation:-9});
  for(const variant of A.VARIANTS.tree){const t=item('tree','t',.05,.1,{variant:variant.id,scale:.65}),layers=create(plan([m,m2,t]));layers.forEach(l=>l.updateMatrixWorld(true));
    const terrain=terrainMeshes(layers);assert.equal(terrain.length,1);assert.equal(layers[0].children[0].userData.merged,true);assert.equal(layers[0].children[0].userData.itemIds.length,2);
    const tree=layers[1].children[0];near(tree.position.y,floorAt(layers,t.x,t.z),1e-5);
    const g=terrain[0].geometry,pos=g.attributes.position,idx=g.index.array,edges=new Map();assert.ok(pos.count<idx.length/2);
    for(let k=0;k<idx.length;k+=3){const face=[idx[k],idx[k+1],idx[k+2]],v=face.map(j=>new T.Vector3().fromBufferAttribute(pos,j));assert.ok(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).y>0);
      for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');edges.set(key,(edges.get(key)||0)+1);}}
    for(const [key,count]of edges){assert.ok(count<=2);if(count===1)for(const k of key.split(',').map(Number))near(pos.getY(k),0,1e-5);}
    dispose(layers);
  }
  for(const variant of A.VARIANTS.mountain){const layers=create(plan([{...m,variant:variant.id},item('tree','t',-.4,.05)]));layers.forEach(l=>l.updateMatrixWorld(true));near(layers[1].children[0].position.y,floorAt(layers,-.4,.05),1e-5);dispose(layers);}
});

check('stone bases, bamboo roots and reed stems conform to the actual terrain triangles',()=>{
  const m=item('mountain','m',0,0,{variant:'hill'});
  for(const type of ['rock','reeds','tree']){
    const i=item(type,'v',.1,.1,{variant:type==='tree'?'bamboo':type,scale:.7}),layers=create(plan([m,i]));layers.forEach(l=>l.updateMatrixWorld(true));
    const group=layers[A.layerOf(type)].children.find(g=>g.userData.itemId==='v');
    if(type==='rock'){const mesh=group.children[0],pos=mesh.geometry.attributes.position;for(let k=0;k<8;k++){const q=new T.Vector3().fromBufferAttribute(pos,k).applyMatrix4(mesh.matrixWorld);near(q.y,floorAt(layers,q.x,q.z),1e-5);}}
    else{const rods=group.children.filter(m=>m.name==='branch-or-rail');const roots=type==='tree'?rods.slice(0,3):rods.filter((_,i)=>i%2===0);for(const stem of roots){const p=supportBottom(stem);near(p.y,floorAt(layers,p.x,p.z),1e-5);}}
    dispose(layers);
  }
});

check('roof/stem supports meet visible roofs; canopy covers its posts',()=>{
  const p=plan([item('house','p',-2,0,{variant:'pavilion'}),item('boat','b',0,0,{variant:'canopy'}),item('lantern','l',2,0)]),layers=create(p);layers.forEach(l=>l.updateMatrixWorld(true));
  const groups=layers[2].children;
  for(const id of ['p','b']){const group=groups.find(g=>g.userData.itemId===id),roof=group.children.filter(m=>/pavilion-roof|woven-canopy/.test(m.name));
    const supports=group.children.filter(m=>m.name===(id==='p'?'branch-or-rail':'canopy-post'));
    assert.ok(supports.length>=4);
    for(const m of supports){const q=new T.Vector3(0,m.geometry.parameters.height/2,0).applyMatrix4(m.matrixWorld);const hit=new T.Raycaster(new T.Vector3(q.x,10,q.z),new T.Vector3(0,-1,0)).intersectObjects(roof);assert.ok(hit.length,id+' missing roof over post');assert.ok(Math.abs(hit[0].point.y-q.y)<.01,id+' floating roof');}
  }
  const lamp=groups.find(g=>g.userData.itemId==='l');const names=['lantern-base','lantern-stem','lantern-sill','lantern-frame'];let top=0;
  for(const name of names){const box=new T.Box3().setFromObject(lamp.children.find(m=>m.name===name));assert.ok(box.min.y<=top+.002,name+' floats');top=box.max.y;}
  dispose(layers);
});

check('canvas reuse is optional, transparent by reset, deterministic, and reduced detail is cheaper',()=>{
  const p=A.samplePlan(),before=JSON.stringify(p),a=A.drawLayers(p,950,620),b=A.drawLayers(p,950,620);
  assert.equal(JSON.stringify(a.map(c=>c.ctx.calls)),JSON.stringify(b.map(c=>c.ctx.calls)));assert.equal(JSON.stringify(p),before);
  const reused=A.drawLayers(p,640,420,{canvases:a,dragging:true});reused.forEach((c,i)=>{assert.equal(c,a[i]);assert.equal(c.width,640);assert.equal(c.height,420);});
  const low=A.drawLayers(p,950,620,{lowDetail:true});assert.ok(low.reduce((n,c)=>n+c.ctx.calls.length,0)<b.reduce((n,c)=>n+c.ctx.calls.length,0));
  assert.ok(A.drawLayers(plan([]),950,620).every(c=>c.ctx.calls.length===0));
});

check('fresh owned geometry and shared untouched host materials survive rebuild/dispose',()=>{
  assert.ok(create(plan([])).every(l=>l.children.length===0));const before=getDisposals(),a=create(A.samplePlan('village')),b=create(A.samplePlan('village')),set=new Set(meshes(a).map(m=>m.geometry));
  assert.equal(set.size,meshes(a).length);assert.ok(meshes(b).every(m=>!set.has(m.geometry)));const owned=new Set(materials.values());assert.ok([...meshes(a),...meshes(b)].every(m=>owned.has(m.material)));
  dispose(a);dispose(b);assert.equal(getDisposals(),before);
});

check('validation remains bounded for moving presets, cached repeats and 24 objects',()=>{
  const medians=[];
  for(const name of ['river','village']){const p=A.samplePlan(name);A.validate(p);const times=[];for(let n=0;n<40;n++){p.items.find(i=>i.type==='boat').x+=.0001;const start=performance.now();assert.equal(A.validate(p).ok,true);times.push(performance.now()-start);}times.sort((a,b)=>a-b);medians.push(name+': '+times[20].toFixed(2)+'ms median, '+times[38].toFixed(2)+'ms p95');assert.ok(times[20]<8,name+' median exceeds input-frame budget');
    const start=performance.now();for(let i=0;i<50;i++)A.validate(p);assert.ok((performance.now()-start)/50<2);}
  const crowded=plan(Array.from({length:24},(_,i)=>item('tree','tree'+i,(i%6-2.5)*1.2,(Math.floor(i/6)-1.5)*1.1)));const start=performance.now();assert.equal(A.validate(crowded).ok,true);assert.ok(performance.now()-start<100);
  console.log('TIMING '+medians.join('; '));
});
console.log(`creator-variants: ${passed} focused checks passed; no files emitted.`);
