'use strict';
// Exercises the real editor's event handlers with a bounded DOM/storage stand-in.
// These checks cover transaction behavior; they are not browser/rendering tests.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../outputs/YinShanHe');
const realm={console};vm.createContext(realm);vm.runInContext(fs.readFileSync(path.join(root,'creator-art.js'),'utf8'),realm);
const A=realm.YSHCreatorArt,source=fs.readFileSync(path.join(root,'creator.js'),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
const piece=(type,id,x=0,z=0,variant)=>A.defaults(type,id,x,z,variant);
function editor(initial){
 const nodes=new Map(),docListeners={};let saved=JSON.stringify(initial),submitted=null,frames=0;
 class Element{
  constructor(){this.children=[];this.listeners={};this.dataset={};this.style={};this.classList={add(){},remove(){},toggle(){}};this.textContent='';}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,event){event.type=type;for(const fn of this.listeners[type]||[])fn(event);}
  setAttribute(){} appendChild(n){this.children.push(n);n.parentElement=this;if(n.id)nodes.set(n.id,n);} querySelectorAll(){return [];}
  getContext(){return {};} focus(){} setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:1024,height:672};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const document={createElement:()=>new Element(),getElementById:get,activeElement:null,addEventListener:(t,f)=>docListeners[t]=f,body:new Element()};
 const window={YSHCreatorArt:A};
 vm.runInNewContext(source,{window,document,console,localStorage:{getItem:()=>saved,setItem:(_,s)=>saved=s},requestAnimationFrame:()=>{frames++;return frames;}});
 const api=window.YSHCreator.create({pause(){},print(p){submitted=p;},preview(p){submitted=p;}});api.open();
 const click=(id,dataset={})=>{const b={id,dataset};get('creator-editor').fire('click',{target:{closest:()=>b}});};
 const point=(type,x,z)=>get('create-canvas').fire(type,{button:0,pointerId:1,clientX:(x/A.W+.5)*1024,clientY:(z/A.D+.5)*672});
 const key=(key,extra={})=>docListeners.keydown({key,target:{tagName:'CANVAS'},preventDefault(){},...extra});
 return {get,api,click,point,key,saved:()=>JSON.parse(saved),submitted:()=>submitted,frames:()=>frames};
}
let total=0;const check=(name,run)=>{run();total++;console.log('PASS '+name);};
check('old drafts keep all items, names and editable defaults',()=>{
 const p={title:'旧作品',items:[{id:'m',type:'mountain',x:0,z:0,scale:.8,height:1.5}]},ui=editor(p);
 assert.equal(ui.api.getState().itemCount,1);assert.equal(ui.get('create-title').value,'旧作品');
 ui.point('pointerdown',0,0);ui.point('pointerup',0,0);ui.click('create-cycle');assert.equal(ui.saved().items[0].variant,'ridge');
});
check('selected style is placed, saved and undoable',()=>{
 const ui=editor({items:[]});ui.click('',{type:'mountain'});ui.click('',{placeStyle:'hill'});ui.point('pointerdown',0,0);
 assert.equal(ui.saved().items[0].variant,'hill');assert.equal(ui.api.getState().itemCount,1);
 ui.click('create-undo');assert.equal(ui.api.getState().itemCount,0);ui.click('create-redo');assert.equal(ui.saved().items[0].variant,'hill');
});
check('invalid new boat does not enter draft or consume undo, placement remains active',()=>{
 const ui=editor({items:[]});ui.click('',{type:'boat'});ui.point('pointerdown',0,0);
 assert.equal(ui.api.getState().itemCount,0);assert.equal(ui.api.getState().placing,'boat');assert.equal(ui.get('create-undo').disabled,true);
 assert.match(ui.get('create-feedback').textContent,/水/);
});
check('dragging house into mountain rolls back position and does not save invalid state',()=>{
 const p={items:[piece('mountain','m',-2,-1),piece('house','h',2,1)]};assert.ok(A.validate(p).ok);
 const ui=editor(p);ui.point('pointerdown',2,1);ui.point('pointermove',-2,-1);ui.point('pointerup',-2,-1);
 assert.equal(ui.saved().items.find(i=>i.id==='h').x,2);assert.ok(ui.api.getState().valid);assert.match(ui.get('create-feedback').textContent,/保留/);
});
check('swap and cycle preserve transforms; undo restores original shape',()=>{
 const m=piece('mountain','m');Object.assign(m,{scale:.7,height:1.7,rotation:21});const ui=editor({items:[m]});
 ui.point('pointerdown',0,0);ui.point('pointerup',0,0);ui.click('',{swapStyle:'ridge'});
 const after=ui.saved().items[0];for(const key of ['x','z','height','scale','rotation'])assert.equal(after[key],m[key]);assert.equal(after.variant,'ridge');
 ui.click('create-undo');assert.equal(ui.saved().items[0].variant,'peak');
});
check('copy is picked up and placed explicitly, preserving its style and size',()=>{
 const h=piece('house','h',-2,0,'pavilion');h.scale=.65;const ui=editor({items:[h]});
 ui.point('pointerdown',-2,0);ui.point('pointerup',-2,0);ui.click('create-copy');assert.equal(ui.api.getState().itemCount,1);
 ui.point('pointerdown',2,0);assert.equal(ui.api.getState().itemCount,2);const copy=ui.saved().items[1];assert.equal(copy.variant,'pavilion');assert.equal(copy.scale,.65);assert.notEqual(copy.id,h.id);
});
check('pointer cancellation restores geometry without persisting partial move',()=>{
 const ui=editor({items:[piece('mountain','m')]});ui.point('pointerdown',0,0);ui.point('pointermove',1,0);ui.point('pointercancel',1,0);
 ui.click('create-preview');assert.equal(ui.submitted().items[0].x,0);
});
check('invalid slider growth returns thumb and shape to prior size',()=>{
 const m=piece('mountain','m',3,0);m.scale=.6;assert.ok(A.validate({items:[m]}).ok);const ui=editor({items:[m]});
 ui.point('pointerdown',3,0);ui.point('pointerup',3,0);
 const input={dataset:{prop:'scale'},value:'1.6'};ui.get('creator-editor').fire('input',{target:input});ui.get('creator-editor').fire('change',{target:input});
 ui.click('create-preview');assert.equal(ui.submitted().items[0].scale,.6);assert.match(ui.get('create-selection').innerHTML,/value="0.6"/);
});
check('keyboard nudges respect wood mirroring and undo',()=>{
 const ui=editor({items:[piece('mountain','m')]});ui.point('pointerdown',0,0);ui.point('pointerup',0,0);ui.click('create-view-wood');
 ui.key('ArrowRight');assert.equal(ui.saved().items[0].x,-.04);ui.key('z',{ctrlKey:true});assert.equal(ui.saved().items[0].x,0);
});
check('undo during an unfinished drag does not commit the partial position',()=>{
 const ui=editor({items:[]});ui.click('',{type:'mountain'});ui.point('pointerdown',0,0);
 ui.point('pointerdown',0,0);ui.point('pointermove',1,0);ui.key('z',{ctrlKey:true});ui.point('pointerup',1,0);
 assert.equal(ui.api.getState().itemCount,0);ui.click('create-redo');assert.equal(ui.saved().items[0].x,0);
});
check('both presets can be submitted to preview and original print host',()=>{
 const ui=editor({items:[]});ui.click('create-village');ui.click('create-preview');assert.ok(A.validate(ui.submitted()).ok);const village=ui.submitted().title;
 ui.api.open();ui.click('create-sample');ui.click('create-print');assert.ok(A.validate(ui.submitted()).ok);assert.notEqual(ui.submitted().title,village);
});
console.log(total+' editor transaction checks passed.');
