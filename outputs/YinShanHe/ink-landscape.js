/* Original 3D study: mineral pigments, dry-brush cliffs and stippled foliage. */
'use strict';
(() => {
function create(T, specs) {
  let seed=20260913;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const layers=[new T.Group(),new T.Group(),new T.Group()];
  const uniforms=[],materials=new Map();
  const paintMap=window.YSHInkTextureData?new T.TextureLoader().load(window.YSHInkTextureData):new T.DataTexture(new Uint8Array([134,153,111,255]),1,1);
  paintMap.wrapS=paintMap.wrapT=T.RepeatWrapping;paintMap.anisotropy=8;paintMap.needsUpdate=true;
  const noiseGLSL=`
    float hash31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
    float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){return .56*noise3(p)+.28*noise3(p*2.07)+.13*noise3(p*4.13);}
  `;
  function material(color,kind='stone',vertexColors=false){
    const key=color+kind+vertexColors;if(materials.has(key))return materials.get(key);
    const family=/^(rock|distant-rock)$/.test(kind)?1:kind==='leaf'?2:kind==='water'?3:kind==='masonry'?4:kind==='paving'?5:/wood|timber/.test(kind)?6:0;
    const u={baseColor:{value:new T.Color(color)},paintMap:{value:paintMap},time:{value:0},kind:{value:family},atmospheric:{value:kind==='distant-rock'?1:0},haze:{value:new T.Color('#d8e6cf')}};
    uniforms.push(u);
    const m=new T.ShaderMaterial({uniforms:u,vertexColors,extensions:{derivatives:true},side:kind==='leaf'?T.DoubleSide:T.FrontSide,
      vertexShader:`
      varying vec3 vWorld;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vPaint;varying float vDepth;
      uniform float time;uniform float kind;
      void main(){vec3 p=position;vec3 n=normal;vPaint=vec3(1.);
        #ifdef USE_COLOR
          vPaint=color;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vPaint*=instanceColor;
        #endif
        #ifdef USE_INSTANCING
          p=(instanceMatrix*vec4(p,1.)).xyz;
          mat3 im=mat3(instanceMatrix);
          n/=vec3(dot(im[0],im[0]),dot(im[1],im[1]),dot(im[2],im[2]));n=im*n;
        #endif
        vLocal=p;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;
        vNormal=normalize((vec4(normalMatrix*n,0.)*viewMatrix).xyz);
        vec4 mv=viewMatrix*world;vDepth=-mv.z;gl_Position=projectionMatrix*mv;
      }`,
      fragmentShader:`
      uniform vec3 baseColor;uniform vec3 haze;uniform float kind;uniform float time;uniform float atmospheric;uniform sampler2D paintMap;
      varying vec3 vWorld;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vPaint;varying float vDepth;
      ${noiseGLSL}
      void main(){
        vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 p=vLocal;float wash=fbm(p*2.1);
        float footprint=length(fwidth(p));float grain=mix(noise3(p*36.),.5,smoothstep(.007,.045,footprint));
        float light=dot(n,normalize(vec3(-.65,1.,.65)))*.5+.5;
        float shade=.48+.22*smoothstep(.17,.5,light)+.39*smoothstep(.53,.88,light);
        vec3 col=baseColor*vPaint*shade;
        col*=.91+wash*.20+(grain-.5)*.055;
        if(kind==1.){
          vec3 blend=pow(abs(n),vec3(5.));blend/=max(.001,blend.x+blend.y+blend.z);
          vec3 q=vWorld*.24;
          vec3 painted=texture2D(paintMap,q.zy).rgb*blend.x+texture2D(paintMap,q.xz).rgb*blend.y+texture2D(paintMap,q.xy).rgb*blend.z;
          painted=pow(painted,vec3(2.2));
          col=mix(col,painted*shade, .43);
          float grainline=fbm(vec3(p.x*7.,p.y*2.,p.z*7.));
          float broken=fbm(p*5.);float stroke=smoothstep(.55,.78,grainline+.12*broken);
          float rockface=1.-smoothstep(.3,.76,n.y);
          col=mix(col,col*vec3(.50,.61,.57),stroke*rockface*.32);
          float pale=smoothstep(.64,.82,grainline+wash*.2)*rockface;
          col=mix(col,vec3(.63,.64,.42),pale*.28);
          float moss=smoothstep(.2,.78,n.y)*smoothstep(.3,.64,fbm(p*6.));
          col=mix(col,vec3(.24,.33,.14)*(.8+wash),moss*.54);
          col=mix(col,vec3(.49,.54,.38)*shade,(1.-smoothstep(.08,.48,p.y))*.68);
        }
        if(kind==2.)col*=.93+.14*smoothstep(.25,.75,noise3(p*18.));
        if(kind==3.){float pool=fbm(vec3(vWorld.x*1.2,0.,vWorld.z*.9));col=mix(col,vec3(.47,.64,.58),pool*.30);}
        if(kind==4.||kind==5.){
          vec2 uv=abs(n.y)>.65?vWorld.xz:(abs(n.x)>abs(n.z)?vWorld.zy:vWorld.xy);
          uv/=kind==4.?vec2(.25,.105):vec2(.24,.29);
          uv.x+=mod(floor(uv.y),2.)*.5;vec2 cell=fract(uv);
          float edge=min(min(cell.x,1.-cell.x),min(cell.y,1.-cell.y));
          float aa=max(.006,fwidth(edge));float joint=1.-smoothstep(.018-aa,.026+aa,edge);
          col*=.94+.09*hash31(vec3(floor(uv),2.));col=mix(col,col*.59,joint*.61);
        }
        if(kind==6.){float fibres=fbm(vec3(p.x*33.,p.y*3.,p.z*3.));col*=.89+fibres*.23;}
        float dist=smoothstep(19.,48.,vDepth)*atmospheric;
        col=mix(col,haze,dist*.82);
        // Stable aerial perspective: no intersecting transparent fog cards.
        float valley=1.-smoothstep(-.35,.75,vWorld.y);
        col=mix(col,haze,valley*.15);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
    });m.userData.surfaceKind=kind;m.userData.rockPigment=family===1;materials.set(key,m);return m;
  }
  const site=window.YSHSite.create(T,material);layers[2].add(site.group);
  const cliffMat=material('#ffffff','rock',true),distantCliffMat=material('#ffffff','distant-rock',true),branchMat=material('#535b3b','wood');
  const trunkParts=[],leafPoints=[];
  function mesh(geometry,mat,parent,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
  function mergeParts(parts){
    const pos=[],norm=[];
    for(const part of parts){part.updateMatrix();const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();g.applyMatrix4(part.matrix);pos.push(...g.attributes.position.array);norm.push(...g.attributes.normal.array);g.dispose();}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));return g;
  }
  function cliff(m,k,parent=layers[0],distant=false){
    const N=distant?64:128,R=distant?32:58,verts=[],colors=[],indices=[];
    const dark=new T.Color(distant?'#6eaba9':'#284f4a'),light=new T.Color(distant?'#b1c9ad':'#c2bc8c');
    for(let j=0;j<=R;j++){
      const t=j/R;
      for(let i=0;i<=N;i++){
        const a=i/N*Math.PI*2;
        // Near-vertical shoulders, uneven crown, and persistent vertical clefts.
        const crown=.95+.035*Math.sin(a*3.0+k)+.018*Math.sin(a*7.0-k);
        const bulge=m.terrace?(.99+.04*Math.sin(t*Math.PI)):m.foundation?(.82+.18*t):(.88+.16*Math.sin(t*3.8))*(1.-Math.pow(t,7.)*(distant?.56:.31));
        const grooves=1.+.12*Math.sin(a*7.+k)+.065*Math.sin(a*13.+k*.7)+.022*Math.sin(a*31.+t*4.);
        const strata=1.;
        const r=bulge*grooves*strata;
        const ca=Math.cos(a),sa=Math.sin(a);
        let x=(m.terrace?Math.sign(ca)*Math.pow(Math.abs(ca),.53):ca)*m.rx*r+.10*Math.sin(t*2.8+k)*t;
        let z=(m.terrace?Math.sign(sa)*Math.pow(Math.abs(sa),.53):sa)*m.rz*r+.07*Math.sin(t*3.+k)*t;
        let y=t*m.h*crown;
        if(j===R){x*=.93;z*=.93;}
        if(!distant&&!m.foundation)y=Math.min(y,site.terrainCeiling(x+m.x,z+m.z)-(m.y??.035));
        verts.push(x,y,z);
        const c=dark.clone().lerp(light,.09+.40*t+.17*Math.cos(a-2.)+.05*Math.sin(a*3.+t*2.));
        colors.push(c.r,c.g,c.b);
      }
    }
    for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;indices.push(a,b,a+1,b,b+1,a+1);}
    if(!distant&&!m.foundation){
      // Subdivide caps too: a single triangle fan can bridge over a carved walkway.
      const capStart=verts.length/3,capR=22,cx=.12*Math.sin(k);
      for(let j=0;j<=capR;j++)for(let i=0;i<=N;i++){
        const t=j/capR,o=(R*(N+1)+i)*3,a=i/N*Math.PI*2;
        const x=cx*(1-t)+verts[o]*t,z=verts[o+2]*t;
        const crown=.95+.035*Math.sin(a*3+k)+.018*Math.sin(a*7-k);
        const y=Math.min(m.h*(.97*(1-t)+crown*t),site.terrainCeiling(m.x+x,m.z+z)-(m.y??.035));
        verts.push(x,y,z);colors.push(light.r,light.g,light.b);
      }
      for(let j=0;j<capR;j++)for(let i=0;i<N;i++){const a=capStart+j*(N+1)+i,b=a+N+1;indices.push(a,a+1,b,b,a+1,b+1);}
    }else{
      const center=verts.length/3;verts.push(.12*Math.sin(k),m.h*.97,0);colors.push(light.r,light.g,light.b);
      for(let i=0;i<N;i++)indices.push(center,R*(N+1)+i+1,R*(N+1)+i);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const obj=mesh(g,distant?distantCliffMat:cliffMat,parent,m.x,m.y??.035,m.z);obj.name='wrinkled-cliff-'+k;obj.userData.terrain=true;
    // Discontinuous, vertical dry-brush lines follow the same solid surface.
    if(!distant){
      const strokes=[];
      for(let s=0;s<44;s++){
        const ai=1+Math.floor(random()*(N-2)),start=3+Math.floor(random()*15),end=Math.min(R-1,start+5+Math.floor(random()*16));
        for(let j=start;j<end;j++){
          if(random()<.16)continue;
          for(const row of [j,j+1]){const off=(row*(N+1)+ai)*3;strokes.push(verts[off]*1.007,verts[off+1],verts[off+2]*1.007);}
        }
      }
      const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(strokes,3));
      const lines=new T.LineSegments(sg,new T.LineBasicMaterial({color:'#3d5b4d',transparent:true,opacity:.25,depthWrite:false}));lines.position.copy(obj.position);parent.add(lines);
    }
    return obj;
  }
  // A single continuous massif joins the summit bench, sloping shoulders and
  // riverbanks. It has no stacked cylindrical cliff rings or overlapping caps.
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  function noise2(x,z){
    const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
    const h=(a,b)=>{const v=Math.sin(a*127.1+b*311.7+41.2)*43758.5453;return v-Math.floor(v);};
    const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
    return (h(ix,iz)*(1-u)+h(ix+1,iz)*u)*(1-v)+(h(ix,iz+1)*(1-u)+h(ix+1,iz+1)*u)*v;
  }
  const peaks=[[-3.62,-1.98,.91,1.15,2.84],[-3.97,-.26,.64,.92,1.12],
    [2.35,-1.48,1.46,1.45,2.63],[3.31,-.63,1.05,1.26,1.58],
    [3.95,1.85,.62,.68,.65],[-3.93,2.17,.50,.61,.38]];
  function mountainHeight(x,z){
    const top=site.surfaces.find(r=>r.name==='temple-forecourt');
    const dx=Math.max(top.x0-x,0,x-top.x1),dz=Math.max(top.z0-z,0,z-top.z1);
    const outside=Math.hypot(dx,dz);
    // A broad, buttressed shoulder below the engineered bench, widening at its foot.
    const bearing=Math.atan2(z-(top.z0+top.z1)/2,x-(top.x0+top.x1)/2),falloff=1.30+.28*Math.sin(bearing*3+.4)+.17*Math.sin(bearing*5-1.1);
    let h=Math.max(.075,top.y-top.depth+.015-falloff*Math.pow(outside,.91));
    for(const [cx,cz,rx,rz,height] of peaks){
      const q=Math.hypot((x-cx)/rx,(z-cz)/rz);
      const profile=Math.pow(Math.max(0,1-Math.pow(q,1.5)),.76);
      h=Math.max(h,.065+height*profile);
    }
    const rough=(noise2(x*1.35,z*.95)-.5)*.44+(noise2(x*4.8+5,z*4.8)-.5)*.065;
    h+=rough*smooth(.12,.70,h)*smooth(.03,.55,outside);
    // Continuous bank slope replaces the tall vertical trench around the river.
    const river=site.riverAt(z),bank=Math.abs(x-river.x)-river.width/2;
    h=-.060+(h+.060)*smooth(.045,.52,bank);
    // The bench has continuous bedrock beneath every corner, including the
    // river-facing edge; valley erosion must not undercut the building platform.
    h=Math.max(h,top.y-top.depth+.015-outside*3.4);
    h=Math.min(h,site.terrainCeiling(x,z));
    return h;
  }
  const groundGeo=new T.BufferGeometry(),gp=[],gc=[],gi=[],GN=224,GM=204;
  const groundDark=new T.Color('#527c72'),groundLight=new T.Color('#b7b48d');
  for(let j=0;j<=GM;j++)for(let i=0;i<=GN;i++){
    // Leave enough land behind the courtyard for its shoulder to reach the foot
    // before the island rim fades. The old edge sliced a still-high slope upright.
    const z=-4.8+j/GM*8.0,halfWidth=4.75*Math.min(1,Math.sqrt(1.12-Math.pow((z+.8)/4.6,2))),x=(i/GN-.5)*halfWidth*2;
    let y=mountainHeight(x,z);
    const edge=Math.min(i,GN-i,j,GM-j);y=Math.min(y,-.035+smooth(0,9,edge)*6.);
    gp.push(x,y,z);const c=groundDark.clone().lerp(groundLight,.33+.28*noise2(x*.7,z*.7)+.10*clamp(y/3));gc.push(c.r,c.g,c.b);
  }
  for(let j=0;j<GM;j++)for(let i=0;i<GN;i++){const a=j*(GN+1)+i,b=a+GN+1;gi.push(a,b,a+1,b,b+1,a+1);}
  // Close the island rim below the visible riverbank instead of adding a second base.
  const rim=[];for(let i=0;i<=GN;i++)rim.push(i);for(let j=1;j<=GM;j++)rim.push(j*(GN+1)+GN);
  for(let i=GN-1;i>=0;i--)rim.push(GM*(GN+1)+i);for(let j=GM-1;j>0;j--)rim.push(j*(GN+1));
  for(let i=0;i<rim.length;i++){
    const a=rim[i],b=rim[(i+1)%rim.length],s=gp.length/3;
    gp.push(gp[a*3],-.09,gp[a*3+2],gp[b*3],-.09,gp[b*3+2]);gc.push(...gc.slice(a*3,a*3+3),...gc.slice(b*3,b*3+3));gi.push(a,s,b,b,s,s+1);
  }
  groundGeo.setAttribute('position',new T.Float32BufferAttribute(gp,3));groundGeo.setAttribute('color',new T.Float32BufferAttribute(gc,3));groundGeo.setIndex(gi);groundGeo.computeVertexNormals();
  const ground=mesh(groundGeo,cliffMat,layers[0]);ground.name='continuous-slope-massif';ground.userData.terrain=true;
  layers[0].updateMatrixWorld(true);
  const rockMeshes=layers[0].children.filter(o=>o.isMesh);
  const placementRay=new T.Raycaster();
  function surface(x,z){placementRay.set(new T.Vector3(x,10,z),new T.Vector3(0,-1,0));const hit=placementRay.intersectObjects(rockMeshes,false)[0];return hit?Math.max(.025,hit.point.y):.025;}
  site.addTerrainSupports(surface);
  function branch(a,b,r){const curve=new T.LineCurve3(new T.Vector3(...a),new T.Vector3(...b));trunkParts.push(new T.Mesh(new T.TubeGeometry(curve,1,r,5,false),branchMat));}
  function tree(x,y,z,h,k){
    const lean=(random()-.5)*.22*h;
    const a=[x,y,z],b=[x+lean,y+h*.48,z+.03],c=[x+lean*.7,y+h*.95,z-.03];
    branch(a,b,.025*h);branch(b,c,.015*h);
    for(let j=0;j<5;j++){
      const t=.42+j*.115,angle=j*2.399+k,reach=h*(.48-.055*j);
      const bx=x+lean*t+Math.cos(angle)*reach,by=y+h*t+.08,bz=z+Math.sin(angle)*reach;
      branch([x+lean*t,y+h*t,z],[bx,by,bz],.009*h);
      branch([bx,by,bz],[bx+.08*h,by+.08*h,bz],.005*h);
      for(let q=0;q<88;q++){
        const theta=random()*Math.PI*2,rr=Math.sqrt(random());
        const xx=bx+Math.cos(theta)*rr*h*(.26-.012*j),zz=bz+Math.sin(theta)*rr*h*.21;
        const yy=by+(1-rr)*h*.20+(random()-.5)*h*.12;
        leafPoints.push({x:xx,y:yy,z:zz,size:h*(.044+random()*.07),sun:(1-rr)*.28+random()*.65+(k%4===0?.12:0)});
      }
    }
  }
  // Trees perched at many heights create scale and silhouette variation.
  const plants=[];
  function tryPlant(x,z,h,k){const radius=h*.95+.06;if(!site.canPlant(x,z,radius))return false;const y=surface(x,z);tree(x,y,z,h,k);plants.push({x,y,z,h,radius});return true;}
  const treeSites=[[-4.03,.30,.8],[-3.91,-1.72,.7],[-3.58,-2.37,.8],[-.34,-2.9,.5],[1.95,-1.98,.94],[2.52,-2.55,.70],[3.26,-1.15,.83],[3.89,-.70,.62],[4.12,.18,.58],[4.,2.30,.55],[-3.84,2.32,.52],[-.88,2.55,.52]];
  treeSites.forEach(([x,z,h],i)=>tryPlant(x,z,h,i));
  // Low scrub settles onto exposed shoulders, leaving courtyards and paths clear.
  for(let i=0;i<100;i++){const x=-4.5+random()*8.9,z=-3.05+random()*5.95,h=.16+random()*.18;if(mountainHeight(x,z)>.25)tryPlant(x,z,h,70+i);}
  for(let i=0;i<310;i++){
    const m=specs[i%specs.length],angle=random()*Math.PI*2,radius=.28+random()*.75;
    const x=m.x+Math.cos(angle)*m.rx*radius,z=m.z+Math.sin(angle)*m.rz*radius;
    tryPlant(x,z,.24+random()*.34,i+20);
  }
  const branches=mesh(mergeParts(trunkParts),branchMat,layers[1]);branches.name='painted-branch-network';trunkParts.forEach(p=>p.geometry.dispose());
  // Tiny irregular leaves are actual oriented geometry, batched into one draw.
  const leafGeo=new T.BufferGeometry();
  leafGeo.setAttribute('position',new T.Float32BufferAttribute([-.9,0,0,-.35,.12,-.65,.65,0,-.43,1,.12,.17,.05,0,.59,-.75,.1,.4],3));
  leafGeo.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);leafGeo.computeVertexNormals();
  const leaves=new T.InstancedMesh(leafGeo,material('#ffffff','leaf'),leafPoints.length),dummy=new T.Object3D();
  const green=new T.Color('#384f36'),gold=new T.Color('#bec15b');
  leafPoints.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.setScalar(p.size);dummy.rotation.set((random()-.5)*1.3,random()*Math.PI*2,(random()-.5)*1.3);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,green.clone().lerp(gold,Math.min(.95,p.sun)));});
  leaves.name='stippled-leaves';leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();layers[1].add(leaves);
  // Stone banks and a restrained pigment-blue river under the bridge.
  // A strip has no tiny triangles between collinear outline vertices, and all
  // faces carry the same upward normal even at changes of river direction.
  const waterGeo=new T.BufferGeometry(),wp=[],wi=[];
  for(let i=0;i<=96;i++){const z=-4.64+i/96*7.68,r=site.riverAt(z);wp.push(r.x-r.width/2,0,z,r.x+r.width/2,0,z);if(i<96){const a=i*2;wi.push(a,a+2,a+1,a+1,a+2,a+3);}}
  waterGeo.setAttribute('position',new T.Float32BufferAttribute(wp,3));waterGeo.setIndex(wi);waterGeo.computeVertexNormals();
  const water=mesh(waterGeo,material('#95bdb0','water'),layers[0],0,site.waterY,0);water.name='river-water';
  water.material.side=T.DoubleSide;
  // Distant real geometry and translucent vapor belong only to the full-screen view.
  const backdrop=new T.Group();

  for(let row=0;row<3;row++)for(let i=0;i<9;i++){
    const x=(i-4)*4.5+(row%2?1.2:0),z=-12-row*7;
    cliff({x,z,y:-3.8-row*.28,rx:2.+random()*1.5,rz:1.35+random(),h:3.7+random()*4.5},40+i+row*9,backdrop,true);
  }
  // Height/distance haze is evaluated in opaque surface shaders.
  const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
    vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 p;${noiseGLSL}void main(){float h=smoothstep(-.15,.5,normalize(p).y);vec3 c=mix(vec3(.92,.94,.84),vec3(.51,.76,.77),h);float n=fbm(normalize(p)*20.);c=mix(c,vec3(.99,.97,.83),smoothstep(.49,.78,n)*.66);gl_FragColor=vec4(c,1.);}`});
  const sky=new T.Mesh(new T.SphereGeometry(70,24,16),skyMat);backdrop.add(sky);
  return {layers,backdrop,material,site,plants,terrain:rockMeshes,mountainHeight,paintMap,update(time){uniforms.forEach(u=>u.time.value=time);},stats:{leafCount:leafPoints.length,treeCount:plants.length,...site.stats}};
}
window.YSHInk={create};
})();
