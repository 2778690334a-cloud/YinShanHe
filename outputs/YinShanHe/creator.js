/* Free composition UI. Every layer goes through the original physical printing studio. */
'use strict';
(() => {
const names={mountain:'山',water:'水',tree:'树',boat:'船',house:'屋',rock:'石',reeds:'苇',lantern:'灯'};
const icons={mountain:'M4 32 17 9 25 22 34 4 49 32Z',water:'M3 13Q15 3 27 13T51 13M3 25Q15 15 27 25T51 25M3 36Q15 26 27 36T51 36',tree:'M26 38V17M26 25 14 19M26 21 37 14M9 19Q0 9 15 9Q16 0 27 6Q41 0 44 11Q54 20 38 22Q25 31 9 19Z',boat:'M5 22Q25 38 49 22L42 33Q25 41 12 32ZM29 5 43 36M18 24H35',house:'M6 19 26 4 47 19ZM12 19V38H41V19M24 38V26H32V38M8 39H45'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=p=>JSON.parse(JSON.stringify(p));
Object.assign(icons,{rock:'M5 34 10 20 23 12 38 16 49 31 34 37ZM10 20 27 27 38 16M27 27 34 37',reeds:'M15 39 18 12M26 39 28 5M36 39 38 16M18 21 8 16M27 25 41 20M28 5 25 11 29 15 32 10Z',lantern:'M12 15 27 7 42 15ZM17 16V29H37V16ZM26 30V37M18 39H36'});
window.YSHCreator={create(host){
 const independent=typeof location!=='undefined'&&new URLSearchParams(location.search).has('tryout');
 const A=window.YSHCreatorArt,key='yinshanhe.creator.v1'+(independent?'.tryout':''),W=A.W,D=A.D,CW=1024,CH=672;
 let plan=A.normalize({items:[],title:'我的山河'}),storageOK=true,selected=null,placing=null,mode='print',editing=false,drag=null,sliderBefore=null;
 let history=[],future=[],nextId=Date.now(),raf=0,notice='先选一种纹样，再点版面落下。';
 let activeType='mountain',placingTemplate=null,revision=0,checked=-1,validation=null,styleStamp='',hoverPoint=null;
 let imageCacheKey='',imageCache=[];
 const picked={},variants=type=>A.VARIANTS?.[type]||[{id:'default',label:names[type],note:''}];
 const variantName=item=>variants(item.type).find(v=>v.id===item.variant)?.label||names[item.type];
 const layerOf=type=>A.layerOf?A.layerOf(type):({water:0,mountain:0,rock:0,tree:1,reeds:1,house:2,boat:2,lantern:2}[type]);
 const shadeCanvases=Array.from({length:3},()=>document.createElement('canvas'));
 try{const raw=localStorage.getItem(key);if(raw){if(raw.length>64000)throw new Error('draft too large');const saved=JSON.parse(raw);if(!Array.isArray(saved?.items)||saved.items.length>24||saved.items.some(i=>Array.isArray(i?.points)&&i.points.length>9))throw new Error('invalid draft');plan=A.normalize(saved);}}catch{storageOK=false;}
 const shell=document.createElement('section');shell.id='creator-editor';shell.hidden=true;shell.setAttribute('aria-label','自由制版工作台');
 shell.innerHTML=`<header class="create-header"><a href="index.html#workshop" class="create-brand"><b>山<br>河</b><span>一印山河<small>自由制版 · DEMO</small></span></a><span class="create-route"><strong>01 拼版</strong><i>—</i>02 套印<i>—</i>03 成景</span><a class="create-back" href="index.html#workshop">回到教学印坊 ↗</a></header>
 <div class="create-heading"><div><p>先有心中山水，再有纸上天地</p><h1>这一版，由你来刻。</h1></div><div class="create-history"><button id="create-undo" title="Ctrl+Z">撤销</button><button id="create-redo" title="Ctrl+Shift+Z">重做</button><button id="create-sample">试摆一幅</button><button id="create-village">竹林小居</button><button id="create-clear">清空版面</button></div></div>
 <div class="create-workspace"><aside class="create-library"><h2>拾取纹样</h2><p>选类别，挑样式，再落版</p><div class="create-types">${A.TYPES.map(t=>`<button data-type="${t}" aria-label="放置${names[t]}" aria-pressed="false"><svg viewBox="0 0 55 44" aria-hidden="true"><path d="${icons[t]}"/></svg><span>${names[t]}</span></button>`).join('')}</div><div class="create-styles" id="create-styles" aria-label="素材样式"></div><span class="create-limit" id="create-limit"></span></aside>
 <main class="create-center"><div class="create-viewbar"><span id="create-view-caption">构图 · 印稿正面</span><div><button id="create-view-print" aria-pressed="true">看印稿</button><button id="create-view-wood" aria-pressed="false">看反刻木版</button></div></div><div class="create-board"><canvas id="create-canvas" width="1024" height="672" aria-label="自由拼版画布，点选素材后在此放置，拖动已有纹样调整位置" tabindex="0"></canvas></div><p id="create-feedback" class="create-feedback" role="status" aria-live="polite"></p><div class="create-layers">${['山水版','林影版','人家版'].map((name,i)=>`<div><canvas id="create-layer-${i}" width="240" height="157" aria-label="${name}预览"></canvas><span><b>${['壹','贰','叁'][i]} ${name}</b><small id="create-layer-count-${i}"></small></span></div>`).join('')}</div></main>
 <aside class="create-inspector"><label class="create-title-label" for="create-title">为作品题名</label><input id="create-title" maxlength="20" autocomplete="off" aria-label="作品题名"><div id="create-selection"></div><div class="create-palette"><h2>三版墨色</h2>${[['石青','#567a78','#506b8b','#6c775b'],['苍绿','#647a47','#3f6b5e','#91834e'],['朱砂','#a35338','#825b46','#754b5e']].map((row,i)=>`<div><span>${row[0]}</span>${row.slice(1).map((c,n)=>`<button data-palette="${i}" data-color="${c}" aria-label="${row[0]}墨色 ${n+1}" style="--pigment:${c}"></button>`).join('')}</div>`).join('')}</div><div class="create-advice"><strong>让构图留一点呼吸。</strong><p>山与树可以叠放；船落在水上，房屋安在平地。留白，也属于你的画。</p><p>选中河道后，拖动白色圆点改河形。</p></div></aside></div>
 <footer class="create-footer"><div><strong id="create-ready"></strong><small id="create-storage"></small></div><div><button id="create-preview">立体小样 ↗</button><button id="create-print">制成木版，去套印 →</button></div></footer>`;
 document.getElementById('experience').appendChild(shell);
 const $=id=>document.getElementById(id),canvas=$('create-canvas'),ctx=canvas.getContext('2d');
 const current=()=>plan.items.find(i=>i.id===selected);
 const xid=x=>(x/W+.5)*CW,zid=z=>(z/D+.5)*CH;
 function snapshot(){return copy(plan);}
 function changed(){revision++;}
 function checkedPlan(){if(checked!==revision){validation=A.validate(plan);checked=revision;}return validation;}
 function push(before){if(JSON.stringify(before)===JSON.stringify(plan))return;history.push(before);if(history.length>40)history.shift();future=[];persist();}
 function persist(){try{localStorage.setItem(key,JSON.stringify(plan));storageOK=true;}catch{storageOK=false;}}
 function settle(before,message,allowInvalid=false){
  plan=A.normalize(plan);changed();const result=checkedPlan(),old=A.validate(before);
  const oldKeys=new Set(old.issues.filter(i=>i.id).map(i=>i.id+'|'+i.reason));
  const problem=result.issues.find(i=>i.id&&!oldKeys.has(i.id+'|'+i.reason));
  if(!allowInvalid&&problem){plan=before;changed();notice=problem.reason+' 已保留原来的构图。';refresh();return false;}
  push(before);notice=message||notice;refresh();return true;
 }
 function commit(fn,message,allowInvalid=false){const before=snapshot();fn();return settle(before,message,allowInvalid);}
 function point(e){const b=canvas.getBoundingClientRect();let x=((e.clientX-b.left)/b.width-.5)*W;const z=((e.clientY-b.top)/b.height-.5)*D;return {x:mode==='wood'?-x:x,z};}
 function onSheet(p){return Math.abs(p.x)<=W/2&&Math.abs(p.z)<=D/2;}
 function localToWorld(item,p){const a=item.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:item.x+(p.x*c-p.z*s)*item.scale,z:item.z+(p.x*s+p.z*c)*item.scale};}
 function worldToLocal(item,p){const a=item.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=p.x-item.x,dz=p.z-item.z;return {x:(dx*c+dz*s)/item.scale,z:(-dx*s+dz*c)/item.scale};}
 function updateButtons(){
  const v=checkedPlan();$('create-undo').disabled=!history.length;$('create-redo').disabled=!future.length;$('create-clear').disabled=!plan.items.length;
  $('create-print').disabled=!v.ok;$('create-preview').disabled=!v.ok;
  $('create-limit').textContent='已放置 '+plan.items.length+' 个 · 最多 24 个';
  $('create-storage').textContent=storageOK?(independent?'独立试摆草稿 · 原作品保持不变':'草稿保存在此浏览器 · 可随时回来改版'):'浏览器未能保存草稿 · 请保持本页打开';
  $('create-ready').textContent=!plan.items.length?'从一张空白开始。':v.ok?`已分成 ${v.layers.filter(n=>n>0).length} 块色版 · 接下来亲手上墨、刷印`:(v.issues[0]?.reason||'请调整构图');
  $('create-ready').classList.toggle('invalid',plan.items.length>0&&!v.ok);
  for(let i=0;i<3;i++)$('create-layer-count-'+i).textContent=v.layers[i]?v.layers[i]+' 枚纹样':'留白 · 无需套印';
  shell.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===placing)));
  shell.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('browsing',b.dataset.type===activeType));
  shell.querySelectorAll('[data-place-style]').forEach(b=>b.setAttribute('aria-pressed',String(placing===activeType&&b.dataset.placeStyle===(picked[activeType]||variants(activeType)[0].id))));
  shell.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(plan.palette[+b.dataset.palette]===b.dataset.color)));
  canvas.style.cursor=placing?'crosshair':drag?'grabbing':'grab';
  const movingIssue=(drag||sliderBefore)?v.issues.find(i=>i.id):null;
  $('create-feedback').textContent=movingIssue?movingIssue.reason+' 松手会回到调整前的位置。':notice;
  $('create-feedback').classList.toggle('invalid',!!movingIssue);
 }
 function styles(){
  const stamp=activeType+'|'+plan.palette.join(',');if(stamp===styleStamp)return;styleStamp=stamp;
  $('create-styles').innerHTML='<h2>'+names[activeType]+'的样式</h2>'+variants(activeType).map(v=>`<button data-place-style="${esc(v.id)}" aria-label="放置${esc(v.label)}" aria-pressed="false"><canvas width="128" height="76" aria-hidden="true"></canvas><span>${esc(v.label)}<small>${esc(v.note||'点选后落版')}</small></span></button>`).join('');
  shell.querySelectorAll('[data-place-style]').forEach(b=>{
   const q=A.defaults(activeType,'preview',0,0,b.dataset.placeStyle);q.variant=b.dataset.placeStyle;
   const layers=A.drawLayers({items:[q],palette:plan.palette},512,336),out=b.querySelector('canvas'),g=out.getContext('2d'),box=A.bounds(q);
   const cx=(box.minX+box.maxX)/2,cz=(box.minZ+box.maxZ)/2,sx=Math.max(box.maxX-box.minX+.35,(box.maxZ-box.minZ+.3)*128/76),sz=sx*76/128;
   g.fillStyle='#e8dfc8';g.fillRect(0,0,128,76);g.drawImage(layers[layerOf(q.type)],(cx-sx/2+W/2)/W*512,(cz-sz/2+D/2)/D*336,sx/W*512,sz/D*336,0,0,128,76);
  });
 }
 function inspector(){
  const item=current();if(document.activeElement!==$('create-title'))$('create-title').value=plan.title;styles();
  if(!item){$('create-selection').innerHTML='<div class="create-empty-selection"><span>选一枚纹样</span><p>放下后可拖动、调大小与朝向。也可以先「试摆一幅」，再改成自己的构图。</p></div>';return;}
  const slider=(prop,name,min,max,step,value,suffix='')=>`<label class="create-slider">${name}<output id="create-out-${prop}">${value}${suffix}</output><input aria-label="${name}" type="range" data-prop="${prop}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  const choices=variants(item.type);
  $('create-selection').innerHTML=`<div class="create-selected-heading"><h2>正在雕琢 · ${esc(variantName(item))}</h2><span>拖动移动 · 不合适的落位会退回</span></div>${choices.length>1?`<div class="create-variant-choices">${choices.map(v=>`<button data-swap-style="${esc(v.id)}" aria-label="改为${esc(v.label)}" aria-pressed="${v.id===item.variant}">${esc(v.label)}</button>`).join('')}<button id="create-cycle">换一式 ↻</button></div>`:''}${slider('scale','大小',.55,1.6,.01,item.scale)}${slider('rotation','朝向',-180,180,1,item.rotation,'°')}${item.type==='mountain'?slider('height','山高',.6,2.6,.05,item.height):''}${item.type==='water'?slider('width','河宽',.25,1.1,.01,item.width):''}<div class="create-item-actions"><button id="create-copy">复制一枚</button><button id="create-delete">移除</button></div><p class="create-key-tip">方向键微调 · Delete 移除</p>`;
 }
 function draw(){
  raf=0;const working=!!(drag||sliderBefore),rw=working?640:CW,rh=working?420:CH;
  const imageKey=revision+'|'+rw;if(imageKey!==imageCacheKey){imageCache=A.drawLayers(plan,rw,rh,{lowDetail:working,canvases:imageCache});imageCacheKey=imageKey;}
  const images=imageCache;ctx.clearRect(0,0,CW,CH);ctx.drawImage(mode==='wood'?host.blockBase:host.paperBase,0,0,CW,CH);
  ctx.save();if(mode==='wood'){ctx.translate(CW,0);ctx.scale(-1,1);}
  images.forEach((c,i)=>{if(mode==='wood'){const shade=shadeCanvases[i];if(shade.width!==rw||shade.height!==rh){shade.width=rw;shade.height=rh;}const s=shade.getContext('2d');s.globalCompositeOperation='source-over';s.clearRect(0,0,rw,rh);s.drawImage(c,0,0);s.globalCompositeOperation='source-in';s.fillStyle='#553920';s.fillRect(0,0,rw,rh);ctx.save();ctx.shadowColor='#ffdeb078';ctx.shadowBlur=0;ctx.shadowOffsetY=2;ctx.drawImage(shade,0,0,CW,CH);ctx.restore();}else ctx.drawImage(c,0,0,CW,CH);});
  if(!plan.items.length){ctx.fillStyle=mode==='wood'?'#efd3a5':'#778578';ctx.textAlign='center';ctx.font='30px SimSun,serif';ctx.fillText('先落一座山，或留一湾水。',CW/2,CH/2-8);ctx.font='17px Microsoft YaHei,sans-serif';ctx.fillText('选左侧纹样，再点这里放下',CW/2,CH/2+32);}
  const item=current();if(item){const b=A.bounds(item),invalid=checkedPlan().issues.length>0;ctx.strokeStyle=invalid?'#ae4634':'#a87c35';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.strokeRect(xid(b.minX)-6,zid(b.minZ)-6,(b.maxX-b.minX)/W*CW+12,(b.maxZ-b.minZ)/D*CH+12);ctx.setLineDash([]);
   if(item.type==='water')for(const p of item.points){const w=localToWorld(item,p);ctx.beginPath();ctx.arc(xid(w.x),zid(w.z),8,0,Math.PI*2);ctx.fillStyle='#faf4dd';ctx.fill();ctx.strokeStyle='#375f55';ctx.stroke();}
  }
  if(placing&&hoverPoint){const q=placingTemplate?copy(placingTemplate):A.defaults(placing,'ghost',0,0,picked[placing]||variants(placing)[0].id);q.x=hoverPoint.x;q.z=hoverPoint.z;const b=A.bounds(q);ctx.fillStyle='#7f946019';ctx.strokeStyle='#687e54';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.fillRect(xid(b.minX),zid(b.minZ),(b.maxX-b.minX)/W*CW,(b.maxZ-b.minZ)/D*CH);ctx.strokeRect(xid(b.minX),zid(b.minZ),(b.maxX-b.minX)/W*CW,(b.maxZ-b.minZ)/D*CH);ctx.setLineDash([]);}
  ctx.restore();
  for(let i=0;i<3;i++){const c=$('create-layer-'+i),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.fillStyle='#e9dec0';g.fillRect(0,0,c.width,c.height);g.drawImage(images[i],0,0,c.width,c.height);}
  updateButtons();
 }
 function refresh(selection=true){if(selection)inspector();if(!raf)raf=requestAnimationFrame(draw);if(!drag&&!sliderBefore)updateButtons();}
 function cancelMove(){if(drag){plan=drag.before;drag=null;changed();}hoverPoint=null;}
 function undo(){cancelMove();if(!history.length){refresh();return;}future.push(snapshot());plan=history.pop();changed();selected=null;placing=null;placingTemplate=null;persist();notice='已撤销这一步。';refresh();}
 function redo(){cancelMove();if(!future.length){refresh();return;}history.push(snapshot());plan=future.pop();changed();selected=null;persist();notice='已重做这一步。';refresh();}
 shell.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.type){activeType=b.dataset.type;placing=placing===activeType?null:activeType;placingTemplate=null;selected=null;notice=placing?'挑一个样式，再在版面点一下放下。':'已取消放置。';refresh();return;}
  if(b.dataset.placeStyle){picked[activeType]=b.dataset.placeStyle;placing=activeType;placingTemplate=null;selected=null;notice='已选 '+variants(activeType).find(v=>v.id===picked[activeType]).label+'，在版面点一下放下。';refresh();return;}
  if(b.dataset.swapStyle){swapStyle(b.dataset.swapStyle);return;}
  if(b.dataset.palette!==undefined){commit(()=>plan.palette[+b.dataset.palette]=b.dataset.color,'墨色已更换，木版与成景会一起变化。');return;}
  switch(b.id){
   case 'create-undo':undo();break;case 'create-redo':redo();break;
   case 'create-sample':case 'create-village':commit(()=>{plan=A.samplePlan(b.id==='create-village'?'village':'river');selected=null;placing=null;placingTemplate=null;},'试摆了一幅山水。点选任一纹样，把它改成自己的。');break;
   case 'create-clear':commit(()=>{plan.items=[];selected=null;placing=null;placingTemplate=null;},'已清空。可按撤销找回刚才的构图。',true);break;
   case 'create-copy':if(current()){if(plan.items.length>=24){notice='已放满24个，请先移除一个。';refresh(false);break;}placingTemplate=copy(current());activeType=placing=current().type;picked[activeType]=current().variant;notice='已拾取这一枚。点空闲位置放下副本，Esc 取消。';selected=null;refresh();}break;
   case 'create-cycle':if(current()){const list=variants(current().type),index=list.findIndex(v=>v.id===current().variant);swapStyle(list[(index+1)%list.length].id);}break;
   case 'create-delete':remove();break;
   case 'create-view-print':mode='print';viewChanged();break;case 'create-view-wood':mode='wood';viewChanged();break;
   case 'create-print':finish('print');break;case 'create-preview':finish('preview');break;
  }
 });
 function swapStyle(variant){if(!current())return;commit(()=>{current().variant=variant;},'样式已换，位置、大小与朝向保持原样。');}
 function viewChanged(){hoverPoint=null;notice=mode==='wood'?'这是反刻的木版，印到纸上会左右翻转。':'这是最终印稿的方向。';$('create-view-caption').textContent=mode==='wood'?'制版 · 左右反刻':'构图 · 印稿正面';$('create-view-print').setAttribute('aria-pressed',String(mode==='print'));$('create-view-wood').setAttribute('aria-pressed',String(mode==='wood'));refresh(false);}
 function remove(){if(!current())return;commit(()=>{plan.items=plan.items.filter(i=>i.id!==selected);selected=null;},'已移除纹样。可撤销恢复。',true);}
 $('create-title').addEventListener('change',e=>commit(()=>plan.title=e.target.value.trim()||'我的山河','题名已保存。'));
 shell.addEventListener('input',e=>{if(!e.target.dataset.prop||!current())return;sliderBefore??=snapshot();current()[e.target.dataset.prop]=+e.target.value;changed();$('create-out-'+e.target.dataset.prop).textContent=e.target.value+(e.target.dataset.prop==='rotation'?'°':'');notice='微调中；松手后保存。';refresh(false);});
 shell.addEventListener('change',e=>{if(e.target.dataset.prop&&sliderBefore){const before=sliderBefore;sliderBefore=null;settle(before,'调整已保存。');}});
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const p=point(e);if(!onSheet(p))return;canvas.focus();
  if(placing){if(plan.items.length>=24){notice='这一版最多容纳24枚纹样，先移除一枚再添加。';refresh(false);return;}
   const type=placing,before=snapshot(),template=placingTemplate,q=template?copy(template):A.defaults(type,'piece-'+(++nextId),p.x,p.z,picked[type]||variants(type)[0].id);
   q.id='piece-'+(++nextId);q.x=p.x;q.z=p.z;if(!template)q.variant=picked[type]||variants(type)[0].id;plan.items.push(q);selected=q.id;placing=null;placingTemplate=null;
   if(!settle(before,variantName(q)+'已落版。拖动调整位置，或用「换一式」比较造型。')){selected=null;placing=type;placingTemplate=template;refresh();}return;
  }
  const item=current();if(item?.type==='water'){const handle=item.points.findIndex(h=>{const w=localToWorld(item,h);return Math.hypot(w.x-p.x,w.z-p.z)<.17;});if(handle>=0){drag={kind:'handle',index:handle,before:snapshot()};canvas.setPointerCapture(e.pointerId);return;}}
  const candidates=A.drawOrder?A.drawOrder(plan).slice().reverse():[...plan.items].reverse().sort((a,b)=>({water:0,mountain:1,rock:2,tree:3,reeds:4,house:5,boat:6,lantern:7}[b.type]-({water:0,mountain:1,rock:2,tree:3,reeds:4,house:5,boat:6,lantern:7}[a.type])));
  const found=candidates.find(i=>A.hitTest(i,p.x,p.z));selected=found?.id||null;
  if(found){activeType=found.type;drag={kind:'move',before:snapshot(),x:p.x,z:p.z,startX:found.x,startZ:found.z};canvas.setPointerCapture(e.pointerId);notice='拖动调整位置；松开保存这一笔。';}refresh();
 });
 canvas.addEventListener('pointermove',e=>{if(placing){hoverPoint=point(e);refresh(false);return;}if(!drag||!current())return;const p=point(e),item=current();
  if(drag.kind==='move'){item.x=Math.max(-W/2+.3,Math.min(W/2-.3,drag.startX+p.x-drag.x));item.z=Math.max(-D/2+.3,Math.min(D/2-.3,drag.startZ+p.z-drag.z));}
  else{const q=worldToLocal(item,p);item.points[drag.index]={x:Math.max(-W,Math.min(W,q.x)),z:Math.max(-D,Math.min(D,q.z))};}changed();refresh(false);
 });
 canvas.addEventListener('pointerleave',()=>{hoverPoint=null;if(placing)refresh(false);});
 function endDrag(e){if(!drag)return;const before=drag.before;drag=null;if(e?.type==='pointercancel'){plan=before;changed();notice='本次拖动已取消。';refresh();return;}const moved=JSON.stringify(before)!==JSON.stringify(plan);settle(before,moved?'位置已保存。':'已选中纹样。可拖动，或换一个样式。');}
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,endDrag);
 document.addEventListener('keydown',e=>{if(!editing||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if(e.key==='Escape'){if(drag){plan=drag.before;drag=null;changed();}placing=null;placingTemplate=null;selected=null;notice='已取消当前操作。';refresh();return;}
  if(drag&&['Delete','Backspace','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();return;}
  if(['Delete','Backspace'].includes(e.key)&&current()){e.preventDefault();remove();return;}
  if(current()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const d=e.shiftKey?.15:.04,dx=mode==='wood'?-d:d;commit(()=>{const i=current();if(e.key==='ArrowLeft')i.x-=dx;if(e.key==='ArrowRight')i.x+=dx;if(e.key==='ArrowUp')i.z-=d;if(e.key==='ArrowDown')i.z+=d;},'位置已微调。');}
 });
 function setStudioInert(value){for(const child of shell.parentElement.children)if(child!==shell)child.inert=value;}
 function finish(action){if(!A.validate(plan).ok)return;persist();try{host[action](copy(plan));editing=false;shell.hidden=true;setStudioInert(false);document.body.classList.remove('creating');document.body.classList.add('custom-printing');}catch(e){notice='暂时无法生成：'+e.message;refresh(false);}}
 function open(){host.pause();editing=true;placing=null;placingTemplate=null;drag=null;shell.hidden=false;setStudioInert(true);document.body.classList.add('creating');notice=plan.items.length?'草稿还在。点选纹样可换样式，或继续添加。':'先选一种纹样，再挑个样式落下。';refresh();}
 return {open,get editing(){return editing;},getState(){return {editing,itemCount:plan.items.length,selected,placing,mode,valid:A.validate(plan).ok};}};
}};
})();
