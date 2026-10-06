'use strict';
// Independent bounded review: six checks, real production handlers/API and vendored THREE.
// DOM events/storage and studio Canvas reads are stand-ins; no browser/GPU visual claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../outputs/YinShanHe');
const sources=Object.fromEntries(['creator.js','creator-art.js','creator-studio.js','ink-landscape.js'].map(n=>[n,fs.readFileSync(path.join(root,n),'utf8')]));
const realm={console};vm.createContext(realm);vm.runInContext(sources['creator-art.js'],realm);const A=realm.YSHCreatorArt;
const T=require(path.join(root,'vendor/three.min.js'));
const piece=(type,id,x=0,z=0,variant)=>A.defaults(type,id,x,z,variant);
const plain=v=>JSON.parse(JSON.stringify(v));
function editor(initial,{search='',storage}={}){
 const nodes=new Map(),listeners={};let submitted;
 storage??=new Map([['yinshanhe.creator.v1',JSON.stringify(initial)]]);
 class Element{
  constructor(){this.children=[];this.listeners={};this.dataset={};this.style={};this.classList={add(){},remove(){},toggle(){}};this.textContent='';}
  addEventListener(t,f){(this.listeners[t]??=[]).push(f);} fire(t,e){e.type=t;for(const f of this.listeners[t]||[])f(e);}
  setAttribute(){} appendChild(n){this.children.push(n);n.parentElement=this;if(n.id)nodes.set(n.id,n);} querySelectorAll(){return [];}
  getContext(){return {};} focus(){} setPointerCapture(){} getBoundingClientRect(){return {left:0,top:0,width:1024,height:672};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const document={createElement:()=>new Element(),getElementById:get,activeElement:null,addEventListener:(t,f)=>listeners[t]=f,body:new Element()};
 const window={YSHCreatorArt:A};
 vm.runInNewContext(sources['creator.js'],{window,document,console,location:{search},URLSearchParams,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:()=>1});
 const api=window.YSHCreator.create({pause(){},print(p){submitted=p;},preview(p){submitted=p;}});api.open();
 const click=(id,dataset={})=>get('creator-editor').fire('click',{target:{closest:()=>({id,dataset})}});
 const point=(type,x,z)=>get('create-canvas').fire(type,{button:0,pointerId:1,clientX:(x/A.W+.5)*1024,clientY:(z/A.D+.5)*672});
 const key=(key,extra={})=>listeners.keydown({key,target:{tagName:'CANVAS'},preventDefault(){},...extra});
 return {get,api,click,point,key,storage,saved:(k='yinshanhe.creator.v1')=>JSON.parse(storage.get(k)),submitted:()=>submitted};
}
let failures=0,count=0,executed=0;const only=new Set(process.argv.slice(2).map(Number));
function check(name,fn){count++;if(only.size&&!only.has(count))return;executed++;try{const details=fn();console.log('PASS '+count+' '+name+(details?' | '+details:''));}catch(e){failures++;console.log('FAIL '+count+' '+name+' | '+e.message);}}

check('undo during active drag must preserve redo after pointer release',()=>{
 const ui=editor({items:[piece('mountain','m')]});
 ui.point('pointerdown',0,0);ui.point('pointerup',0,0);ui.key('ArrowRight');
 assert.equal(ui.saved().items[0].x,.04);
 ui.point('pointerdown',.04,0);ui.point('pointermove',1.04,0);ui.key('z',{ctrlKey:true});
 assert.equal(ui.saved().items[0].x,0);
 ui.point('pointerup',1.04,0);
 const evidence={savedX:ui.saved().items[0].x,redoDisabled:ui.get('create-redo').disabled,undoDisabled:ui.get('create-undo').disabled};
 ui.key('z',{ctrlKey:true,shiftKey:true});evidence.afterRedoX=ui.saved().items[0].x;
 assert.notEqual(evidence.afterRedoX,0,JSON.stringify(evidence));
});

check('cancel after keyboard nudge inside invalid drag must not save invalid intermediate plan',()=>{
 const initial={items:[piece('mountain','m',-2,-1),piece('house','h',2,1)]};assert.ok(A.validate(initial).ok);
 const ui=editor(initial);ui.point('pointerdown',2,1);ui.point('pointermove',-2,-1);assert.equal(ui.api.getState().valid,false);
 ui.key('ArrowRight');ui.point('pointercancel',-2,-1);
 assert.equal(ui.api.getState().valid,true);
 const saved=ui.saved(),reloaded=editor(null,{storage:ui.storage});
 const evidence={inMemoryValid:ui.api.getState().valid,savedHouseX:saved.items.find(i=>i.id==='h').x,reloadedValid:reloaded.api.getState().valid};
 assert.equal(reloaded.api.getState().valid,true,JSON.stringify(evidence));
});

check('normalization and tryout storage survive commit, undo and reload without changing original',()=>{
 const raw={title:'旧作',items:[{id:'same',type:'tree',variant:'missing',x:-2,z:0,scale:.1,height:1e40},{id:'same',type:'house',x:2,z:0,rotation:540}],palette:['#abc','bad','#123456']};
 const storage=new Map([['yinshanhe.creator.v1',JSON.stringify(raw)]]),original=storage.get('yinshanhe.creator.v1');
 const ui=editor(raw,{search:'?tryout=1',storage});assert.equal(ui.api.getState().itemCount,0);
 ui.click('create-village');assert.ok(ui.saved('yinshanhe.creator.v1.tryout').items.length);ui.click('create-undo');assert.equal(ui.saved('yinshanhe.creator.v1.tryout').items.length,0);
 assert.equal(storage.get('yinshanhe.creator.v1'),original);
 const originalUI=editor(null,{storage});originalUI.click('create-preview');const norm=originalUI.submitted();
 assert.ok(norm);assert.equal(norm.items[0].variant,'pine');assert.equal(norm.items[0].height,2.6);assert.notEqual(norm.items[0].id,norm.items[1].id);
 assert.deepEqual(plain(A.normalize(norm)),plain(norm));assert.deepEqual(plain(originalUI.saved()),plain(norm));
 return 'tryout independent; duplicate IDs and legacy transforms normalized idempotently';
});

check('full THREE geometry of all 15 variants stays inside public footprint bounds',()=>{
 const shared=new T.MeshBasicMaterial(),v=new T.Vector3();let shapes=0,vertices=0;
 for(const type of A.TYPES)for(const variant of A.VARIANTS[type])for(const rotation of [0,37,89,143])for(const size of [.55,1.6]){
  const q=piece(type,'q',.13,-.17,variant.id);Object.assign(q,{rotation,scale:size,height:size===.55?.1:2.6});
  const b=A.bounds(q),layers=A.createLayers(T,{items:[q]},{material:()=>shared});shapes++;
  for(const g of layers){g.updateMatrixWorld(true);g.traverse(o=>{if(!o.geometry)return;const pos=o.geometry.attributes.position;
   for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);vertices++;assert.ok([v.x,v.y,v.z].every(Number.isFinite));
    assert.ok(v.x>=b.minX-2e-6&&v.x<=b.maxX+2e-6&&v.z>=b.minZ-2e-6&&v.z<=b.maxZ+2e-6,JSON.stringify({type,variant:variant.id,rotation,size,mesh:o.name,vertex:v.toArray(),bounds:b}));}
   o.geometry.dispose();});}
 }
 shared.dispose();return shapes+' generated items, '+vertices+' transformed vertices';
});

