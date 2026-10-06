from pathlib import Path
root=Path('outputs/YinShanHe')
app=(root/'app.js').read_text(encoding='utf-8-sig')
def replace(old,new):
    global app
    assert old in app, old[:100]
    app=app.replace(old,new,1)
replace('const groups=inkWorld.layers;', 'let groups=inkWorld.layers;')
replace('let gallery=false,', 'let creator=null, customPlan=null, activePrintLayers=[0,1,2];\nlet gallery=false,')
replace('galleryModel.updateWorldMatrix(true,true);galleryBox.makeEmpty();','function rebuildGalleryBounds(){\ngallerySamples.length=0;galleryCells.clear();gallerySourcePoints=0;\ngalleryModel.updateWorldMatrix(true,true);galleryBox.makeEmpty();')
replace('const galleryCells=new Map(),galleryAxes=[];let gallerySourcePoints=0;', '')
replace('function rebuildGalleryBounds(){','const galleryCells=new Map(),galleryAxes=[];let gallerySourcePoints=0;\nfunction rebuildGalleryBounds(){')
replace('galleryBox.getCenter(galleryCenter);galleryBox.getSize(gallerySize);','galleryBox.getCenter(galleryCenter);galleryBox.getSize(gallerySize);\n}\nrebuildGalleryBounds();')
replace('if(!onPaper(p)||', 'if(creator?.editing||!onPaper(p)||')
replace("if(inspecting||gallery)return;", "if(creator?.editing||inspecting||gallery)return;")
replace('targets.filter(q=>q[key]).length/targets.length', 'targets.length?targets.filter(q=>q[key]).length/targets.length:1')
replace("const c=chapters[layer];", "const c=chapters[layer];\n if(customPlan)document.querySelectorAll('[data-chapter]').forEach((el,i)=>el.hidden=!activePrintLayers.includes(i));")
replace("$('chapter-index').textContent=c.index;", "$('chapter-index').textContent=customPlan?'第'+(activePrintLayers.indexOf(layer)+1)+'块色版 / 共'+activePrintLayers.length+'块':c.index;")
replace("layer<2?'准备下一版…':'山河将醒…'", "activePrintLayers.some(i=>i>layer)?'准备下一版…':'山河将醒…'")
replace("name:'落山'", "name:'落山水'")
replace("label:'山形'", "label:'山水'")
replace("一桥一舍，", "一舟一舍，")
replace("$('chapter-index').textContent='三版成画 / COMPLETE';", "$('chapter-index').textContent=activePrintLayers.length+'版成画 / COMPLETE';")
replace("value='三版 · 完成';", "value=activePrintLayers.length+'版 · 完成';")
replace("$('view-hint').textContent=state==='intro'", "if(customPlan&&['final','folded'].includes(state))$('chapter-title').textContent=customPlan.title;\n $('view-hint').textContent=state==='intro'")
replace("reset();state='align';offset=", "reset();layer=activePrintLayers[0]??0;state='align';offset=")
replace("else if(state==='folded'){saveCanvas(printCanvas,'一印山河-原创印稿.png');", "else if(state==='folded'){saveCanvas(printCanvas,'一印山河-'+(customPlan?.title||'原创')+'-印稿.png');")
replace("$('start').addEventListener('click',start);", "$('start').addEventListener('click',start);")
replace("$('reset').addEventListener('click',()=>{reset();toast('印台已归置');});", "$('reset').addEventListener('click',()=>{start();toast('保留构图，重新套印');});")
replace("document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();reset();});", "document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();creator?.open();});")
replace("renderer.domElement.addEventListener('pointerdown',e=>{", "renderer.domElement.addEventListener('pointerdown',e=>{if(creator?.editing)return;")
replace("renderer.domElement.addEventListener('pointermove',e=>{", "renderer.domElement.addEventListener('pointermove',e=>{if(creator?.editing)return;")
replace("document.addEventListener('keydown',e=>{", "document.addEventListener('keydown',e=>{if(creator?.editing)return;")
replace("document.querySelector('footer span:last-child').textContent='青绿画境 / 0.5';", "document.querySelector('footer span:last-child').textContent='自由制版 / DEMO';")
replace("if(location.hash!=='#workshop')toggleGallery(true);", '''
const customGeometry=new Set();
const creatorPaperTexture=new T.CanvasTexture(paperBase);creatorPaperTexture.colorSpace=T.SRGBColorSpace;
const creatorPaperMaterial=new T.MeshBasicMaterial({map:creatorPaperTexture,color:'#ffffff',side:T.DoubleSide});
function installComposition(input){
 const A=window.YSHCreatorArt;customPlan=A.normalize(input);
 const validation=A.validate(customPlan);if(!validation.ok)throw new Error(validation.issues.map(i=>i.reason).join('；'));
 activePrintLayers=validation.layers.map((n,i)=>n?i:-1).filter(i=>i>=0);
 const images=A.drawLayers(customPlan,CW,CH);
 for(let l=0;l<3;l++){
  const ctx=inks[l].getContext('2d');ctx.clearRect(0,0,CW,CH);ctx.drawImage(images[l],0,0);
  const data=ctx.getImageData(0,0,CW,CH).data;inkTargets[l].length=0;
  for(let y=8;y<CH;y+=12)for(let x=8;x<CW;x+=12)if(data[(y*CW+x)*4+3]>80)inkTargets[l].push({x,y,hit:false,inkHit:false});
  const geo=blocks[l].children[1].geometry,pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++){const u=uv.getX(i),v=uv.getY(i),x=Math.min(CW-1,Math.floor((1-u)*CW)),y=Math.min(CH-1,Math.floor((1-v)*CH));pos.setY(i,-.05+data[(y*CW+x)*4+3]/255*.046);}
  pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();updateBlock(l);
 }
 groups.forEach(g=>landscape.remove(g));galleryModel.clear();
 for(const geometry of customGeometry)geometry.dispose();customGeometry.clear();
 groups=A.createLayers(T,customPlan,{material:inkWorld.material});
 groups.forEach(g=>{landscape.add(g);g.traverse(o=>{if(o.geometry)customGeometry.add(o.geometry);});const clone=g.clone(true);clone.visible=true;clone.scale.y=1;galleryModel.add(clone);});
 const sheetGeo=new T.PlaneGeometry(PW,PD),sheet=new T.Mesh(sheetGeo,creatorPaperMaterial);sheet.rotation.x=-Math.PI/2;sheet.position.y=-.014;sheet.name='composition-paper';galleryModel.add(sheet);customGeometry.add(sheetGeo);
 rebuildGalleryBounds();galleryFrame=null;
 document.querySelector('.art-title p').textContent='一印山河 · 我的版，我的山河';
 document.querySelector('.art-title h1').textContent=customPlan.title;
 document.querySelector('.art-title span').textContent='每一处位置，都来自你的拼版';
}
creator=window.YSHCreator.create({
 paperBase,blockBase,
 pause(){auto=false;dragging=false;toolActive=false;toolHover=null;$('brush').hidden=true;},
 print(plan){installComposition(plan);start();toast('你的纹样已反刻上版 · 从套准开始');},
 preview(plan){installComposition(plan);reset();toggleGallery(true);galleryYaw=.22;galleryPitch=.68;galleryZoom=1;setCamera();},
 report(message){toast(message);}
});
$('creator-home').addEventListener('click',()=>creator.open());
creator.open();
''')
replace('if(!inspecting&&!gallery){', 'if(!inspecting&&!gallery&&!creator?.editing){')
replace("if(layer<2){layer++;state='align';", "const nextLayer=activePrintLayers.find(i=>i>layer);if(nextLayer!==undefined){layer=nextLayer;state='align';")
replace('renderer.render(gallery?galleryScene:scene,camera);frames++;', 'if(!creator?.editing)renderer.render(gallery?galleryScene:scene,camera);frames++;')
replace("version:'0.5',gallery", "version:'creator-demo',composition:customPlan,creator:creator?.getState(),gallery")
(root/'creator-studio.js').write_text(app,encoding='utf-8')
html=Path('backups/YinShanHe-0.5-20260914-220937/index.html').read_text(encoding='utf-8-sig')
html=html.replace('<title>一印山河 · 青绿画境</title>','<title>一印山河 · 自由制版</title>').replace('<body>','<body class="creator-studio">')
html=html.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="creator.css">')
html=html.replace('<nav aria-label="体验控制">','<nav aria-label="体验控制"><button id="creator-home">返回拼版</button>')
html=html.replace('id="reset">重新开始','id="reset">重印此版')
html=html.replace('一桥 · 朱砂','屋舟 · 朱砂').replace('山形<small>群峰','山水<small>群峰')
html=html.replace('<script src="app.js"></script>','<script src="creator-art.js"></script><script src="creator.js"></script><script src="creator-studio.js"></script>')
(root/'creator.html').write_text(html,encoding='utf-8')
print('Created isolated creator page and print-studio integration; app.js is untouched.')
