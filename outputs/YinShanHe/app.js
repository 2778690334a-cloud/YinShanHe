/* 一印山河 — original procedural art and interaction, no remote assets. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
function fail(msg){$('error-detail').textContent=msg;$('error').hidden=false;}
if(!window.THREE){fail('未找到随附的三维运行库。请完整解压文件夹，保留 vendor 目录。');return;}
if(!window.YSHSite?.create||!window.YSHInk?.create||!window.YSHArchitecture?.createTemple){fail('未找到青绿场景模块。请完整解压文件夹。');return;}
if(!window.YSHCraft?.createBrush||!window.YSHCraft?.createCarvingTools){fail('未找到随附的器物模型。请完整解压文件夹，保留 craft-tools.js。');return;}
const T=window.THREE, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(e){fail('浏览器无法创建WebGL场景。请在Chrome或Edge中开启硬件加速后重新打开。');return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;$('scene').appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#16251f');scene.fog=new T.FogExp2('#23362c',.017);
const camera=new T.PerspectiveCamera(38,1,.1,120);camera.position.set(14,11,15);
const look=new T.Vector3(0,.5,0), lookTarget=new T.Vector3(0,.5,0), cameraTarget=new T.Vector3(14,11,15);
scene.add(new T.HemisphereLight('#d5e1c9','#263324',2.05));
const sun=new T.DirectionalLight('#f9e7ba',3.3);sun.position.set(-7,13,-5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.normalBias=.045;sun.shadow.bias=-.00015;scene.add(sun);
const warm=new T.PointLight('#ffb354',45,22,2);warm.position.set(6,4,-4);scene.add(warm);
let seed=67293;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const mat=(color,roughness=.9,extras={})=>new T.MeshStandardMaterial({color,roughness,...extras});
const wood=mat('#543d29'),woodDark=mat('#302a1d'),woodEdge=mat('#806241'),ivory=mat('#dbcda8'),black=mat('#252d22'),jade=mat('#557e64'),vermilion=mat('#964330'),gold=mat('#ac9566');
function box(w,h,d,m,x=0,y=0,z=0,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(r1,r2,h,m,x,y,z,parent=scene,segments=24){const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,segments),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;}
const woodTex=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#695035';c.fillRect(0,0,w,h);for(let i=0;i<1800;i++){const y=rand()*h;c.strokeStyle=rand()>.5?'rgba(12,15,7,.055)':'rgba(218,186,119,.06)';c.lineWidth=.2+rand()*1.1;c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=30)c.lineTo(x,y+Math.sin(x*.02+i)*rand()*3);c.stroke();}});woodTex.wrapS=woodTex.wrapT=T.RepeatWrapping;woodTex.repeat.set(1,2);
const tablemat=mat('#b4a282',.8,{map:woodTex});
// A timber printing studio, assembled from original primitives.
for(let i=-12;i<=12;i++)box(1.02,.15,35,i%3?woodDark:wood,-i*1.06,-2.5,0);
box(36,16,.3,woodDark,0,4.7,-10);
for(let x=-16;x<17;x+=4){box(.32,13,.36,wood,x,3.8,-9.6);box(4,.22,.25,wood,x+2,7,-9.5);}
const windowMat=new T.MeshBasicMaterial({color:'#829a80'});
for(let j=0;j<3;j++){
  const xx=-10+j*4.3;box(3.75,6,.08,windowMat,xx,3.5,-9.4);
  for(let a=-2;a<=2;a++)box(.055,6,.12,woodDark,xx+a*.68,3.5,-9.3);
  for(let a=-3;a<=3;a++)box(3.75,.055,.12,woodDark,xx,3.5+a*.78,-9.29);
}
// Quiet rain strokes beyond the windows.
const rv=[];for(let i=0;i<180;i++){const x=-12+rand()*12,y=rand()*9;rv.push(x,y,-9.32,x-.08,y-.3,-9.32);}
const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rv,3));scene.add(new T.LineSegments(rg,new T.LineBasicMaterial({color:'#b9cbb4',transparent:true,opacity:.28})));
// A real opening between the split tabletop sections, with a dark paper trough below.
box(16,.6,8.4,tablemat,0,-.37,1.05);box(16,.6,1.45,tablemat,0,-.37,-4.525);
box(2.8,.6,.65,tablemat,-6.6,-.37,-3.475);box(2.8,.6,.65,tablemat,6.6,-.37,-3.475);
box(10.4,.12,.7,woodDark,0,-1.12,-3.475);
box(16.3,.15,1.45,woodEdge,0,-.7,-4.525);box(16.3,.15,8.4,woodEdge,0,-.7,1.05);for(const x of [-6.8,6.8])for(const z of [-4.2,4.2])box(.6,2,.6,woodDark,x,-1.6,z);
// Shelves in the rear, folded paper and printing blocks.
for(let y=.3;y<6;y+=1.6){box(6,.17,1.3,wood,7.6,y,-9);for(let j=0;j<4;j++){const h=.22+rand()*.45;box(.9,h,.85,j%2?ivory:woodEdge,5.4+j*1.25,y+h/2+.1,-9);}}
box(.24,7,1.4,wood,4.55,2.3,-9);box(.24,7,1.4,wood,10.65,2.3,-9);
// Brush rests, ink dishes and carved tools; geometry is based on documented objects.
cylinder(.68,.52,.2,black,-6.25,.06,-1.7);cylinder(.55,.55,.01,mat('#142b23',.18),-6.25,.168,-1.7);
cylinder(.47,.33,.14,ivory,-6.5,.04,-.15);cylinder(.38,.38,.01,mat('#647c62',.3),-6.5,.12,-.15);
box(2.3,.1,1.8,woodDark,-6.1,0,1.65);
const inkingBrush=window.YSHCraft.createBrush(T,'inking'),rubbingBrush=window.YSHCraft.createBrush(T,'rubbing');
scene.add(inkingBrush,rubbingBrush);inkingBrush.position.set(-6.5,.08,1.22);rubbingBrush.position.set(-5.7,.08,2.02);
const carvingTools=window.YSHCraft.createCarvingTools(T);scene.add(carvingTools);carvingTools.position.set(-6.5,.01,3.8);carvingTools.rotation.y=Math.PI/2;carvingTools.scale.setScalar(.82);
// A fixed wooden clamp holds the rear paper edge while each block moves beneath it.
box(10.25,.13,.38,woodEdge,0,.45,-3.13);
for(const x of [-5.05,5.05]){box(.35,.55,.55,wood,x,.18,-3.12);cylinder(.065,.065,.65,black,x,.55,-3.12);box(.42,.10,.13,woodDark,x,.9,-3.12);}
for(const x of [-5.3,5.3])box(.20,.28,6.4,woodEdge,x,.06,.15);
// Paper held below the printing surface can pass through the table slot.
for(let i=0;i<4;i++){const sheet=box(9.45,.009,1.2,ivory,0,-.47+i*.013,-3.49);sheet.rotation.x=Math.PI/2;}
// Warm paper lantern with timber rims.
const lanternGroup=new T.Group();scene.add(lanternGroup);lanternGroup.position.set(6.6,4.2,-4.9);
cylinder(.65,.52,1.25,mat('#eec982',.8,{emissive:'#b97928',emissiveIntensity:.6}),0,0,0,lanternGroup);
cylinder(.66,.66,.1,woodDark,0,.64,0,lanternGroup);cylinder(.55,.55,.1,woodDark,0,-.65,0,lanternGroup);cylinder(.022,.022,4,woodDark,0,2.7,0,lanternGroup);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(.027,1.24,.027,woodEdge,Math.cos(a)*.58,0,Math.sin(a)*.58,lanternGroup);}

const PW=9.5,PD=6.2,PY=.32,CW=1024,CH=672;
const root=new T.Group();scene.add(root);root.position.y=PY;

const printCanvas=document.createElement('canvas');printCanvas.width=CW;printCanvas.height=CH;const pc=printCanvas.getContext('2d');
const paperTex=new T.CanvasTexture(printCanvas);paperTex.colorSpace=T.SRGBColorSpace;paperTex.anisotropy=8;
const paperGeometry=new T.PlaneGeometry(PW,PD,40,80);
const paper=new T.Mesh(paperGeometry,mat('#ffffff',.96,{map:paperTex,side:T.DoubleSide}));paper.receiveShadow=true;paper.castShadow=true;root.add(paper);
let paperOpen=0,paperTarget=0;
function bendPaper(f){
 const pos=paperGeometry.attributes.position,uv=paperGeometry.attributes.uv;
 // Lift the free edge above the table, then lay the sheet behind the fixed clamp.
 const angle=f*Math.PI;
 for(let i=0;i<pos.count;i++){const u=uv.getX(i),t=1-uv.getY(i),s=t*PD;
  const z=s*Math.cos(angle),y=Math.sin(angle)*s*(.6+.18*t)+f*.38*(1-Math.exp(-s*3));
  pos.setXYZ(i,(u-.5)*PW,y+.012,-PD/2+z);
 }
 pos.needsUpdate=true;paperGeometry.computeVertexNormals();paperGeometry.computeBoundingSphere();
}
bendPaper(0);
const landscape=new T.Group();root.add(landscape);
const mountains=[{x:-1.30,z:-1.65,rx:1.52,rz:1.10,h:2.95,terrace:true},{x:-3.56,z:-1.97,rx:.64,rz:.68,h:2.08},{x:1.95,z:-1.90,rx:.93,rz:.88,h:2.40},{x:3.25,z:-1.15,rx:.70,rz:.72,h:1.65},{x:-4.02,z:.22,rx:.46,rz:.58,h:.95},{x:3.99,z:1.68,rx:.36,rz:.49,h:.73}];

const inkWorld=window.YSHInk.create(T,mountains);inkWorld.paintMap.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
const groups=inkWorld.layers;groups.forEach(g=>{landscape.add(g);g.scale.y=.001;g.visible=false;});
const trees=[[-3.5,-1.8,.8],[-2,-.05,1.05],[-1.9,.7,.8],[-3.25,1.55,.7],[1.9,-.08,.88],[3.2,-1.6,.82],[2.1,1.2,1.02],[3.5,.25,.72],[-.65,-.05,.65],[.65,-.7,.62]];
// Settlement circulation and bridge are generated together in site-layout.js.
const boat=new T.Group();boat.position.set(.12,.095,2.60);boat.rotation.y=.7;groups[2].add(boat);
const boatWood=inkWorld.material('#796347','wood'),hullVertices=[],hullIndices=[];
for(let j=0;j<=22;j++){const t=j/22,w=.16*Math.pow(Math.sin(t*Math.PI),.7),z=(t-.5)*.88,y=.02+.075*Math.pow(Math.abs(t*2-1),3);hullVertices.push(-w,y,z,-w*.45,-.045,z,w*.45,-.045,z,w,y,z);if(j<22)for(let a=0;a<3;a++){const n=j*4+a;hullIndices.push(n,n+4,n+1,n+1,n+4,n+5);}}
const hullGeometry=new T.BufferGeometry();hullGeometry.setAttribute('position',new T.Float32BufferAttribute(hullVertices,3));hullGeometry.setIndex(hullIndices);hullGeometry.computeVertexNormals();const hull=new T.Mesh(hullGeometry,boatWood);hull.material.side=T.DoubleSide;boat.add(hull);
for(const side of [-1,1]){const pts=[];for(let j=0;j<=22;j++){const t=j/22;pts.push(new T.Vector3(side*.16*Math.pow(Math.sin(t*Math.PI),.7),.026+.075*Math.pow(Math.abs(t*2-1),3),(t-.5)*.88));}boat.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.012,5,false),boatWood));}
for(const z of [-.15,.16])box(.24,.018,.072,boatWood,0,.005,z,boat);
const oar=box(.018,.012,.7,boatWood,.18,.075,.06,boat);oar.rotation.y=-.2;const paddle=box(.072,.012,.17,boatWood,.24,.075,-.30,boat);paddle.rotation.y=-.2;
// The full-screen painting reuses the same mesh buffers as the paper landscape.
const galleryScene=new T.Scene();galleryScene.background=new T.Color('#dce5ce');
const galleryModel=landscape.clone(true);galleryModel.children.forEach(g=>{g.visible=true;g.scale.y=1;});galleryScene.add(galleryModel,inkWorld.backdrop);
galleryScene.add(new T.HemisphereLight('#fff0cb','#6b8981',2.));
const galleryBox=new T.Box3(),galleryCenter=new T.Vector3(),gallerySize=new T.Vector3(),gallerySamples=[],galleryDirection=new T.Vector3(),galleryRight=new T.Vector3(),galleryUp=new T.Vector3(),galleryPoint=new T.Vector3(),galleryInstanceMatrix=new T.Matrix4(),worldUp=new T.Vector3(0,1,0);
galleryModel.updateWorldMatrix(true,true);galleryBox.makeEmpty();
// Every vertex/instance contributes. Small occupied spatial cells give complete
// conservative bounds without a giant empty scene-wide box or sampling omissions.
const galleryCells=new Map(),galleryAxes=[];let gallerySourcePoints=0;
function addGallerySample(point){
 gallerySourcePoints++;galleryBox.expandByPoint(point);
 const key=Math.floor(point.x/.55)+','+Math.floor(point.y/.55)+','+Math.floor(point.z/.55);let b=galleryCells.get(key);
 if(!b){b=new T.Box3();galleryCells.set(key,b);}b.expandByPoint(point);
}
galleryModel.traverse(object=>{
 if(!object.visible||!object.geometry)return;const position=object.geometry.attributes.position;if(!position)return;
 if(object.isInstancedMesh){object.geometry.computeBoundingBox();const b=object.geometry.boundingBox;
  for(let i=0;i<object.count;i++){object.getMatrixAt(i,galleryInstanceMatrix);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])addGallerySample(galleryPoint.set(x,y,z).applyMatrix4(galleryInstanceMatrix).applyMatrix4(object.matrixWorld));}
 }else for(let i=0;i<position.count;i++)addGallerySample(galleryPoint.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld));
});
for(const b of galleryCells.values())for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])gallerySamples.push(new T.Vector3(x,y,z));
if(galleryBox.isEmpty()){galleryBox.min.set(-PW/2,0,-PD/2);galleryBox.max.set(PW/2,1,PD/2);for(const x of [galleryBox.min.x,galleryBox.max.x])for(const y of [galleryBox.min.y,galleryBox.max.y])for(const z of [galleryBox.min.z,galleryBox.max.z])gallerySamples.push(new T.Vector3(x,y,z));}galleryBox.getCenter(galleryCenter);galleryBox.getSize(gallerySize);
let gallery=false,galleryYaw=.36,galleryPitch=.44,galleryZoom=1,galleryRotate=false,galleryFrame=null;
// Printed artwork is generated from the same positions as the geometry.
const toX=x=>(x/PW+.5)*CW,toY=z=>(z/PD+.5)*CH;
const inks=[],masks=[],maskCtx=[],inkTargets=[];
function pathRiver(c){c.beginPath();c.moveTo(510,260);c.bezierCurveTo(480,370,620,370,532,456);c.bezierCurveTo(470,506,420,536,416,625);c.lineTo(563,625);c.bezierCurveTo(547,546,640,491,648,425);c.bezierCurveTo(662,345,566,345,549,260);c.closePath();}
for(let l=0;l<3;l++){
 const c=document.createElement('canvas');c.width=CW;c.height=CH;const ctx=c.getContext('2d');
 if(l===0){
  ctx.save();pathRiver(ctx);ctx.fillStyle='#8fae9d';ctx.fill();ctx.clip();ctx.strokeStyle='#e4e4c8';ctx.lineWidth=1.3;for(let y=310;y<625;y+=12){ctx.beginPath();ctx.moveTo(370,y);ctx.bezierCurveTo(440,y-9,560,y+8,680,y);ctx.stroke();}ctx.restore();
  mountains.forEach((m,k)=>{const x=toX(m.x),y=toY(m.z),rx=m.rx/PW*CW,ry=m.rz/PD*CH;ctx.fillStyle=k%2?'#476d59':'#5b7d62';ctx.beginPath();for(let i=0;i<=80;i++){let a=i/80*Math.PI*2,rr=1+.085*Math.sin(a*5+k);const px=x+Math.cos(a)*rx*rr,py=y+Math.sin(a)*ry*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();for(let j=1;j<14;j++){ctx.strokeStyle=j%2?'#759578':'#9bae89';ctx.globalAlpha=.55;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(x+j*.7,y-j*.4,rx*(1-j*.063),ry*(1-j*.063),.05,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;});
 }else if(l===1){trees.forEach(([x,z,h],j)=>{const xx=toX(x),yy=toY(z);ctx.strokeStyle='#574e32';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx,yy+18);ctx.lineTo(xx+5,yy-25);ctx.stroke();for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#3f5c3b':'#6a7c4e';ctx.beginPath();ctx.ellipse(xx+Math.sin(i*2)*10,yy-i*12,23-i*3,10,0,0,Math.PI*2);ctx.fill();}});for(let i=0;i<55;i++){const x=80+rand()*860,y=150+rand()*400;if(x>390&&x<670)continue;ctx.strokeStyle='#87916a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y-8);ctx.moveTo(x,y);ctx.lineTo(x+4,y-6);ctx.stroke();}}
 else{
  const sb=inkWorld.site.bridge,bw=(sb.east[0]-sb.west[0])/PW*CW,bd=sb.width/PD*CH;
  ctx.save();ctx.translate(toX((sb.west[0]+sb.east[0])/2),toY(sb.west[2]));ctx.fillStyle='#a37c47';ctx.fillRect(-bw/2,-bd/2,bw,bd);ctx.strokeStyle='#e9d4a5';ctx.lineWidth=1;for(let i=0;i<20;i++){ctx.beginPath();ctx.moveTo(-bw/2+i*bw/20,-bd/2);ctx.lineTo(-bw/2+i*bw/20,bd/2);ctx.stroke();}ctx.strokeStyle='#8a3c2d';ctx.lineWidth=3;ctx.strokeRect(-bw/2,-bd/2,bw,bd);ctx.restore();
  for(const s of inkWorld.site.walks){ctx.strokeStyle='#ada685';ctx.lineWidth=s.width/PW*CW;ctx.beginPath();ctx.moveTo(toX(s.a[0]),toY(s.a[2]));ctx.lineTo(toX(s.b[0]),toY(s.b[2]));ctx.stroke();}
  for(const b of [inkWorld.site.templeSpec,inkWorld.site.lowerSpec]){const xx=toX(b.x),yy=toY(b.z),w=48*b.scale;ctx.fillStyle='#a54f32';ctx.fillRect(xx-w*.7,yy-w*.6,w*1.4,w*1.2);ctx.fillStyle='#485642';ctx.beginPath();ctx.moveTo(xx,yy-w);ctx.lineTo(xx+w,yy);ctx.lineTo(xx,yy+w);ctx.lineTo(xx-w,yy);ctx.closePath();ctx.fill();ctx.strokeStyle='#adba95';ctx.lineWidth=2;ctx.stroke();}
  ctx.fillStyle='#574a31';ctx.beginPath();ctx.ellipse(toX(.12),toY(2.60),10,36,.7,0,Math.PI*2);ctx.fill();
 }
 inks.push(c);const mask=document.createElement('canvas');mask.width=CW;mask.height=CH;masks.push(mask);maskCtx.push(mask.getContext('2d'));
 const data=ctx.getImageData(0,0,CW,CH).data,targets=[];for(let y=8;y<CH;y+=12)for(let x=8;x<CW;x+=12)if(data[(y*CW+x)*4+3]>80)targets.push({x,y,hit:false});inkTargets.push(targets);
}
const paperBase=document.createElement('canvas');paperBase.width=CW;paperBase.height=CH;const bc=paperBase.getContext('2d');bc.fillStyle='#ede4c9';bc.fillRect(0,0,CW,CH);
for(let i=0;i<38000;i++){const x=rand()*CW,y=rand()*CH;bc.fillStyle=rand()>.45?'rgba(111,91,52,.065)':'rgba(255,255,244,.22)';bc.fillRect(x,y,rand()*2.3+.3,rand()*.6+.3);}
bc.strokeStyle='#907b5730';bc.lineWidth=1;bc.strokeRect(34,34,CW-68,CH-68);
function corner(c,x,y,col){c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(x-12,y);c.lineTo(x+12,y);c.moveTo(x,y-12);c.lineTo(x,y+12);c.stroke();}
[[55,55],[CW-55,CH-55]].forEach(([x,y])=>corner(bc,x,y,'#a8573f'));
bc.save();bc.fillStyle='#8b7655';bc.font='15px SimSun,serif';bc.fillText('一印山河',60,CH-50);bc.font='10px serif';bc.fillStyle='#9c8968';bc.fillText('山 · 水 · 林 · 居',60,CH-33);bc.restore();
const tmp=document.createElement('canvas');tmp.width=CW;tmp.height=CH;const tc=tmp.getContext('2d');
let state='intro',layer=0,coverage=0,offset={x:.6,z:-.35},dragging=false,lastPoint=null,auto=false,autoElapsed=0,autoIndex=0,revealTime=0,rise=[0,0,0],riseTarget=[0,0,0],finalYaw=.15,finalPitch=.8,finalDistance=13,elapsed=0,foldTime=0,sealVisible=false;
const chapters=[{name:'落山',poem:'石青入纸，<br>远山初醒。',label:'山形',index:'第一版 / 01'},{name:'生林',poem:'苍绿叠印，<br>松间有风。',label:'林影',index:'第二版 / 02'},{name:'见人家',poem:'一桥一舍，<br>山河有归处。',label:'人家',index:'第三版 / 03'}];
function stamp(c){c.save();c.translate(CW-112,CH-118);c.rotate(-.04);c.fillStyle='#a54432';c.fillRect(0,0,56,65);c.strokeStyle='#e8d4ad';c.lineWidth=1.4;c.strokeRect(5,5,46,55);c.fillStyle='#eddfbb';c.font='21px SimSun,serif';c.fillText('山',17,28);c.fillText('河',17,52);c.restore();}
function updatePrint(){pc.clearRect(0,0,CW,CH);pc.drawImage(paperBase,0,0);for(let i=0;i<3;i++){tc.clearRect(0,0,CW,CH);tc.globalCompositeOperation='source-over';tc.drawImage(inks[i],0,0);tc.globalCompositeOperation='destination-in';tc.drawImage(masks[i],0,0);tc.globalCompositeOperation='source-over';pc.drawImage(tmp,0,0);}if(sealVisible)stamp(pc);paperTex.needsUpdate=true;}
updatePrint();
// Each printing block has a mirrored raised image, generated from its own print layer.
const inkMasks=[],inkMaskCtx=[],blockCanvases=[],blockTextures=[],blocks=[];
const blockBase=document.createElement('canvas');blockBase.width=CW;blockBase.height=CH;
const wb=blockBase.getContext('2d');wb.fillStyle='#977044';wb.fillRect(0,0,CW,CH);
for(let i=0;i<1600;i++){const y=rand()*CH;wb.strokeStyle=i%2?'#462b1712':'#ffe3a413';wb.lineWidth=.3+rand()*1.4;wb.beginPath();wb.moveTo(0,y);for(let x=0;x<=CW;x+=32)wb.lineTo(x,y+Math.sin(x*.013+i)*2);wb.stroke();}
function makeBlock(l){
 const mask=document.createElement('canvas');mask.width=CW;mask.height=CH;inkMasks.push(mask);inkMaskCtx.push(mask.getContext('2d'));
 const c=document.createElement('canvas');c.width=CW;c.height=CH;blockCanvases.push(c);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;blockTextures.push(tex);
 const g=new T.Group();g.name='mirrored-relief-block-'+l;box(PW,.22,PD,tablemat,0,-.135,0,g);
 const geo=new T.PlaneGeometry(PW,PD,192,126),pos=geo.attributes.position,uv=geo.attributes.uv,data=inks[l].getContext('2d').getImageData(0,0,CW,CH).data;
 for(let i=0;i<pos.count;i++){const u=uv.getX(i),v=uv.getY(i),x=Math.min(CW-1,Math.floor((1-u)*CW)),y=Math.min(CH-1,Math.floor((1-v)*CH)),alpha=data[(y*CW+x)*4+3]/255;pos.setXYZ(i,(u-.5)*PW,-.05+alpha*.046,(.5-v)*PD);}
 geo.computeVertexNormals();const face=new T.Mesh(geo,mat('#ffffff',.92,{map:tex,side:T.DoubleSide}));face.receiveShadow=true;face.castShadow=true;g.add(face);root.add(g);blocks.push(g);
 updateBlock(l);
 // Three smaller blocks on the table show the same actual image geometry.
 const spare=new T.Group();spare.name='stored-printing-block-'+l;scene.add(spare);spare.position.set(6.3,.10,-1.9+l*2.1);spare.scale.set(.21,.65,.21);spare.rotation.y=-.05+l*.05;
 box(PW,.22,PD,tablemat,0,-.135,0,spare);const spareFace=new T.Mesh(geo,face.material);spareFace.receiveShadow=true;spare.add(spareFace);
}
function updateBlock(l){
 const c=blockCanvases[l].getContext('2d');c.clearRect(0,0,CW,CH);c.drawImage(blockBase,0,0);
 tc.clearRect(0,0,CW,CH);tc.globalCompositeOperation='source-over';tc.drawImage(inks[l],0,0);tc.globalCompositeOperation='source-in';tc.fillStyle='#59371d';tc.fillRect(0,0,CW,CH);tc.globalCompositeOperation='source-over';
 c.save();c.translate(CW,0);c.scale(-1,1);c.drawImage(tmp,0,0);
 tc.clearRect(0,0,CW,CH);tc.drawImage(inks[l],0,0);tc.globalCompositeOperation='destination-in';tc.drawImage(inkMasks[l],0,0);tc.globalCompositeOperation='source-over';c.drawImage(tmp,0,0);c.restore();blockTextures[l].needsUpdate=true;
}
for(let l=0;l<3;l++)makeBlock(l);
// Corner marks are modern interaction aids on the frame, not historical tool markings.
const guides=new T.Group();root.add(guides);
for(const x of [-PW/2+.51,PW/2-.51])for(const z of [-PD/2+.51,PD/2-.51]){
 box(.30,.008,.025,vermilion,x,.013,z,guides);box(.025,.008,.30,vermilion,x,.013,z,guides);
 for(const block of blocks){box(.22,.008,.023,ivory,x,.018,z,block);box(.023,.008,.22,ivory,x,.018,z,block);}
}
let inkCoverage=0,inspecting=false,toolActive=false,toolHover=null;
const brushTarget=new T.Vector3(),brushRest=[new T.Vector3(-6.5,.08,1.22),new T.Vector3(-5.7,.08,2.02)];
const backCanvas=document.createElement('canvas');backCanvas.width=CW;backCanvas.height=CH;const backCtx=backCanvas.getContext('2d'),backTex=new T.CanvasTexture(backCanvas);backTex.colorSpace=T.SRGBColorSpace;
function updateBack(){backCtx.clearRect(0,0,CW,CH);backCtx.drawImage(paperBase,0,0);backCtx.save();backCtx.globalAlpha=.29;backCtx.translate(CW,0);backCtx.scale(-1,1);backCtx.drawImage(printCanvas,0,0);backCtx.restore();backTex.needsUpdate=true;}
function syncBlock(){blocks.forEach((b,i)=>{b.visible=i===layer;b.position.set(offset.x,0,offset.z);});guides.visible=state==='align';}
function showPaperBack(){updateBack();paper.material.map=backTex;paper.material.needsUpdate=true;}
function showPrintFace(){paper.material.map=paperTex;paper.material.needsUpdate=true;}
groups.forEach(g=>{g.visible=true;g.scale.y=1;});rise=[1,1,1];riseTarget=[1,1,1];
for(let i=0;i<3;i++){maskCtx[i].fillStyle='#fff';maskCtx[i].fillRect(0,0,CW,CH);inkTargets[i].forEach(q=>q.inkHit=false);}updatePrint();syncBlock();guides.visible=false;
const pointer=new T.Vector2(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),-PY),hit=new T.Vector3();
function paperPoint(e){const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);if(!ray.ray.intersectPlane(plane,hit))return null;return {x:hit.x,z:hit.z,px:toX(hit.x),py:toY(hit.z)};}
function onPaper(p){return p&&Math.abs(p.x)<PW/2&&Math.abs(p.z)<PD/2;}
function progressPoint(p){return {...p,px:CW-p.px};} // Both inking and rubbing are viewed from the paper's back.
function paint(p,from){
 if(!onPaper(p)||!['inking','brush'].includes(state)||inspecting||gallery)return;
 const a=progressPoint(p),b=from?progressPoint(from):null,inking=state==='inking',ctx=inking?inkMaskCtx[layer]:maskCtx[layer],r=inking?58:72;
 ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=r*2;ctx.lineCap='round';ctx.beginPath();ctx.arc(a.px,a.py,r,0,Math.PI*2);ctx.fill();if(b){ctx.beginPath();ctx.moveTo(b.px,b.py);ctx.lineTo(a.px,a.py);ctx.stroke();}
 const distance=q=>{if(!b)return Math.hypot(q.x-a.px,q.y-a.py);const dx=a.px-b.px,dy=a.py-b.py,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((q.x-b.px)*dx+(q.y-b.py)*dy)/d)):0;return Math.hypot(q.x-b.px-t*dx,q.y-b.py-t*dy);};
 const key=inking?'inkHit':'hit',targets=inkTargets[layer];for(const q of targets)if(!q[key]&&distance(q)<r)q[key]=true;
 const progress=targets.filter(q=>q[key]).length/targets.length;if(inking){inkCoverage=progress;updateBlock(layer);}else{coverage=progress;updatePrint();updateBack();}
 brushTarget.set(p.x,PY+.015,p.z);toolActive=true;updateUI();
}
let messageTimer;
function toast(t){$('message').textContent=t;$('message').classList.add('show');clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').classList.remove('show'),2600);}
function updateUI(){
 const c=chapters[layer];$('chapter-index').textContent=c.index;$('chapter-title').textContent=c.name;$('chapter-poem').innerHTML=c.poem;
 document.querySelectorAll('[data-chapter]').forEach((el,i)=>{el.classList.toggle('active',i===layer);el.classList.toggle('complete',i<layer||['final','folded','folding'].includes(state));});
 $('assist').disabled=false;$('advance').disabled=false;$('assist').hidden=false;$('progress-wrap').hidden=false;
 let step='',value='',title='',instruction='',assistText='',advanceText='',hint='',progress=0;
 if(state==='align'){
  const aligned=Math.hypot(offset.x,offset.z)<.095;progress=Math.max(0,1-Math.hypot(offset.x,offset.z)/1.2);
  step='01 / 移版套准';value=aligned?'木版已套准':`套准 ${Math.round(progress*100)}%`;title='纸边固定，移动木版。';instruction='纸张夹在后方横梁上。拖动下方木版，让浅色标记对准红色辅助角标。';assistText='辅助套准';advanceText='开始上墨 →';hint='方向键可微调 · 角标为操作辅助标记';$('advance').disabled=!aligned;
 }else if(state==='inking'||state==='brush'){
  const ink=state==='inking';progress=ink?inkCoverage:coverage;
  step=ink?'02 / 木版上墨':'04 / 刷纸背';value=(ink?'版面上墨 ':'图案压印 ')+Math.round(progress*100)+'%';
  title=ink?(progress>=.9?'墨已匀，覆上这一张纸。':'用棕刷，把水墨匀上木版。'):(progress>=.9?'压印已就，轻轻揭纸。':'用上刷，刷过纸张背面。');
  instruction=ink?'按住鼠标或手指，沿雕版图案来回上墨。凸起的纹样与本版印稿互为镜像。':'纸面朝向木版。按住拖动元宝形上刷，在纸背均匀施压；浅浅透出的墨迹是操作反馈。';
  assistText=auto?'正在'+(ink?'上墨…':'刷印…'):'自动'+(ink?'上墨':'刷印');advanceText=ink?'覆纸 →':'揭纸 →';hint=ink?'上墨达到 90% 可覆纸 · 棕刷随手移动':'压印达到 90% 可揭纸 · 前端纸边会卷起';$('assist').disabled=auto||progress>=.9;$('advance').disabled=progress<.9;
 }else if(state==='laying'||state==='reveal'){
  const laying=state==='laying';step=laying?'03 / 覆纸':'05 / 揭纸';value=laying?'落纸于版':'纸边卷起';title=laying?'从固定的一边，慢慢覆下。':'从纸的前端，轻轻揭起。';instruction=laying?'夹纸横梁保持后边位置，纸张弯曲着回落到木版上。':'纸张绕固定后边卷起，露出下方雕版。随后换版，继续套印。';advanceText=laying?'正在覆纸…':layer<2?'准备下一版…':'山河将醒…';hint='等待纸张完成翻动';progress=1;$('assist').hidden=true;$('advance').disabled=true;
 }else if(['final','folding','folded'].includes(state)){
  $('chapter-index').textContent='三版成画 / COMPLETE';$('chapter-title').textContent=state==='folded'?'一纸山河':'山河已醒';$('chapter-poem').innerHTML='方寸之间，<br>自有天地。';step='终章 / 留印';value='三版 · 完成';title=state==='folded'?'把这片山河，带走。':'你印下的，是一片天地。';instruction=state==='folded'?'山河归于纸面。保存这幅印稿，或重新开启一次套印。':'拖动环视山河，滚轮调整远近。让山河入纸后，可保存完整印稿。';assistText='保存画面';advanceText=state==='folded'?'保存印稿 ↓':'山河入纸';hint='山河生长为艺术演绎 · 顶部可细看器物';progress=1;$('advance').disabled=state==='folding';
 }
 $('step-label').textContent=step;$('value-label').textContent=value;$('action-title').textContent=title;$('instruction').textContent=instruction;$('assist').textContent=assistText;$('advance').textContent=advanceText;$('key-hint').textContent=hint;$('progress-bar').style.width=Math.min(1,progress)*100+'%';
 $('view-hint').textContent=state==='intro'?'在一方印台，遇见一座山河':step+' · '+c.label;
}
function reset(){
 if(gallery)toggleGallery(false);inspecting=false;auto=false;dragging=false;lastPoint=null;toolActive=false;toolHover=null;state='intro';layer=0;sealVisible=false;offset={x:.6,z:-.35};coverage=inkCoverage=0;paperOpen=paperTarget=0;bendPaper(0);rise=[1,1,1];riseTarget=[1,1,1];groups.forEach(g=>{g.visible=true;g.scale.y=1;});
 for(let i=0;i<3;i++){maskCtx[i].fillStyle='#fff';maskCtx[i].fillRect(0,0,CW,CH);inkMaskCtx[i].clearRect(0,0,CW,CH);inkTargets[i].forEach(q=>{q.hit=q.inkHit=false;});updateBlock(i);}updatePrint();showPrintFace();syncBlock();guides.visible=false;
 $('intro').hidden=false;$('controls').hidden=true;$('chapter').hidden=true;$('brush').hidden=true;$('tool-note').hidden=true;$('inspect').textContent='器物细看';$('inspect').setAttribute('aria-pressed','false');$('message').classList.remove('show');document.body.classList.remove('playing','inspecting');$('view-hint').textContent='在一方印台，遇见一座山河';setCamera();
}
function start(){
 reset();state='align';offset={x:.64,z:-.34};paperTarget=1;rise=[0,0,0];riseTarget=[0,0,0];groups.forEach(g=>{g.visible=false;g.scale.y=.001;});for(let i=0;i<3;i++)maskCtx[i].clearRect(0,0,CW,CH);updatePrint();showPaperBack();syncBlock();
 $('intro').hidden=true;$('controls').hidden=false;$('chapter').hidden=false;document.body.classList.add('playing');updateUI();setCamera();
}
function advance(){
 if(inspecting||gallery)return;
 if(state==='align'&&Math.hypot(offset.x,offset.z)<.095){state='inking';offset={x:0,z:0};syncBlock();inkCoverage=0;tone(392);toast('木版已套准 · 在版面上墨');}
 else if(state==='inking'&&inkCoverage>=.9){auto=false;dragging=false;toolActive=false;inkMaskCtx[layer].fillStyle='#fff';inkMaskCtx[layer].fillRect(0,0,CW,CH);inkCoverage=1;updateBlock(layer);state='laying';revealTime=0;paperTarget=0;showPaperBack();}
 else if(state==='brush'&&coverage>=.9){auto=false;dragging=false;toolActive=false;maskCtx[layer].fillStyle='#fff';maskCtx[layer].fillRect(0,0,CW,CH);updatePrint();updateBack();state='reveal';revealTime=0;paperTarget=1;tone([261.63,329.63,392][layer]);}
 else if(state==='final'){state='folding';foldTime=0;riseTarget=[0,0,0];toast('山河入纸 · 一印留存');setCamera();}
 else if(state==='folded'){saveCanvas(printCanvas,'一印山河-原创印稿.png');toast('印稿已生成 · 预览后下载');}
 lastPoint=null;$('brush').hidden=true;updateUI();
}
function assist(){if(inspecting||gallery)return;if(state==='align'){offset={x:0,z:0};syncBlock();tone(293.66);toast('木版已对齐');}else if(['inking','brush'].includes(state)&&!auto){auto=true;autoIndex=0;autoElapsed=0;lastPoint=null;}else if(['final','folded'].includes(state)){renderer.render(scene,camera);saveCanvas(renderer.domElement,'一印山河-场景.png');toast('画面已生成 · 预览后下载');}updateUI();}
function saveCanvas(c,name){const url=c.toDataURL('image/png');$('export-image').src=url;$('export-download').href=url;$('export-download').download=name;$('export-title').textContent=name.includes('印稿')?'原创印稿预览':'场景画面预览';$('export-dialog').showModal();}
$('export-close').addEventListener('click',()=>$('export-dialog').close());
$('inspect-save').addEventListener('click',()=>{renderer.render(scene,camera);saveCanvas(renderer.domElement,'一印山河-器物特写.png');});
function toggleInspect(force){if(gallery)toggleGallery(false);inspecting=typeof force==='boolean'?force:!inspecting;dragging=false;toolActive=false;toolHover=null;$('brush').hidden=true;document.body.classList.toggle('inspecting',inspecting);$('tool-note').hidden=!inspecting;$('intro').hidden=inspecting||state!=='intro';$('controls').hidden=inspecting||state==='intro';$('chapter').hidden=inspecting||state==='intro';$('inspect').textContent=inspecting?'返回印台':'器物细看';$('inspect').setAttribute('aria-pressed',String(inspecting));updateUI();setCamera();}
function toggleGallery(force){
 const next=typeof force==='boolean'?force:!gallery;
 if(next&&inspecting)toggleInspect(false);
 gallery=next;
 dragging=false;lastPoint=null;toolActive=false;toolHover=null;
 document.body.classList.toggle('gallery',gallery);$('art-note').hidden=!gallery;
 $('intro').hidden=gallery||inspecting||state!=='intro';$('chapter').hidden=gallery||inspecting||state==='intro';$('controls').hidden=gallery||inspecting||state==='intro';$('brush').hidden=true;
 $('art-view').textContent=gallery?'返回印台':'青绿画境';$('art-view').setAttribute('aria-pressed',String(gallery));
 renderer.toneMappingExposure=gallery?1.:1.12;galleryFrame=null;setCamera();
}
$('art-view').addEventListener('click',()=>toggleGallery());$('art-enter').addEventListener('click',()=>toggleGallery(true));
$('art-exit').addEventListener('click',()=>toggleGallery(false));
$('art-reset').addEventListener('click',()=>{galleryYaw=.36;galleryPitch=.44;galleryZoom=1;setCamera();});
$('art-rotate').addEventListener('click',()=>{galleryRotate=!galleryRotate;$('art-rotate').setAttribute('aria-pressed',String(galleryRotate));$('art-rotate').textContent=galleryRotate?'暂停游览':'缓缓游览';});
$('art-save').addEventListener('click',()=>{renderer.render(galleryScene,camera);saveCanvas(renderer.domElement,'一印山河-青绿画境.png');});
function getGalleryFrame(){
 if(galleryFrame)return galleryFrame;
 const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),margin=Math.max(12,Math.min(28,w*.035));let top=margin,bottom=h-margin;
 const header=document.querySelector('header').getBoundingClientRect();top=Math.max(top,header.bottom+14);
 for(const selector of ['.art-title','.art-actions','footer']){const rect=document.querySelector(selector).getBoundingClientRect();if(rect.width&&rect.height)bottom=Math.min(bottom,rect.top-14);}
 if(bottom<=top+48)bottom=Math.min(h-margin,top+48);
 galleryFrame={left:margin,right:w-margin,top,bottom,width:w,height:h};return galleryFrame;
}
function galleryProjection(distance,dir,tanX,tanY){
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,maxToward=-Infinity;
 for(const point of galleryAxes){const depth=Math.max(.01,distance-point.z),x=point.x/depth,y=point.y/depth;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);maxToward=Math.max(maxToward,point.z);}
 return {minX,maxX,minY,maxY,maxToward,width:maxX-minX,height:maxY-minY};
}
function galleryFit(frame,dir){
 galleryRight.crossVectors(worldUp,dir).normalize();galleryUp.crossVectors(dir,galleryRight).normalize();
 const halfX=Math.max(.04,(frame.right-frame.left)/frame.width/1.03),halfY=Math.max(.04,(frame.bottom-frame.top)/frame.height/1.03),tanY=Math.tan(T.MathUtils.degToRad(camera.fov*.5)),tanX=tanY*camera.aspect;
 galleryAxes.length=0;let maxToward=-Infinity;for(const point of gallerySamples){galleryPoint.subVectors(point,galleryCenter);const toward=galleryPoint.dot(dir);maxToward=Math.max(maxToward,toward);galleryAxes.push({x:galleryPoint.dot(galleryRight)/tanX,y:galleryPoint.dot(galleryUp)/tanY,z:toward});}const minDistance=maxToward+Math.max(.18,gallerySize.length()*.018);let low=minDistance,high=Math.max(minDistance*1.5,gallerySize.length()*1.5);
 const fits=distance=>{const p=galleryProjection(distance,dir,tanX,tanY);return p.width<=halfX*2&&p.height<=halfY*2;};while(!fits(high)&&high<10000)high*=1.7;for(let i=0;i<18;i++){const mid=(low+high)/2;if(fits(mid))high=mid;else low=mid;}
 return {distance:high,minDistance,tanX,tanY,halfX,halfY};
}
function setCamera(){
 const mobile=innerWidth<850,md=Math.max(25,PW/(1.65*Math.tan(38*Math.PI/360)*camera.aspect));
 camera.near=.1;camera.far=120;camera.clearViewOffset();camera.updateProjectionMatrix();
 if(gallery){
  const frame=getGalleryFrame();galleryDirection.set(Math.sin(galleryYaw)*Math.cos(galleryPitch),Math.sin(galleryPitch),Math.cos(galleryYaw)*Math.cos(galleryPitch));const fit=galleryFit(frame,galleryDirection),d=Math.max(fit.minDistance,fit.distance*galleryZoom),projected=galleryProjection(d,galleryDirection,fit.tanX,fit.tanY);
  cameraTarget.copy(galleryCenter).addScaledVector(galleryDirection,d);lookTarget.copy(galleryCenter);camera.far=Math.max(120,d+gallerySize.length()*2);camera.updateProjectionMatrix();
  const centerX=(frame.left+frame.right)/frame.width-1,centerY=1-(frame.top+frame.bottom)/frame.height;camera.projectionMatrix.elements[8]=(projected.minX+projected.maxX)/2-centerX;camera.projectionMatrix.elements[9]=(projected.minY+projected.maxY)/2-centerY;camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 }
 else if(inspecting){cameraTarget.set(mobile?-3.4:-3.6,mobile?6.7:4.5,mobile?10.6:7.5);lookTarget.set(-6.1,.25,mobile?3.1:2.7);}
 else if(state==='intro'){cameraTarget.set(mobile?md*.4:13,mobile?md*.5:10,mobile?md*.8:13);lookTarget.set(-1,.6,0);}
 else if(state==='final'){const d=mobile?md:finalDistance;cameraTarget.set(Math.sin(finalYaw)*d,Math.sin(finalPitch)*d+2,Math.cos(finalYaw)*d);lookTarget.set(0,.9,0);}
 else{cameraTarget.set(mobile?0:1.5,mobile?md*.84:14,mobile?md*.58:10);lookTarget.set(mobile?0:1.2,0,.8);}
}
function updateTools(dt){
 const kind=state==='inking'?0:state==='brush'?1:-1,tools=[inkingBrush,rubbingBrush];
 for(let i=0;i<2;i++){const active=i===kind&&!inspecting&&!gallery&&(toolActive||toolHover);const target=active?brushTarget:brushRest[i];tools[i].position.lerp(target,Math.min(1,dt*14));tools[i].rotation.y=active?Math.sin(elapsed*8)*.035:0;tools[i].rotation.z=active&&dragging?Math.sin(elapsed*20)*.035:0;}
}
$('start').addEventListener('click',start);$('advance').addEventListener('click',advance);$('assist').addEventListener('click',assist);$('reset').addEventListener('click',()=>{reset();toast('印台已归置');});$('inspect').addEventListener('click',()=>toggleInspect());$('inspect-close').addEventListener('click',()=>toggleInspect(false));document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();reset();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('此窗口不支持全屏，可在浏览器打开');}});
renderer.domElement.addEventListener('pointerdown',e=>{if(gallery&&e.button===0){dragging=true;lastPoint={sx:e.clientX,sy:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);return;}if(e.button!==0||inspecting||gallery)return;const p=paperPoint(e);if(['align','inking','brush'].includes(state)&&!onPaper(p))return;if(!['align','inking','brush','final'].includes(state))return;dragging=true;renderer.domElement.setPointerCapture(e.pointerId);lastPoint=p;if(['inking','brush'].includes(state)){auto=false;paint(p,null);}if(state==='final')lastPoint={sx:e.clientX,sy:e.clientY};});
renderer.domElement.addEventListener('pointermove',e=>{
 if(gallery){if(dragging&&lastPoint){galleryYaw-=(e.clientX-lastPoint.sx)*.006;galleryPitch=Math.max(.12,Math.min(.95,galleryPitch+(e.clientY-lastPoint.sy)*.003));lastPoint={sx:e.clientX,sy:e.clientY};setCamera();}return;}
 if(inspecting||gallery)return;const p=paperPoint(e),painting=['inking','brush'].includes(state);toolHover=painting&&onPaper(p)?p:null;$('brush').hidden=!toolHover;$('brush').style.left=e.clientX+'px';$('brush').style.top=e.clientY+'px';if(toolHover&&!auto)brushTarget.set(p.x,PY+.015,p.z);if(!dragging)return;
 if(state==='align'&&p&&lastPoint){offset.x=Math.max(-1.2,Math.min(1.2,offset.x+p.x-lastPoint.x));offset.z=Math.max(-.9,Math.min(.9,offset.z+p.z-lastPoint.z));lastPoint=p;syncBlock();updateUI();}
 else if(painting){if(onPaper(p)){paint(p,lastPoint);lastPoint=p;}else lastPoint=null;}
 else if(state==='final'&&lastPoint){finalYaw-=(e.clientX-lastPoint.sx)*.007;finalPitch=Math.max(.2,Math.min(1.25,finalPitch+(e.clientY-lastPoint.sy)*.004));lastPoint={sx:e.clientX,sy:e.clientY};setCamera();}
});
function endPointer(){dragging=false;lastPoint=null;if(!auto)toolActive=false;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,endPointer);
renderer.domElement.addEventListener('pointerleave',()=>{$('brush').hidden=true;toolHover=null;if(!dragging&&!auto)toolActive=false;});
renderer.domElement.addEventListener('wheel',e=>{if(gallery){e.preventDefault();galleryZoom=Math.max(.55,Math.min(2.5,galleryZoom*Math.exp(e.deltaY*.001)));setCamera();return;}if(state==='final'&&!inspecting){e.preventDefault();finalDistance=Math.max(9,Math.min(22,finalDistance+e.deltaY*.008));setCamera();}},{passive:false});
document.addEventListener('keydown',e=>{if($('export-dialog').open)return;if(e.key==='Escape'&&gallery){toggleGallery(false);return;}if(gallery&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')galleryYaw-=.07;if(e.key==='ArrowRight')galleryYaw+=.07;if(e.key==='ArrowUp')galleryPitch=Math.min(.95,galleryPitch+.04);if(e.key==='ArrowDown')galleryPitch=Math.max(.12,galleryPitch-.04);if(e.key==='+')galleryZoom=Math.max(.55,galleryZoom*.9);if(e.key==='-')galleryZoom=Math.min(2.5,galleryZoom*1.1);setCamera();return;}if(e.key==='Escape'&&inspecting){toggleInspect(false);return;}if(state==='align'&&!inspecting&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')offset.x-=.025;if(e.key==='ArrowRight')offset.x+=.025;if(e.key==='ArrowUp')offset.z-=.025;if(e.key==='ArrowDown')offset.z+=.025;offset.x=Math.max(-1.2,Math.min(1.2,offset.x));offset.z=Math.max(-.9,Math.min(.9,offset.z));syncBlock();updateUI();}});
let audioCtx=null,audioOn=false,noiseGain;
function initAudio(){if(audioCtx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();const n=audioCtx.sampleRate*2,buffer=audioCtx.createBuffer(1,n,audioCtx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=760;noiseGain=audioCtx.createGain();noiseGain.gain.value=0;source.connect(filter).connect(noiseGain).connect(audioCtx.destination);source.start();}
function tone(freq){if(!audioOn||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(.13,audioCtx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+1.1);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+1.2);}
$('sound').addEventListener('click',()=>{try{initAudio();if(!audioCtx){toast('当前浏览器不支持声音');return;}audioOn=!audioOn;audioCtx.resume();noiseGain.gain.setTargetAtTime(audioOn?.09:0,audioCtx.currentTime,.25);$('sound').textContent='声音 · '+(audioOn?'开':'关');$('sound').setAttribute('aria-pressed',String(audioOn));if(audioOn)tone(523.25);}catch{toast('声音未能开启，仍可继续体验');}});
document.addEventListener('visibilitychange',()=>{if(audioCtx){if(document.hidden)audioCtx.suspend();else if(audioOn)audioCtx.resume();}});
let highQuality=true;function resize(){const w=innerWidth,h=innerHeight;const ratio=highQuality?Math.min(2,Math.max(1.5,devicePixelRatio)):Math.min(1,devicePixelRatio);renderer.setPixelRatio(Math.min(ratio,Math.sqrt(5000000/(w*h))));renderer.setSize(w,h);camera.aspect=w/h;galleryFrame=null;setCamera();}addEventListener('resize',resize);resize();
$('art-quality').addEventListener('click',()=>{highQuality=!highQuality;$('art-quality').textContent=highQuality?'画质 · 高清':'画质 · 流畅';$('art-quality').setAttribute('aria-pressed',String(highQuality));resize();});
document.querySelector('footer span:last-child').textContent='青绿画境 / 0.5';
reset();
if(location.hash!=='#workshop')toggleGallery(true);
const clock=new T.Clock();let frames=0;
function tick(){
 requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(!inspecting&&!gallery){
  if(auto&&['inking','brush'].includes(state)){autoElapsed+=dt;const targets=inkTargets[layer],key=state==='inking'?'inkHit':'hit';if(autoElapsed>.07){autoElapsed=0;while(autoIndex<targets.length&&targets[autoIndex][key])autoIndex++;const q=targets[autoIndex];if(q){const p={x:(.5-q.x/CW)*PW,z:(q.y/CH-.5)*PD,px:CW-q.x,py:q.y};paint(p,null);autoIndex++;}if(!q||(state==='inking'?inkCoverage:coverage)>=.985){auto=false;toolActive=false;lastPoint=null;updateUI();}}}
  if(state==='laying'){revealTime+=dt;if(revealTime>(reduced?.5:2.1)){paperOpen=paperTarget=0;bendPaper(0);state='brush';coverage=0;updateUI();toast('纸已覆下 · 用上刷刷纸背');}}
  if(state==='reveal'){revealTime+=dt;if(revealTime>(reduced?.55:2.5)){if(layer<2){layer++;state='align';offset={x:layer===1?-.5:.45,z:layer===1?.3:-.32};coverage=inkCoverage=0;syncBlock();toast('第'+['一','二','三'][layer]+'版 · '+chapters[layer].label);}else{state='final';paperTarget=0;showPrintFace();groups.forEach(g=>g.visible=true);riseTarget=[1,1,1];finalYaw=.25;finalPitch=.65;finalDistance=12.5;setCamera();toast('一纸之间，山河已醒');tone(523.25);}updateUI();}}
  if(state==='folding'){foldTime+=dt;if(foldTime>(reduced?.4:2.5)){state='folded';groups.forEach(g=>g.visible=false);sealVisible=true;updatePrint();updateUI();}}
  if(Math.abs(paperOpen-paperTarget)>.0001){paperOpen+=(paperTarget-paperOpen)*Math.min(1,dt*(reduced?18:3.8));bendPaper(paperOpen);}
  for(let i=0;i<3;i++){rise[i]+=(riseTarget[i]-rise[i])*Math.min(1,dt*(reduced?15:2));groups[i].scale.y=Math.max(.001,rise[i]);}
 }
 updateTools(dt);
 if(gallery&&galleryRotate&&!dragging&&!reduced){galleryYaw+=dt*.07;setCamera();}
 inkWorld.update(reduced||gallery?0:elapsed);
 if(gallery){camera.position.copy(cameraTarget);look.copy(lookTarget);}else{camera.position.lerp(cameraTarget,Math.min(1,dt*(reduced?20:2.6)));look.lerp(lookTarget,Math.min(1,dt*3));}camera.lookAt(look);
 lanternGroup.rotation.z=reduced?0:Math.sin(elapsed*.6)*.018;if(state==='final'&&!gallery&&!reduced)boat.position.y=.095+Math.sin(elapsed*1.3)*.018;
 renderer.render(gallery?galleryScene:scene,camera);frames++;
 if(frames%30===0){renderer.domElement.dataset.frame=frames;renderer.domElement.dataset.mode=gallery?'gallery':state;renderer.domElement.dataset.drawCalls=renderer.info.render.calls;renderer.domElement.dataset.triangles=renderer.info.render.triangles;}
}
tick();
// Read-only diagnostics for local acceptance checks.
window.YinShanHe={getState:()=>({version:'0.5',gallery,art:inkWorld.stats,state,layer,coverage,inkCoverage,offset:{...offset},paperOpen,paperTarget,inspecting,rise:[...rise],auto,frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,brushes:[inkingBrush.position.toArray(),rubbingBrush.position.toArray()],galleryBounds:{min:galleryBox.min.toArray(),max:galleryBox.max.toArray(),samples:gallerySamples.length,sourcePoints:gallerySourcePoints,cells:galleryCells.size}}),projectPaper:(x,z)=>{const p=new T.Vector3(x,PY+.01,z).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}};
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('图形上下文已中断。请关闭部分占用显卡的窗口，再重新加载。');});
})();