check('variant growth and water move rollback preserve dependencies and history',()=>{
 const hill=piece('mountain','m',3.25,0,'hill');hill.scale=.8;assert.ok(A.validate({items:[hill]}).ok);
 const ui=editor({items:[hill]});ui.point('pointerdown',3.25,0);ui.point('pointerup',3.25,0);ui.click('',{swapStyle:'ridge'});
 ui.click('create-preview');assert.equal(ui.submitted().items[0].variant,'hill');assert.equal(ui.get('create-undo').disabled,true);
 const w=piece('water','w');w.width=1.1;w.points=[{x:-2,z:0},{x:2,z:0}];const b=piece('boat','b');b.scale=.65;
 assert.ok(A.validate({items:[w,b]}).ok);const waterUI=editor({items:[w,b]});
 waterUI.point('pointerdown',-1.3,0);waterUI.point('pointermove',-1.3,1.3);waterUI.point('pointerup',-1.3,1.3);
 waterUI.click('create-preview');assert.equal(waterUI.submitted().items.find(i=>i.id==='w').z,0);assert.equal(waterUI.get('create-undo').disabled,true);
 return 'rejected larger footprint and stranded boat restore complete prior composition';
});

check('studio reinstalls dispose detached geometry once and keep cached shared materials alive',()=>{
 const ink=sources['ink-landscape.js'];
 const makeMaterial=new Function('T','window',ink.slice(ink.indexOf('  const uniforms=[]'),ink.indexOf('  const site='))+'\nreturn {material,materials};');
 const factory=makeMaterial(T,{}),paperMaterial=new T.MeshBasicMaterial();let materialDisposals=0;
 const material=(...args)=>{const m=factory.material(...args);if(!m.userData.reviewObserved){m.userData.reviewObserved=true;m.addEventListener('dispose',()=>materialDisposals++);}return m;};
 const noop=()=>{},ctx={clearRect:noop,drawImage:noop,getImageData:()=>({data:new Uint8Array(24*24*4)})};
 const block=()=>{const g=new T.PlaneGeometry(1,1);return {children:[{}, {geometry:g}]};};
 const state={T,window:{YSHCreatorArt:{...A,drawLayers:()=>[{}, {}, {}]}},customPlan:null,activePrintLayers:[],CW:24,CH:24,PW:A.W,PD:A.D,
  inks:[0,1,2].map(()=>({getContext:()=>ctx})),inkTargets:[[],[],[]],blocks:[block(),block(),block()],updateBlock:noop,
  groups:[new T.Group(),new T.Group(),new T.Group()],landscape:new T.Group(),galleryModel:new T.Group(),customGeometry:new Set(),inkWorld:{material},creatorPaperMaterial:paperMaterial,
  rebuildGalleryBounds:noop,galleryFrame:null,document:{querySelector:()=>({})}};
 vm.createContext(state);const studio=sources['creator-studio.js'];vm.runInContext(studio.slice(studio.indexOf('function installComposition('),studio.indexOf('creator=window.YSHCreator.create')),state);
 state.installComposition(A.samplePlan('village'));const first=[...state.customGeometry],counts=new Map();for(const g of first)g.addEventListener('dispose',()=>counts.set(g,(counts.get(g)||0)+1));
 const initialMaterialCount=factory.materials.size;state.installComposition(A.samplePlan('village'));
 assert.equal(factory.materials.size,initialMaterialCount);assert.equal(materialDisposals,0);for(const g of first)assert.equal(counts.get(g),1);
 assert.ok(first.every(g=>!state.customGeometry.has(g)));assert.equal(state.galleryModel.children.length,4);assert.equal(state.landscape.children.length,3);
 return first.length+' old geometries released exactly once; '+initialMaterialCount+' cached materials reused';
});

for(const name of ['creator.js','creator-art.js','creator-studio.js'])console.log('SOURCE '+name+' sha256='+crypto.createHash('sha256').update(sources[name]).digest('hex')+' mtimeUTC='+fs.statSync(path.join(root,name)).mtime.toISOString());
console.log('RESULT '+executed+' focused checks; '+failures+' failed');process.exitCode=failures?1:0;
