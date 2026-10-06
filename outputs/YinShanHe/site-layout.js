/* Shared dimensions for circulation, building pads, terrain cuts and plant clearance. */
'use strict';
(() => {
function create(T, material) {
  const group=new T.Group();group.name='planned-mountain-settlement';
  const surfaces=[],buildings=[],reservations=[],walks=[];
  const stone=material('#b7b49c','paving'),wall=material('#858b78','masonry');
  const coping=material('#c6c3a8','cut-stone'),red=material('#ac5536','plaster');
  const timber=material('#735338','timber'),railWood=material('#804c34','timber');
  const roof=material('#3e5752','roof-tile'),metal=material('#5e6855','bronze');
  let seed=4101;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const mesh=(geo,mat,name)=>{const o=new T.Mesh(geo,mat);o.name=name;group.add(o);return o;};
  function box(w,h,d,x,y,z,mat,name){const o=mesh(new T.BoxGeometry(w,h,d),mat,name);o.position.set(x,y,z);return o;}
  function cylinder(rt,rb,h,x,y,z,mat,name,n=12){const o=mesh(new T.CylinderGeometry(rt,rb,h,n),mat,name);o.position.set(x,y,z);return o;}
  function tube(points,r,mat,name){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*3),r,7,false),mat,name);}
  function rect(name,x0,x1,z0,z1,y,depth=.16){
    const r={name,x0,x1,z0,z1,y,depth};surfaces.push(r);reservations.push(r);
    // The paving owns the top surface; the structural box ends below it.
    box(x1-x0,depth-.035,z1-z0,(x0+x1)/2,y-(depth+.035)/2,(z0+z1)/2,wall,name+'-closed-foundation');
    box(x1-x0+.012,.035,z1-z0+.012,(x0+x1)/2,y-.0175,(z0+z1)/2,stone,name+'-paving');
    return r;
  }
  function segment(name,a,b,width,stairs=false){
    const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,px=-uz,pz=ux;
    const s={name,a,b,width,stairs,len};walks.push(s);
    if(!stairs){
      const dy=b[1]-a[1];const o=box(width,.13,Math.hypot(len,dy)+.012,(a[0]+b[0])/2,(a[1]+b[1])/2-.065,(a[2]+b[2])/2,stone,name+'-slab');o.rotation.set(-Math.atan2(dy,len),Math.atan2(dx,dz),0);
      return s;
    }
    const count=Math.ceil((b[1]-a[1])/.061),rise=(b[1]-a[1])/count,run=len/count;
    s.steps=count;s.rise=rise;s.run=run;
    function stairProfile(extra,widthAt,offset,mat,suffix){
      const sh=new T.Shape();sh.moveTo(0,a[1]-.021+extra);
      for(let i=0;i<count;i++){sh.lineTo(i*run,a[1]+(i+1)*rise-.021+extra);sh.lineTo((i+1)*run,a[1]+(i+1)*rise-.021+extra);}
      sh.lineTo(len,b[1]-.20);sh.lineTo(0,a[1]-.20);sh.closePath();
      const g=new T.ExtrudeGeometry(sh,{depth:widthAt,bevelEnabled:false,curveSegments:1});
      const m=new T.Matrix4().makeBasis(new T.Vector3(ux,0,uz),new T.Vector3(0,1,0),new T.Vector3(px,0,pz));
      m.setPosition(a[0]+px*offset,0,a[2]+pz*offset);g.applyMatrix4(m);
      mesh(g,mat,name+suffix);
    }
    stairProfile(0,width,-width/2,wall,'-closed-stone-stringer');
    for(let i=0;i<count;i++){
      const v=(i+.5)/count,y=a[1]+(i+1)*rise;
      const o=box(width,.022,run+.002,a[0]+dx*v,y-.011,a[2]+dz*v,coping,name+'-tread-'+i);o.rotation.y=Math.atan2(dx,dz);
      // Nosing is a separate, restrained chamfer-like strip; no rock texture on steps.
      const edge=box(width,.014,.014,a[0]+dx*(i/count),y-.010,a[2]+dz*(i/count),stone,name+'-nosing-'+i);edge.rotation.y=o.rotation.y;
    }
    stairProfile(.13,.044,-width/2-.044,wall,'-left-parapet');
    stairProfile(.13,.044,width/2,wall,'-right-parapet');
    return s;
  }
  // The bridge ends on level, usable bank plazas. The first stair starts well west.
  const bridge={west:[-.58,.22,1.68],east:[1.10,.22,1.68],width:.52,rise:.22};
  rect('west-bank-plaza',-1.70,-.55,1.22,2.13,.22,.21);
  rect('east-bank-courtyard',1.08,3.73,.15,2.15,.22,.21);
  rect('lower-trail-landing',-3.79,-3.07,1.25,2.03,.22,.22);
  segment('level-bank-path',[-1.60,.22,1.68],[-3.43,.22,1.68],.50);
  const f1=segment('first-flight',[-3.43,.22,1.25],[-3.43,1.02,-.70],.48,true);
  rect('first-rest-terrace',-3.79,-2.38,-1.31,-.70,1.02,.38);
  const f2=segment('second-flight',[-2.68,1.02,-.70],[-2.68,1.82,1.0],.48,true);
  rect('second-rest-terrace',-3.02,-1.42,1.0,1.59,1.82,.38);
  const f3=segment('third-flight',[-1.74,1.82,1.0],[-1.74,2.62,-.05],.48,true);
  const upper=rect('temple-forecourt',-2.18,.10,-2.32,-.05,2.62,.22);
  const templeSpec={x:-1.07,y:2.62,z:-1.37,scale:1.10};
  const lowerSpec={x:2.78,y:.22,z:.88,scale:.80};
  for(const [name,p] of [['upper-temple',templeSpec],['tea-courtyard',lowerSpec]]){
    const model=window.YSHArchitecture.createTemple(T,{material});model.name=name;model.position.set(p.x,p.y,p.z);model.scale.setScalar(p.scale);group.add(model);
    model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model);
    buildings.push({name,x0:b.min.x,x1:b.max.x,z0:b.min.z,z1:b.max.z,y0:b.min.y,y1:b.max.y});
  }
  // A closed wooden arch with attached beams and abutments, no rail across its ends.
  const [bx,by,bz]=bridge.west,length=bridge.east[0]-bx,n=30;
  const deckY=t=>by+Math.sin(t*Math.PI)*bridge.rise;
  for(let i=0;i<n;i++){
    const t=(i+.5)/n,y=deckY(t),angle=Math.atan(bridge.rise*Math.PI*Math.cos(t*Math.PI)/length);
    const o=box((length/n+.003)/Math.cos(angle),.044,bridge.width,bx+length*t,y-.022,bz,timber,'bridge-board-'+i);
    o.rotation.z=angle;
  }
  for(const side of [-1,1]){
    const z=bz+side*(bridge.width/2+.014),points=[],beam=[];
    for(let i=0;i<=n;i++){const t=i/n;points.push([bx+length*t,deckY(t)+.23,z]);beam.push([bx+length*t,deckY(t)-.07,z]);}
    tube(points,.021,railWood,'bridge-continuous-handrail');tube(beam,.027,timber,'bridge-underbeam');
    for(let i=0;i<=8;i++){const t=i/8;box(.027,.245,.027,bx+length*t,deckY(t)+.105,z,railWood,'bridge-baluster');}
  }
  for(const x of [bridge.west[0],bridge.east[0]])box(.16,.28,.68,x,.08,bz,wall,'bridge-stone-abutment');
  // Boundary walls leave a measured opening opposite the final stair and gate.
  function boundary(x0,x1,z,y){box(x1-x0,.29,.09,(x0+x1)/2,y+.145,z,red,'courtyard-boundary-wall');box(x1-x0+.015,.045,.145,(x0+x1)/2,y+.31,z,roof,'courtyard-wall-coping');}
  boundary(-2.18,-2.05,-.08,2.62);boundary(-1.40,.10,-.08,2.62);boundary(-2.18,.10,-2.28,2.62);
  for(const x of [-2.135,.055])box(.09,.29,2.17,x,2.765,-1.16,red,'courtyard-side-wall');
  // Railings at exposed rest terraces leave both stair mouths unobstructed.
  function railing(x0,x1,z,y){for(let i=0;i<=5;i++){const x=x0+(x1-x0)*i/5;box(.032,.24,.032,x,y+.12,z,timber,'terrace-rail-post');}box(x1-x0+.03,.028,.033,(x0+x1)/2,y+.24,z,timber,'terrace-top-rail');}
  railing(-3.75,-2.42,-1.27,1.02);railing(-2.98,-1.46,1.55,1.82);
  // A quay, lanterns, benches, well and incense vessel give places a purpose.
  rect('landing-quay',1.02,1.48,2.36,2.91,.14,.16);
  segment('quay-approach',[1.29,.22,2.13],[1.29,.14,2.36],.38);
  for(const z of [2.42,2.84])for(const x of [1.06,1.44])cylinder(.022,.027,.25,x,.045,z,timber,'quay-pile');
  function lantern(x,y,z){
    box(.17,.08,.17,x,y+.04,z,wall,'lantern-plinth');box(.046,.26,.046,x,y+.20,z,timber,'lantern-post');
    box(.13,.14,.13,x,y+.36,z,material('#d3b16d','lantern-paper'),'lantern-body');
    box(.17,.03,.17,x,y+.447,z,roof,'lantern-cap');box(.14,.025,.14,x,y+.28,z,timber,'lantern-base');
    for(const dx of [-.067,.067])for(const dz of [-.067,.067])box(.009,.15,.009,x+dx,y+.365,z+dz,timber,'lantern-frame');
  }
  lantern(-1.15,.22,2.02);lantern(1.53,.22,1.23);lantern(-.13,2.62,-2.10);
  function bench(x,y,z,w=.48){box(w,.035,.15,x,y+.17,z,timber,'bench-seat');for(const dx of [-w*.34,w*.34])box(.045,.15,.10,x+dx,y+.075,z,wall,'bench-leg');}
  bench(-.34,2.62,-.29);bench(3.15,.22,1.98,.55);
  cylinder(.16,.19,.13,3.48,.285,.38,wall,'courtyard-well-base',20);
  const well=new T.Mesh(new T.TorusGeometry(.14,.033,8,24),coping);well.rotation.x=Math.PI/2;well.position.set(3.48,.36,.38);well.name='well-rim';group.add(well);
  cylinder(.115,.115,.01,3.48,.344,.38,material('#355957','water'),'well-water',20);
  cylinder(.092,.06,.095,-.44,2.75,-.43,metal,'incense-bowl',20);
  for(const dx of [-.048,.048])box(.016,.07,.016,-.44+dx,2.67,-.43,metal,'incense-feet');
  // A small tea stop beside the quay, attached to the lower courtyard.
  rect('tea-stop-patio',1.80,2.68,2.13,2.79,.22,.16);
  const teaX=2.30,teaZ=2.53;
  for(const dx of [-.25,.25])for(const dz of [-.15,.15])box(.025,.42,.025,teaX+dx,.43,teaZ+dz,timber,'tea-shed-post');
  const canopyGeo=new T.PlaneGeometry(.68,.45,12,8),cp=canopyGeo.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getY(i);cp.setXYZ(i,x,.665-.065*Math.pow(x/.34,2),z);}
  const ci=canopyGeo.index.array;for(let i=0;i<ci.length;i+=3){const t=ci[i+1];ci[i+1]=ci[i+2];ci[i+2]=t;}canopyGeo.computeVertexNormals();
  const canvasMat=material('#b6aa75','cloth');canvasMat.side=T.DoubleSide;
  const canopy=mesh(canopyGeo,canvasMat,'tea-shed-cloth-canopy');canopy.position.set(teaX,0,teaZ);
  box(.51,.03,.25,teaX,.44,teaZ,timber,'tea-table');
  for(const dx of [-.18,.18])for(const dz of [-.075,.075])box(.025,.21,.025,teaX+dx,.325,teaZ+dz,timber,'tea-table-leg');
  cylinder(.035,.028,.058,teaX,.483,teaZ,material('#6c7156','ceramic'),'tea-pot',16);
  cylinder(.038,.036,.012,teaX,.518,teaZ,metal,'tea-pot-lid',16);
  for(const dx of [-.10,.10])cylinder(.022,.015,.022,teaX+dx,.465,teaZ+.04,coping,'tea-cup',12);
  tube([[1.06,.21,2.42],[.64,.11,2.36],[.21,.105,2.31],[-.16,.19,2.263]],.006,material('#8b805c','rope'),'boat-mooring-rope');
  cylinder(.018,.018,.055,1.06,.205,2.42,timber,'mooring-bollard');
  // Reserve walkways and building envelopes before any vegetation is generated.
  function distanceTo(s,x,z){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(s.len*s.len)));return {distance:Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz),t};}
  const riverNodes=[[-3.06,.72,.59],[-2.4,.63,.62],[-1.6,.81,.65],[-.8,.95,.80],[0,.78,1.10],[.9,.33,1.22],[1.68,.26,1.62],[2.4,.3,1.50],[3.06,.51,1.3]];
  function riverAt(z){let i=0;while(i<riverNodes.length-2&&z>riverNodes[i+1][0])i++;const a=riverNodes[i],b=riverNodes[i+1],t=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0])));return {x:a[1]+(b[1]-a[1])*t,width:a[2]+(b[2]-a[2])*t};}
  function inRect(r,x,z,margin=0){return x>=r.x0-margin&&x<=r.x1+margin&&z>=r.z0-margin&&z<=r.z1+margin;}
  function terrainCeiling(x,z){
    const river=riverAt(z);let ceiling=Math.abs(x-river.x)<river.width/2+.065?-.055:Infinity;
    // Keep a clear band around exposed foundation faces. Within the pad, bedrock
    // may enter only the concealed bottom 15 mm, never the visible stone courses.
    for(const r of surfaces)if(inRect(r,x,z,.15))ceiling=Math.min(ceiling,r.y-r.depth+(inRect(r,x,z,-.06)?.015:-.045));
    for(const s of walks){const q=distanceTo(s,x,z);if(q.distance<s.width/2+.20)ceiling=Math.min(ceiling,s.a[1]+(s.b[1]-s.a[1])*q.t-.23);}
    return ceiling;
  }
  function canPlant(x,z,radius){
    const river=riverAt(z);if(Math.abs(x-river.x)<river.width/2+radius+.08)return false;
    if(surfaces.some(r=>inRect(r,x,z,radius+.08)))return false;
    if(buildings.some(r=>inRect(r,x,z,radius+.10)))return false;
    return !walks.some(s=>distanceTo(s,x,z).distance<s.width/2+radius+.10);
  }
  function addTerrainSupports(surface){
    // Only add piers where the closed stair slab has a genuine gap above bedrock.
    for(const s of walks.filter(s=>s.stairs))for(let i=1;i<=3;i++){
      const t=i/4,x=s.a[0]+(s.b[0]-s.a[0])*t,z=s.a[2]+(s.b[2]-s.a[2])*t;
      const top=s.a[1]+(s.b[1]-s.a[1])*t-.16,bottom=surface(x,z)-.035;
      if(top-bottom>.16)box(.30,top-bottom,.23,x,(top+bottom)/2,z,wall,s.name+'-bedrock-support-'+i);
    }
  }
  const routes=[
    {name:'bridge-to-stair',points:[bridge.west,[-1.65,.22,1.68],[-3.43,.22,1.68],f1.a]},
    {name:'first-turn',points:[f1.b,[-3.43,1.02,-1.0],[-2.68,1.02,-1.0],f2.a]},
    {name:'second-turn',points:[f2.b,[-2.68,1.82,1.29],[-1.74,1.82,1.29],f3.a]},
    {name:'temple-approach',points:[f3.b,[-1.74,2.62,-.44]]}
  ];
  return {group,bridge,walks,surfaces,buildings,routes,templeSpec,lowerSpec,riverAt,terrainCeiling,canPlant,distanceTo,addTerrainSupports,stats:{flights:3,landings:3},waterY:.05};
}
window.YSHSite={create};
})();
