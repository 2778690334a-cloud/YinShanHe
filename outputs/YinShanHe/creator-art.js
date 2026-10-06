/* 自由拼版：独立的规则、平面印稿与可释放几何。坐标原点在版心，x 右、z 下。 */
(function (root) {
  'use strict';
  const W = 9.5, D = 6.2, MARGIN = .3, WATER_Y = .035;
  const TYPES = ['mountain', 'water', 'tree', 'boat', 'house', 'rock', 'reeds', 'lantern'];
  const VARIANTS = {
    mountain: [['peak','峻峰','高峰与舒展山脚'],['ridge','远岫','横向延伸的低山脊'],['hill','圆丘','低缓圆润的土丘']],
    water: [['river','溪流','拖动节点调整水道']],
    tree: [['pine','苍松','层叠松冠'],['bent','曲松','斜干向一侧舒展'],['bamboo','修竹','细竿疏叶']],
    boat: [['open','扁舟','敞口木舟'],['canopy','篷舟','弧形竹篷']],
    house: [['cottage','山居','双坡瓦顶小屋'],['pavilion','凉亭','八角攒尖顶与通透立柱'],['hall','厅堂','宽阔厅身与前廊']],
    rock: [['rock','湖石','贴地的棱面石']], reeds: [['reeds','芦苇','岸边细茎与穗头']], lantern: [['lantern','石灯','平地上的小石灯']]
  };
  Object.keys(VARIANTS).forEach(t => { VARIANTS[t] = Object.freeze(VARIANTS[t].map(([id,label,note]) => Object.freeze({id,label,note}))); });
  Object.freeze(VARIANTS);
  const PALETTE = ['#567a78', '#647a47', '#a35338'];
  const LAYER = {mountain: 0, water: 0, rock: 0, tree: 1, reeds: 1, boat: 2, house: 2, lantern: 2};
  const ORDER = Object.freeze({water:0,mountain:1,rock:2,tree:3,reeds:4,house:5,boat:6,lantern:7});
  const variants = type => VARIANTS[type] || VARIANTS.mountain;
  const layerOf = type => LAYER[type];
  // Stable bottom-to-top item order; returned items belong to a fresh normalized plan.
  const drawOrder = plan => normalize(plan).items.sort((a,b) => ORDER[a.type] - ORDER[b.type]);
  const TAU = Math.PI * 2, EPS = 1e-8;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const finite = (n, fallback) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  const pt = (x, z) => ({x, z});
  const mix = (a, b, t) => pt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
  const mid = (a, b) => mix(a, b, .5);
  function hex(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const s = value.trim();
    if (/^#[\da-f]{6}$/i.test(s)) return s.toLowerCase();
    if (/^#[\da-f]{3}$/i.test(s)) return '#' + s.slice(1).split('').map(c => c + c).join('').toLowerCase();
    return fallback;
  }
  function tint(color, amount) {
    const target = amount < 0 ? 0 : 255, a = Math.abs(amount);
    return '#' + [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - a) + target * a).toString(16).padStart(2, '0')).join('');
  }
  function defaults(type, id, x, z, variant) {
    type = TYPES.includes(type) ? type : 'mountain';
    const item = {id: typeof id === 'string' && id.trim() ? id.trim() : type + '-1', type,
      variant: variants(type).some(v => v.id === variant) ? variant : variants(type)[0].id,
      x: finite(x, 0), z: finite(z, 0), scale: 1, rotation: 0, height: type === 'mountain' ? 1.5 : 1, width: .55};
    if (type === 'water') item.points = [pt(-1.3, -.3), pt(0, .35), pt(1.3, -.2)];
    return item;
  }
  function normalize(plan) {
    const src = plan && typeof plan === 'object' ? plan : {}, used = new Set();
    const items = (Array.isArray(src.items) ? src.items : []).map((entry, i) => {
      const s = entry && typeof entry === 'object' ? entry : {}, d = defaults(s.type, s.id, s.x, s.z, s.variant);
      let id = typeof s.id === 'string' && s.id.trim() ? s.id.trim() : d.type + '-' + (i + 1);
      const stem = id;
      for (let suffix = 2; used.has(id); suffix++) id = stem + '-' + suffix;
      used.add(id); d.id = id;
      d.scale = clamp(finite(s.scale, 1), .55, 1.6);
      d.rotation = ((finite(s.rotation, 0) % 360) + 540) % 360 - 180;
      d.height = d.type === 'mountain' ? clamp(finite(s.height, 1.5), .6, 2.6) : clamp(finite(s.height, 1), .1, 2.6);
      d.width = clamp(finite(s.width, .55), .25, 1.1);
      if (d.type === 'water' && Array.isArray(s.points) && s.points.length >= 2) {
        d.points = s.points.slice(0, 9).map(p => pt(clamp(finite(p && p.x, 0),-W,W), clamp(finite(p && p.z, 0),-D,D)));
      }
      return d;
    });
    const title = typeof src.title === 'string' ? src.title.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim() : '我的山河';
    return {version: 1, title: Array.from(title || '我的山河').slice(0, 20).join(''), items,
      palette: PALETTE.map((c, i) => hex(Array.isArray(src.palette) ? src.palette[i] : null, c))};
  }
  function cleanItem(item) { return normalize({items: [item]}).items[0]; }
  function world(item, p) {
    const a = item.rotation * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return pt(item.x + item.scale * (p.x * c - p.z * s), item.z + item.scale * (p.x * s + p.z * c));
  }
  function local(item, p) {
    const a = item.rotation * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = (p.x - item.x) / item.scale, z = (p.z - item.z) / item.scale;
    return pt(x * c + z * s, -x * s + z * c);
  }
  function segmentDistance(p, a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, den = dx * dx + dz * dz;
    const t = den > EPS * EPS ? clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / den, 0, 1) : 0;
    return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
  }
  function inPolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[j], b = poly[i];
      if (segmentDistance(p, a, b) <= EPS) return true;
      if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
    }
    return inside;
  }
  function segmentsIntersect(a, b, c, d) {
    if(Math.max(a.x,b.x)+EPS<Math.min(c.x,d.x)||Math.max(c.x,d.x)+EPS<Math.min(a.x,b.x)||Math.max(a.z,b.z)+EPS<Math.min(c.z,d.z)||Math.max(c.z,d.z)+EPS<Math.min(a.z,b.z))return false;
    const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
    if (((abC > EPS && abD < -EPS) || (abC < -EPS && abD > EPS)) &&
        ((cdA > EPS && cdB < -EPS) || (cdA < -EPS && cdB > EPS))) return true;
    return segmentDistance(a, c, d) <= EPS || segmentDistance(b, c, d) <= EPS || segmentDistance(c, a, b) <= EPS || segmentDistance(d, a, b) <= EPS;
  }
  function polygonsIntersect(a, b) {
    if (inPolygon(a[0], b) || inPolygon(b[0], a)) return true;
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
      if (segmentsIntersect(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
    return false;
  }
  function extent(points, pad = 0) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
    return {minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad};
  }
  const overlaps = (a, b) => a.minX <= b.maxX + EPS && a.maxX + EPS >= b.minX && a.minZ <= b.maxZ + EPS && a.maxZ + EPS >= b.minZ;
  function ellipse(x, z, rx, rz, n = 40) {
    return Array.from({length: n}, (_, i) => pt(x + rx * Math.cos(i * TAU / n), z + rz * Math.sin(i * TAU / n)));
  }
  function quadratic(a, b, c, t) { return mix(mix(a, b, t), mix(b, c, t), t); }
  function curves(points) {
    if (points.length === 2) return [[points[0], mid(points[0], points[1]), points[1]]];
    const result = []; let start = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      const end = i === points.length - 2 ? points[i + 1] : mid(points[i], points[i + 1]);
      result.push([start, points[i], end]); start = end;
    }
    return result;
  }
  function sampleCurves(parts) {
    const out = [parts[0][0]];
    parts.forEach(([a, b, c]) => {
      const n = clamp(Math.ceil((dist(a, b) + dist(b, c)) / .035), 12, 128);
      for (let i = 1; i <= n; i++) out.push(quadratic(a, b, c, i / n));
    });
    return out;
  }
  function waterData(item) {
    const key=JSON.stringify([item.x,item.z,item.scale,item.rotation,item.width,item.points]);
    return cached(waterCache,key,()=>buildWaterData(item),64);
  }
  function buildWaterData(item) {
    const parts = curves(item.points), path = sampleCurves(parts), worldPath = path.map(p => world(item, p));
    // Include analytical extrema of the rotated quadratic, then its circular width.
    const extremes = [];
    parts.forEach(part => {
      const [a, b, c] = part.map(p => world(item, p)); extremes.push(a, c);
      for (const key of ['x', 'z']) {
        const den = a[key] - 2 * b[key] + c[key], t = Math.abs(den) > EPS ? (a[key] - b[key]) / den : -1;
        if (t > 0 && t < 1) extremes.push(quadratic(a, b, c, t));
      }
    });
    const segments=worldPath.slice(1).map((b,i)=>{const a=worldPath[i],dx=b.x-a.x,dz=b.z-a.z;return {a,dx,dz,inv:1/(dx*dx+dz*dz||1)};});
    return {path, worldPath, segments, radius: item.width * item.scale / 2, bounds: extent(extremes, item.width * item.scale / 2)};
  }
  function waterClearance(water, p) {
    let nearest = Infinity;
    for (const s of water.segments){const x=p.x-s.a.x,z=p.z-s.a.z,t=clamp((x*s.dx+z*s.dz)*s.inv,0,1),dx=x-t*s.dx,dz=z-t*s.dz;nearest=Math.min(nearest,dx*dx+dz*dz);}
    return water.radius - Math.sqrt(nearest);
  }
  // A smooth, irregular footprint; no vertical extrusion and no concentric ripples.
  const mountainKnots = [[-1.49,.14],[-1.21,-.48],[-.63,-.82],[.08,-.87],[.81,-.65],[1.30,-.16],[1.42,.36],[.85,.76],[.13,.91],[-.59,.78],[-1.22,.58]].map(v => pt(...v));
  const MOUNTAIN = [];
  mountainKnots.forEach((p, i) => {
    const a = mid(mountainKnots[(i + mountainKnots.length - 1) % mountainKnots.length], p), b = mid(p, mountainKnots[(i + 1) % mountainKnots.length]);
    for (let j = 0; j < 8; j++) MOUNTAIN.push(quadratic(a, p, b, j / 8));
  });
  const PEAK = pt(-.28, -.18), RINGS = 22, FIELD = [], FACES = [];
  function ridgeHeight(p, radial) {
    const ridge = Math.exp(-Math.pow((p.z + .18 + .14 * (p.x + .28)) / .34, 2));
    const shoulder = .71 + .29 * Math.exp(-Math.pow((p.x + .28) / .83, 2));
    return Math.pow(Math.max(0, 1 - radial * radial), 1.38) * (.55 + .45 * ridge) * shoulder;
  }
  FIELD.push({x: PEAK.x, z: PEAK.z, h: 1});
  for (let r = 1; r <= RINGS; r++) MOUNTAIN.forEach(p => {
    const q = mix(PEAK, p, r / RINGS); FIELD.push({x: q.x, z: q.z, h: r === RINGS ? 0 : ridgeHeight(q, r / RINGS)});
  });
  const ringIndex = (r, i) => 1 + (r - 1) * MOUNTAIN.length + (i % MOUNTAIN.length);
  for (let i = 0; i < MOUNTAIN.length; i++) FACES.push([0, ringIndex(1, i + 1), ringIndex(1, i)]);
  for (let r = 1; r < RINGS; r++) for (let i = 0; i < MOUNTAIN.length; i++) {
    const a = ringIndex(r, i), b = ringIndex(r, i + 1), c = ringIndex(r + 1, i), d = ringIndex(r + 1, i + 1);
    FACES.push([a, b, c], [b, d, c]);
  }
  const FACE_BOUNDS = FACES.map(f => extent(f.map(i => FIELD[i])));
  const MOUNTAIN_SHAPE = {peak:[1,1,1],ridge:[1.13,.67,.64],hill:[.78,.90,.40]};
  function mountainOutline(item) { const [sx,sz] = MOUNTAIN_SHAPE[item.variant]; return MOUNTAIN.map(p=>pt(p.x*sx,p.z*sz)); }
  function mountainField(item) {
    const [sx,sz,sy] = MOUNTAIN_SHAPE[item.variant];
    return FIELD.map(p=>({x:p.x*sx,z:p.z*sz,h:sy*(item.variant==='hill' ? Math.sqrt(p.h) : p.h)}));
  }
  const FIELD_VARIANTS = Object.fromEntries(Object.keys(MOUNTAIN_SHAPE).map(variant=>[variant,mountainField({variant})]));
  const FACE_GRID = new Map(), BIN = .16;
  FACE_BOUNDS.forEach((b,i)=>{
    for(let x=Math.floor(b.minX/BIN);x<=Math.floor(b.maxX/BIN);x++)for(let z=Math.floor(b.minZ/BIN);z<=Math.floor(b.maxZ/BIN);z++){
      const key=x+','+z;if(!FACE_GRID.has(key))FACE_GRID.set(key,[]);FACE_GRID.get(key).push(i);
    }
  });
  // Interpolate the very triangles used by createLayers, so trunk roots sit on the mesh.
  function heightLocal(p, variant='peak') {
    const [sx,sz] = MOUNTAIN_SHAPE[variant], field=FIELD_VARIANTS[variant];
    p=pt(p.x/sx,p.z/sz);
    for (const i of FACE_GRID.get(Math.floor(p.x/BIN)+','+Math.floor(p.z/BIN)) || []) {
      const box = FACE_BOUNDS[i];
      if (p.x < box.minX - EPS || p.x > box.maxX + EPS || p.z < box.minZ - EPS || p.z > box.maxZ + EPS) continue;
      const [a, b, c] = FACES[i].map(j => FIELD[j]), den = cross(a, b, c);
      const u = cross(p, b, c) / den, v = cross(a, p, c) / den, w = 1 - u - v;
      if (u >= -EPS && v >= -EPS && w >= -EPS) { const f=FACES[i]; return Math.max(0, field[f[0]].h*u+field[f[1]].h*v+field[f[2]].h*w); }
    }
    return 0;
  }
  // Only connected mountains share a mesh. A fixed world grid and a single top
  // surface avoid coplanar overlaps/crossing seams. Roots query these same triangles.
  const terrainCache = new Map();
  function cached(map,key,build,limit=64) {
    if(map.has(key))return map.get(key);
    const value=build();map.set(key,value);if(map.size>limit)map.delete(map.keys().next().value);return value;
  }
  function terrain(items) {
    const mountains=items.filter(i=>i.type==='mountain');
    const key=JSON.stringify(mountains.map(i=>[i.id,i.x,i.z,i.scale,i.rotation,i.height,i.variant]));
    return cached(terrainCache,key,()=>{
      const entries=mountains.map(item=>{const poly=mountainOutline(item).map(q=>world(item,q));return {item,poly,bounds:extent(poly)};});
      const components=[],seen=new Set();
      entries.forEach((entry,i)=>{
        if(seen.has(i))return;seen.add(i);const group=[entry];
        for(let k=0;k<group.length;k++)entries.forEach((e,j)=>{if(!seen.has(j)&&overlaps(e.bounds,group[k].bounds)&&polygonsIntersect(e.poly,group[k].poly)){seen.add(j);group.push(e);}});
        components.push(group);
      });
      const surfaces=components.map(component=>component.length===1 ? {component} : mergedTerrain(component));
      return {surfaces,height(p){let h=0;for(const s of surfaces){
        if(s.component.length===1){const e=s.component[0];if(p.x<e.bounds.minX||p.x>e.bounds.maxX||p.z<e.bounds.minZ||p.z>e.bounds.maxZ)continue;h=Math.max(h,heightLocal(local(e.item,p),e.item.variant)*e.item.height*e.item.scale);}
        else for(const face of s.bins.get(Math.floor(p.x/s.step)+','+Math.floor(p.z/s.step))||[]){const [a,b,c]=face,den=cross(a,b,c),u=cross(p,b,c)/den,v=cross(a,p,c)/den,w=1-u-v;if(u>=-EPS&&v>=-EPS&&w>=-EPS)h=Math.max(h,u*a.y+v*b.y+w*c.y);}
      }return h;}};
    },4);
  }
  function mergedTerrain(component) {
    const step=.085,b=extent(component.flatMap(e=>e.poly)),vertices=[],indices=[],bins=new Map(),nodes=new Map(),vertexIds=new Map();
    const fields=component.map(e=>({...e,edges:e.poly.map((a,i)=>{const b=e.poly[(i+1)%e.poly.length],length=dist(a,b),x=-(b.z-a.z)/length,z=(b.x-a.x)/length;return {x,z,c:-x*a.x-z*a.z};})}));
    function at(x,z){
      const key=x+','+z;if(nodes.has(key))return nodes.get(key);
      const p=pt(x,z);let signed=-Infinity,numerator=0,denominator=0;
      for(const e of fields){let d=Infinity;for(const edge of e.edges)d=Math.min(d,edge.x*x+edge.z*z+edge.c);
        signed=Math.max(signed,d);
        if(d>0){const h=heightLocal(local(e.item,p),e.item.variant)*e.item.height*e.item.scale,weight=h**5;numerator+=h*weight;denominator+=weight;}
      }
      const y=denominator>0?numerator/denominator:0;
      const v={x,z,y,signed};nodes.set(key,v);return v;
    }
    function add(a,b,c){
      // Counter-clockwise in the x/z drawing plane is downward in THREE.
      if(Math.abs(cross(a,b,c))<EPS)return;
      const face=cross(a,b,c)>0?[a,c,b]:[a,b,c];
      face.forEach(p=>{const key=p.x.toFixed(8)+','+p.z.toFixed(8);if(!vertexIds.has(key)){vertexIds.set(key,vertices.length/3);vertices.push(p.x,p.y,p.z);}indices.push(vertexIds.get(key));});
      const fb=extent(face);
      for(let x=Math.floor(fb.minX/step);x<=Math.floor(fb.maxX/step);x++)for(let z=Math.floor(fb.minZ/step);z<=Math.floor(fb.maxZ/step);z++){
        const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(face);
      }
    }
    function clip(face){
      const poly=[];for(let i=0;i<3;i++){const a=face[i],c=face[(i+1)%3];if(a.signed>0)poly.push(a);if((a.signed>0)!==(c.signed>0)){const t=a.signed/(a.signed-c.signed),q=mix(a,c,t);poly.push({x:q.x,z:q.z,y:0});}}
      for(let i=1;i<poly.length-1;i++)add(poly[0],poly[i],poly[i+1]);
    }
    for(let x=Math.floor(b.minX/step);x<Math.ceil(b.maxX/step);x++)for(let z=Math.floor(b.minZ/step);z<Math.ceil(b.maxZ/step);z++){
      const a=at(x*step,z*step),c=at((x+1)*step,z*step),d=at(x*step,(z+1)*step),e=at((x+1)*step,(z+1)*step);clip([a,c,d]);clip([c,e,d]);
    }
    return {component,step,vertices,indices,bins};
  }
  const CROWNS = [
    [-.25,-.13,.21,.17,.66], [.12,-.25,.23,.18,.86], [.29,.04,.20,.18,.72],
    [-.25,.20,.23,.18,.60], [.08,.24,.25,.18,.76], [-.04,-.02,.25,.20,1.02]
  ];
  const ROOF = [[-.65,-.43],[.65,-.43],[.65,.43],[-.65,.43]].map(v => pt(...v));
  const HULL = Array.from({length: 64}, (_, i) => {
    const a = i * TAU / 64, x = Math.cos(a); return pt(.59 * x, .185 * Math.sin(a) * Math.pow(Math.max(0, 1 - x * x), .2));
  });
  const PADDLE = [[.47,.36],[.57,.52],[.65,.47],[.54,.32]].map(v => pt(...v));
  const OAR = [pt(-.12, -.04), pt(.57, .43)];
  const rect=(x,z,rx,rz)=>[pt(x-rx,z-rz),pt(x+rx,z-rz),pt(x+rx,z+rz),pt(x-rx,z+rz)];
  const PAVILION=ellipse(0,0,.64,.64,8), HALL=rect(0,0,.86,.46), PORCH=rect(0,.43,.30,.22);
  const CANOPY=rect(0,0,.30,.135), LANTERN=rect(0,0,.19,.19);
  const ROCK=[[-.29,-.08],[-.19,-.22],[.05,-.25],[.27,-.13],[.30,.07],[.13,.23],[-.13,.21],[-.30,.10]].map(v=>pt(...v));
  const REED_STEMS=[[-.16,.02,-.23,-.06,.60],[-.06,-.04,-.09,-.15,.78],[.04,0,.10,-.08,.69],[.13,.04,.22,.10,.55],[.0,.10,-.04,.20,.63]];
  const TREE_SHAPES={
    pine:{crowns:CROWNS,tip:pt(.015,0),bend:pt(-.025,-.035)},
    bent:{crowns:CROWNS.map((c,i)=>[c[0]*.85+.25+c[4]*.16,c[1]*.88,c[2]*.9,c[3]*.88,c[4]*.78]),tip:pt(.46,-.03),bend:pt(.21,.02)},
    bamboo:{crowns:[[-.23,-.08,.14,.055,.79],[.05,-.03,.16,.05,1.04],[.23,.08,.14,.06,.92],[-.11,.15,.15,.05,.57],[.10,.19,.12,.05,.68]],tip:pt(0,0),bend:pt(0,0)}
  };
  function linePoly(a,b,r){const d=dist(a,b);if(d<EPS)return ellipse(a.x,a.z,r,r,12);const x=-(b.z-a.z)/d*r,z=(b.x-a.x)/d*r;return [pt(a.x+x,a.z+z),pt(b.x+x,b.z+z),pt(b.x-x,b.z-z),pt(a.x-x,a.z-z)];}
  const shapeCache=new Map();
  function polygons(item) {
    return cached(shapeCache,item.type+':'+item.variant,()=>{
      if (item.type === 'mountain') return [mountainOutline(item)];
      if (item.type === 'house') return item.variant==='pavilion'?[PAVILION]:item.variant==='hall'?[HALL,PORCH]:[ROOF];
      if (item.type === 'boat') return [HULL,PADDLE,linePoly(...OAR,.012)].concat(item.variant==='canopy'?[CANOPY]:[]);
      if (item.type === 'tree') {
        const s=TREE_SHAPES[item.variant];return s.crowns.map(c=>ellipse(c[0],c[1],c[2],c[3],24)).concat([ellipse(0,0,.034,.034,12),linePoly(pt(0,0),s.bend,.032),linePoly(s.bend,s.tip,.02)],s.crowns.map(c=>linePoly(s.bend,pt(c[0],c[1]),.015)),item.variant==='bamboo'?[rect(-.13,0,.014,.014),rect(0,.04,.014,.014),rect(.13,0,.014,.014)]:[]);
      }
      if (item.type === 'rock') return [ROCK];
      if (item.type === 'lantern') return [LANTERN];
      if (item.type === 'reeds') return REED_STEMS.flatMap(([x,z,tx,tz])=>[linePoly(pt(x,z),pt(tx,tz),.014),ellipse(tx,tz,.022,.022,12),linePoly(pt(x,z),pt(x+.09,z+.025),.016)]);
      return [];
    });
  }
  const footprintCache=new Map(),waterCache=new Map();
  function footprint(item){return cached(footprintCache,JSON.stringify([item.type,item.variant,item.x,item.z,item.scale,item.rotation]),()=>{const polys=polygons(item).map(poly=>poly.map(q=>world(item,q)));return {polys,bounds:extent(polys.flat(),.012*item.scale)};},128);}
  function itemBounds(item) {
    if (item.type === 'water') return waterData(item).bounds;
    // The small pad covers contour ink and cylindrical twigs/oars as well as facets.
    return footprint(item).bounds;
  }
  function bounds(item) { return itemBounds(cleanItem(item)); }
  function hitTest(item, x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    item = cleanItem(item); const p = pt(x, z);
    if (item.type === 'water') return waterClearance(waterData(item), p) >= -1e-6*item.scale;
    const q = local(item, p);
    if (polygons(item).some(poly => inPolygon(q, poly)||poly.some((a,i)=>segmentDistance(q,a,poly[(i+1)%poly.length])<=.012))) return true;
    if (item.type === 'boat') return segmentDistance(q, ...OAR) <= .015;
    return false;
  }
  function polygonTouchesWater(poly, water) {
    const bounds=extent(poly);if (!overlaps(bounds, water.bounds)) return false;
    const r = water.radius;
    for (let i = 1; i < water.worldPath.length; i++) {
      const a = water.worldPath[i - 1], b = water.worldPath[i];
      if(Math.max(a.x,b.x)+r<bounds.minX||Math.min(a.x,b.x)-r>bounds.maxX||Math.max(a.z,b.z)+r<bounds.minZ||Math.min(a.z,b.z)-r>bounds.maxZ)continue;
      if (inPolygon(a, poly) || inPolygon(b, poly)) return true;
      for (let j = 0; j < poly.length; j++) {
        const c = poly[j], d = poly[(j + 1) % poly.length];
        if (segmentsIntersect(a, b, c, d) || Math.min(segmentDistance(a, c, d), segmentDistance(b, c, d), segmentDistance(c, a, b), segmentDistance(d, a, b)) <= r + EPS) return true;
      }
    }
    return false;
  }
  function hullCovered(poly, waters) {
    if (!waters.length) return false;
    waters=waters.filter(w=>overlaps(extent(poly),w.bounds));if(!waters.length)return false;
    // Round mesh joins are inscribed 40-gons: use their inradius for a safe
    // coverage certificate, rather than allowing a hull outside a rendered fan.
    const clearance = p => Math.max(...waters.map(w => waterClearance(w, p) - w.radius * (1 - Math.cos(Math.PI / 40))));
    // A distance-to-path field is 1-Lipschitz. Certify entire triangles, including
    // interior gaps between separate rivers; unresolved sub-millimetre contact fails.
    let budget=1024;
    function triangle(a, b, c, depth) {
      if(--budget<0)return false;
      const center = pt((a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3), safe = clearance(center);
      if (safe < -EPS) return false;
      if (safe >= Math.max(dist(center, a), dist(center, b), dist(center, c)) + .00015) return true;
      if (depth === 8 || clearance(a) < .00015 || clearance(b) < .00015 || clearance(c) < .00015) return false;
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      return triangle(a, ab, ca, depth + 1) && triangle(ab, b, bc, depth + 1) && triangle(ca, bc, c, depth + 1) && triangle(ab, bc, ca, depth + 1);
    }
    const center = pt(poly.reduce((s, p) => s + p.x, 0) / poly.length, poly.reduce((s, p) => s + p.z, 0) / poly.length);
    return poly.every((p, i) => triangle(center, p, poly[(i + 1) % poly.length], 0));
  }
  function closePolygons(a,b,gap=0) {
    const ab=extent(a,gap),bb=extent(b);if(!overlaps(ab,bb))return false;
    if(polygonsIntersect(a,b))return true;
    if(gap<=0)return false;
    for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(Math.min(segmentDistance(a[i],b[j],b[(j+1)%b.length]),segmentDistance(b[j],a[i],a[(i+1)%a.length]))<gap)return true;
    return false;
  }
  const liftCache=new WeakMap();
  function treeLift(item,ground){
    if(!liftCache.has(ground))liftCache.set(ground,new Map());
    return cached(liftCache.get(ground),JSON.stringify(item),()=>computeTreeLift(item,ground));
  }
  function computeTreeLift(item,ground){
    const base=ground.height(pt(item.x,item.z)),depth=item.variant==='bamboo'?.045:.125;let lift=0;
    TREE_SHAPES[item.variant].crowns.forEach(c=>{
      const samples=[pt(c[0],c[1]),...ellipse(c[0],c[1],c[2],c[3],12),...ellipse(c[0],c[1],c[2]*.5,c[3]*.5,8)];
      samples.forEach(q=>{lift=Math.max(lift,(ground.height(world(item,q))-base)/item.scale-(c[4]-depth)*item.height+.045);});
    });
    return Math.max(0,lift);
  }
  const validationCache=new Map();
  const FLAT_GROUND={height:()=>0};
  function validate(plan) {
    const p=normalize(plan),key=JSON.stringify(p.items);
    const result=cached(validationCache,key,()=>validateItems(p.items),12);
    return {ok:result.ok,layers:result.layers.slice(),issues:result.issues.map(i=>({...i}))};
  }
  function validateItems(items) {
    const issues=[],layers=[0,0,0],issue=(id,reason)=>{if(!issues.some(i=>i.id===id&&i.reason===reason))issues.push({id,reason});};
    items.forEach(i=>layers[LAYER[i.type]]++);
    if(!items.length)issue('','请至少放置一件素材。');
    if(items.length>24){issue('','每幅印稿最多放置24件素材，请减少素材数量。');return {ok:false,issues,layers};}
    const data=items.map(item=>({item,...(item.type==='water'?{bounds:waterData(item).bounds,water:waterData(item)}:footprint(item))}));
    const mountains=data.filter(e=>e.item.type==='mountain'),waters=data.filter(e=>e.water),solids=data.filter(e=>!e.water&&e.item.type!=='mountain');
    let outside=false;
    data.forEach(({item,bounds:b})=>{if(!Object.values(b).every(Number.isFinite)||b.minX<-W/2+MARGIN-EPS||b.maxX>W/2-MARGIN+EPS||b.minZ<-D/2+MARGIN-EPS||b.maxZ>D/2-MARGIN+EPS){issue(item.id,'素材越界：请完整放在版边0.3的留白以内。');outside=true;}});
    // Out-of-sheet drags need no costly terrain construction. The UI rolls them back.
    if(outside)return {ok:false,issues,layers};
    waters.forEach((w,i)=>{
      const path=w.water.worldPath;
      if(path.reduce((n,p,j)=>n+(j?dist(p,path[j-1]):0),0)<.08)issue(w.item.id,'水道过短，请拉开河道节点。');
      if(w.water.crossing===undefined){let crossing=false;
        for(let a=1;a<path.length&&!crossing;a++)for(let b=a+3;b<path.length;b++)if(segmentsIntersect(path[a-1],path[a],path[b-1],path[b])){crossing=true;break;}
        w.water.crossing=crossing;
      }
      if(w.water.crossing)issue(w.item.id,'水道不能折返或交叉，请舒展河形。');
      mountains.forEach(m=>{if(overlaps(m.bounds,w.bounds)&&polygonTouchesWater(m.polys[0],w.water)){issue(w.item.id,'水道不能穿过山体，请沿山脚留出河岸。');issue(m.item.id,'山体不能遮住水道，请留出河岸。');}});
      for(let j=i+1;j<waters.length;j++){
        const other=waters[j];if(!overlaps(w.bounds,other.bounds))continue;
        if(path.some(q=>waterClearance(other.water,q)>-w.water.radius)){issue(w.item.id,'两条水道不能重叠，请调整河形或使用一条连续水道。');issue(other.item.id,'两条水道不能重叠，请调整河形或使用一条连续水道。');}
      }
    });
    const ground=solids.some(e=>e.item.type==='tree'&&mountains.some(m=>overlaps(e.bounds,m.bounds)))?terrain(items):FLAT_GROUND;
    solids.forEach(e=>{
      const item=e.item,flat=item.type==='house'||item.type==='lantern';
      if(flat){
        if(mountains.some(m=>overlaps(e.bounds,m.bounds)&&e.polys.some(poly=>closePolygons(poly,m.polys[0],.035))))issue(item.id,'房屋与石灯须在平地上，不能穿入山体。');
        if(waters.some(w=>e.polys.some(poly=>polygonTouchesWater(poly,w.water))))issue(item.id,'房屋与石灯须在平地上，不能与水道相交。');
      }
      if(item.type==='boat'){
        const hull=HULL.map(q=>world(item,q));
        if(!hullCovered(hull,waters.map(w=>w.water)))issue(item.id,'舟的完整船身须处于水面内，请移入水道或加宽水道。');
        if(mountains.some(m=>overlaps(e.bounds,m.bounds)&&e.polys.some(poly=>closePolygons(poly,m.polys[0],.015))))issue(item.id,'舟下的水面被山体遮住，请移到开阔水面。');
      }
      if(item.type==='rock'&&waters.some(w=>e.polys.some(poly=>polygonTouchesWater(poly,w.water))))issue(item.id,'湖石须落在岸上，不能穿入水面。');
      if(item.type==='tree'||item.type==='reeds'){
        const roots=item.type==='reeds'?REED_STEMS.map(s=>pt(s[0],s[1])):item.variant==='bamboo'?[pt(-.13,0),pt(0,.04),pt(.13,0)]:[pt(0,0)];
        if(roots.some(q=>waters.some(w=>waterClearance(w.water,world(item,q))>-.025*item.scale)))issue(item.id,'树根与苇根须在岸上，请移离水面。');
        if(item.type==='tree'){
          if(treeLift(item,ground)>.65*item.height)issue(item.id,'枝叶碰到陡坡，请移向缓坡或调高树身。');
        }
      }
    });
    for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){
      const a=solids[i],b=solids[j],ta=a.item.type,tb=b.item.type;
      if(['tree','reeds'].includes(ta)&&['tree','reeds'].includes(tb))continue;
      // All roofs, canopies, oars and branches take part, with breathing room.
      const gap=ta==='house'||tb==='house'?.05:.025;
      if(!overlaps(extent([pt(a.bounds.minX,a.bounds.minZ),pt(a.bounds.maxX,a.bounds.maxZ)],gap),b.bounds))continue;
      if(a.polys.some(pa=>b.polys.some(pb=>closePolygons(pa,pb,gap)))){
        const reason=ta==='boat'&&tb==='boat'?'舟之间须留出间距，船身、篷顶与船桨不能相交。':'素材相交：请给屋檐、枝叶与小景留出间距。';issue(a.item.id,reason);issue(b.item.id,reason);
      }
    }
    return {ok:issues.length===0,issues,layers};
  }
  function path2D(ctx, points, close = true) {
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].z);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].z);
    if (close) ctx.closePath();
  }
  function stroke2D(ctx, points, color, width, alpha = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
    path2D(ctx, points, false); ctx.stroke(); ctx.globalAlpha = 1;
  }
  function drawMountain(ctx, item, color, options) {
    ctx.save();const [sx,sz]=MOUNTAIN_SHAPE[item.variant];ctx.scale(sx,sz);
    if(options.lowDetail){path2D(ctx,MOUNTAIN);ctx.fillStyle=color;ctx.fill();ctx.restore();return;}
    const wash = ctx.createLinearGradient(-.6, -.8, .9, .8);
    wash.addColorStop(0, tint(color, .30)); wash.addColorStop(.5, color); wash.addColorStop(1, tint(color, .12));
    path2D(ctx, MOUNTAIN); ctx.fillStyle = wash; ctx.fill();
    if(item.variant==='hill'){stroke2D(ctx,MOUNTAIN.map(q=>mix(PEAK,q,.64)),tint(color,-.20),.012,.45);ctx.restore();return;}
    ctx.save(); ctx.clip();
    const ridge = [pt(-1.23,.44),pt(-.87,-.12),pt(-.35,-.57),pt(.02,-.22),pt(.60,-.38),pt(1.12,.36)];
    path2D(ctx, ridge.concat([pt(.72,.66),pt(-.2,.41),pt(-.93,.64)])); ctx.fillStyle = tint(color, -.16); ctx.globalAlpha = .22; ctx.fill(); ctx.globalAlpha = 1;
    stroke2D(ctx, sampleCurves(curves(ridge)), tint(color, -.4), .022, .56);
    for (let i = 0; i < 29; i++) {
      const x = -1.17 + i * .082, top = -.31 - .19 * Math.exp(-Math.pow((x + .33) / .37, 2));
      const points = [pt(x, top + .035 * Math.sin(i * 2.7)),pt(x - .05, top + .23),pt(x + .10, .30 + .16 * Math.sin(i * 1.8)),pt(x + .21, .63)];
      stroke2D(ctx, sampleCurves(curves(points)), tint(color, i % 4 ? -.33 : .5), i % 4 ? .008 : .012, .22);
    }
    for (let i = 0; i < 32; i++) {
      const x = -1.1 + (i * .137 % 2.2), z = .33 + .25 * Math.sin(i * 2.4);
      stroke2D(ctx, [pt(x,z),pt(x+.024,z-.014)], tint(color,-.35), .014, .3);
    }
    ctx.restore(); stroke2D(ctx, MOUNTAIN.concat([MOUNTAIN[0]]), tint(color, -.26), .014, .66);
    ctx.restore();
  }
  function drawWater(ctx, item, color) {
    const path = waterData(item).path;
    stroke2D(ctx, path, tint(color, .35), item.width);
    stroke2D(ctx, path, tint(color, .45), item.width * .64, .25);
    // Sparse same-pigment currents; never a white lattice.
    for (let i = 8; i + 12 < path.length; i += 25) stroke2D(ctx, path.slice(i, i + 12).map(p => pt(p.x, p.z + item.width * .18)), tint(color, -.12), .007, .34);
  }
  function drawTree(ctx, item, color, options) {
    const shape=TREE_SHAPES[item.variant];
    if(item.variant==='bamboo')for(const [x,z] of [[-.13,0],[0,.04],[.13,0]]){path2D(ctx,rect(x,z,.014,.014));ctx.fillStyle=tint(color,-.25);ctx.fill();}
    shape.crowns.forEach(c => stroke2D(ctx, [pt(0,0),shape.bend,pt(c[0],c[1])], tint(color,-.48), .024));
    shape.crowns.forEach((c, i) => {
      path2D(ctx, ellipse(c[0], c[1], c[2], c[3])); ctx.fillStyle = tint(color, i % 2 ? .06 : -.08); ctx.fill();
      for (let k = 0; k < (options.lowDetail||item.variant==='bamboo'?0:7); k++) {
        const a = k * 2.4 + i, x = c[0] + Math.cos(a) * c[2] * .60, z = c[1] + Math.sin(a) * c[3] * .58;
        path2D(ctx, ellipse(x,z,.046,.025,12)); ctx.fillStyle = tint(color,k % 3 ? .19 : -.26); ctx.globalAlpha = .65; ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    stroke2D(ctx,[pt(0,0),shape.bend,shape.tip],tint(color,-.52),.029);
  }
  function drawHouse(ctx, item, color) {
    if(item.variant==='pavilion'){
      path2D(ctx,PAVILION);ctx.fillStyle=color;ctx.fill();
      for(let i=0;i<8;i++){path2D(ctx,[pt(0,0),PAVILION[i],PAVILION[(i+1)%8]]);ctx.fillStyle=tint(color,i<4?.15:-.12);ctx.fill();stroke2D(ctx,[pt(0,0),PAVILION[i]],tint(color,-.35),.012);}
      path2D(ctx,ellipse(0,0,.06,.06,12));ctx.fillStyle=tint(color,-.30);ctx.fill();return;
    }
    if(item.variant==='hall'){
      ctx.save();ctx.translate(0,.43);ctx.scale(.30/.65,.22/.43);drawHouse(ctx,{...item,variant:'cottage'},tint(color,.06));ctx.restore();
      ctx.save();ctx.scale(.86/.65,.46/.43);drawHouse(ctx,{...item,variant:'cottage'},color);ctx.restore();return;
    }
    path2D(ctx, ROOF); ctx.fillStyle = tint(color,.18); ctx.fill();
    path2D(ctx,[pt(-.65,0),pt(.65,0),pt(.65,.43),pt(-.65,.43)]); ctx.fillStyle = color; ctx.fill();
    for (let i = -7; i <= 7; i++) {
      const x = i * .077;
      for (const sign of [-1,1]) stroke2D(ctx,sampleCurves([[pt(x,0),pt(x*.98,.22*sign),pt(x*1.07,.405*sign)]]),tint(color,-.42),.009,.60);
    }
    for (const z of [-.32,-.20,.20,.32]) stroke2D(ctx,[pt(-.60,z),pt(.60,z)],tint(color,.48),.008,.48);
    stroke2D(ctx,[pt(-.65,0),pt(.65,0)],tint(color,-.50),.029);
    stroke2D(ctx,ROOF.concat([ROOF[0]]),tint(color,-.40),.018);
    stroke2D(ctx,[pt(-.20,.40),pt(-.20,.43),pt(.20,.43),pt(.20,.40)],tint(color,-.48),.022);
  }
  function drawBoat(ctx, item, color) {
    path2D(ctx,HULL); ctx.fillStyle = tint(color,-.13); ctx.fill();
    path2D(ctx,HULL.map(p=>pt(p.x*.89,p.z*.66))); ctx.fillStyle=tint(color,.38); ctx.fill();
    stroke2D(ctx,HULL.concat([HULL[0]]),tint(color,-.43),.014);
    for (const x of [-.20,.17]) {
      path2D(ctx,[pt(x-.031,-.14),pt(x+.031,-.14),pt(x+.031,.14),pt(x-.031,.14)]); ctx.fillStyle=color; ctx.fill();
    }
    stroke2D(ctx,OAR,tint(color,-.42),.018); path2D(ctx,PADDLE); ctx.fillStyle=tint(color,-.17); ctx.fill();
    if(item.variant==='canopy'){
      path2D(ctx,CANOPY);ctx.fillStyle=tint(color,.33);ctx.fill();
      for(let x=-.28;x<.30;x+=.07)stroke2D(ctx,[pt(x,-.135),pt(x,.135)],tint(color,-.3),.009,.7);
      stroke2D(ctx,CANOPY.concat([CANOPY[0]]),tint(color,-.4),.012);
    }
  }
  function drawRock(ctx,item,color){path2D(ctx,ROCK);ctx.fillStyle=tint(color,-.08);ctx.fill();for(let i=0;i<ROCK.length;i++){path2D(ctx,[pt(-.05,-.03),ROCK[i],ROCK[(i+1)%ROCK.length]]);ctx.fillStyle=tint(color,i<4?.22:-.12);ctx.fill();}}
  function drawReeds(ctx,item,color){REED_STEMS.forEach(([x,z,tx,tz])=>{stroke2D(ctx,[pt(x,z),pt(tx,tz)],color,.013);stroke2D(ctx,[pt(x,z),pt(x+.09,z+.025)],tint(color,-.2),.022);path2D(ctx,ellipse(tx,tz,.022,.022,12));ctx.fillStyle=tint(color,.2);ctx.fill();});}
  function drawLantern(ctx,item,color){path2D(ctx,LANTERN);ctx.fillStyle=color;ctx.fill();for(let i=0;i<4;i++){path2D(ctx,[pt(0,0),LANTERN[i],LANTERN[(i+1)%4]]);ctx.fillStyle=tint(color,i<2?.28:-.15);ctx.fill();}path2D(ctx,rect(0,0,.035,.035));ctx.fillStyle=tint(color,-.4);ctx.fill();}
  function drawMerged(ctx,s,color,options){
    s.component.forEach(e=>{path2D(ctx,e.poly);ctx.fillStyle=color;ctx.fill();});
    if(options.lowDetail)return;
    const max=s.vertices.reduce((m,v,i)=>i%3===1?Math.max(m,v):m,0);
    for(const level of [.22,.48,.74]){
      ctx.beginPath();const v=s.vertices,h=max*level;
      for(let i=0;i<s.indices.length;i+=3){const hits=[];for(let j=0;j<3;j++){const a=s.indices[i+j]*3,b=s.indices[i+(j+1)%3]*3;if((v[a+1]>=h)!==(v[b+1]>=h)){const t=(h-v[a+1])/(v[b+1]-v[a+1]);hits.push(pt(v[a]+t*(v[b]-v[a]),v[a+2]+t*(v[b+2]-v[a+2])));}}if(hits.length===2){ctx.moveTo(hits[0].x,hits[0].z);ctx.lineTo(hits[1].x,hits[1].z);}}
      ctx.strokeStyle=tint(color,-.26);ctx.lineWidth=.012;ctx.globalAlpha=.38;ctx.stroke();ctx.globalAlpha=1;
    }
  }
  // Optional canvases are reset in place; lowDetail/dragging omits decorative ink.
  function drawLayers(plan, width, height, options={}) {
    const p = normalize(plan), w = clamp(Math.round(finite(width,950)),1,8192), h = clamp(Math.round(finite(height,620)),1,8192);
    const canvases = [0,1,2].map(i => {
      const canvas = options.canvases&&options.canvases[i] || root.document.createElement('canvas'); canvas.width=w; canvas.height=h; return canvas;
    });
    const contexts = canvases.map(c => {
      const ctx=c.getContext('2d'); if (!ctx) throw new Error('无法创建2D印稿画布');
      ctx.setTransform(w/W,0,0,h/D,w/2,h/2); ctx.lineJoin='round'; ctx.lineCap='round'; return ctx;
    });
    // Water is always printed beneath mountains regardless of insertion order.
    options={...options,lowDetail:!!(options.lowDetail||options.dragging||w<=640)};
    const merged=new Map();if(!options.lowDetail)terrain(p.items).surfaces.filter(s=>s.component.length>1).forEach(s=>s.component.forEach(e=>merged.set(e.item.id,s)));
    const drawn=new Set();
    p.items.slice().sort((a,b)=>ORDER[a.type]-ORDER[b.type]).forEach(item => {
      if(merged.has(item.id)){const s=merged.get(item.id);if(!drawn.has(s)){drawMerged(contexts[0],s,p.palette[0],options);drawn.add(s);}return;}
      const layer=LAYER[item.type],ctx=contexts[layer];ctx.save();ctx.translate(item.x,item.z);ctx.rotate(item.rotation*Math.PI/180);ctx.scale(item.scale,item.scale);
      ({mountain:drawMountain,water:drawWater,tree:drawTree,house:drawHouse,boat:drawBoat,rock:drawRock,reeds:drawReeds,lantern:drawLantern})[item.type](ctx,item,p.palette[layer],options);ctx.restore();
    });
    return canvases;
  }
  function createLayers(T, plan, options) {
    if (!T || !options || typeof options.material !== 'function') throw new TypeError('createLayers需要THREE和host material(color,kind)');
    const p=normalize(plan),layers=[new T.Group(),new T.Group(),new T.Group()],material=options.material,ground=terrain(p.items);
    layers.forEach((g,i)=>{g.name='creator-plate-'+i;g.userData.layer=i;});
    function mesh(parent, geometry, color, kind, name) {
      const obj=new T.Mesh(geometry,material(color,kind));obj.name=name;parent.add(obj);return obj;
    }
    function geometry(vertices, indices) {
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));if(indices)g.setIndex(indices);g.computeVertexNormals();return g;
    }
    function rod(parent,a,b,r,color,kind='wood') {
      const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
      const obj=mesh(parent,new T.CylinderGeometry(r*.78,r,delta.length(),7),color,kind,'branch-or-rail');
      obj.position.copy(start.add(end).multiplyScalar(.5));obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return obj;
    }
    function box(parent,size,position,color,kind,name) {
      const obj=mesh(parent,new T.BoxGeometry(...size),color,kind,name);obj.position.set(...position);return obj;
    }
    function mountain(group,item,color) {
      const vertices=[];FIELD_VARIANTS[item.variant].forEach(v=>vertices.push(v.x,v.h*item.height,v.z));
      const obj=mesh(group,geometry(vertices,FACES.flat()),color,'rock','broad-slope-mountain');obj.userData.terrain=true;
    }
    function water(group,item,color) {
      const path=waterData(item).path,r=item.width/2,vertices=[],indices=[];
      function triangle(a,b,c) { const n=vertices.length/3;for(const v of [a,b,c])vertices.push(v.x,0,v.z);indices.push(n,n+1,n+2); }
      for(let i=1;i<path.length;i++) {
        const a=path[i-1],b=path[i],length=dist(a,b);if(length<EPS)continue;
        const nx=-(b.z-a.z)/length*r,nz=(b.x-a.x)/length*r;
        const al=pt(a.x+nx,a.z+nz),ar=pt(a.x-nx,a.z-nz),bl=pt(b.x+nx,b.z+nz),br=pt(b.x-nx,b.z-nz);
        triangle(al,bl,ar);triangle(ar,bl,br);
      }
      // Overlapping coplanar fans share one material and close all round joins.
      path.forEach(center=>{const rim=ellipse(center.x,center.z,r,r,40);for(let i=0;i<rim.length;i++)triangle(center,rim[(i+1)%rim.length],rim[i]);});
      mesh(group,geometry(vertices,indices),tint(color,.35),'water','smooth-water');
    }
    function tree(group,item,color) {
      const h=item.height,s=TREE_SHAPES[item.variant],b=s.bend,t=s.tip,bamboo=item.variant==='bamboo',lift=treeLift(item,ground);
      if(bamboo){
        for(const [x,z,top] of [[-.13,0,.96],[0,.04,1.18],[.13,0,1.02]]){
          const q=world(item,pt(x,z)),bottom=(ground.height(q)-group.position.y)/item.scale;
          rod(group,[x,bottom,z],[x,top*h+lift,z],.012,tint(color,-.25));
          for(let y=.2;y<top;y+=.20)box(group,[.028,.013*h,.027],[x,y*h,z],tint(color,.24),'leaf','bamboo-node');
        }
      }else{
        rod(group,[0,0,0],[b.x,.54*h+lift*.65,b.z],.029,tint(color,-.48));
        rod(group,[b.x,.42*h+lift*.45,b.z],[t.x,(item.variant==='bent'?.88:1.04)*h+lift,t.z],.018,tint(color,-.44));
      }
      s.crowns.forEach((c,i)=>{
        const [x,z,rx,rz,y]=c;
        rod(group,[b.x,(bamboo?y*.87:.36)*h+lift*.6,b.z],[x,y*h+lift,z],bamboo?.007:.012,tint(color,-.4));
        const leaf=mesh(group,new T.SphereGeometry(1,16,10),tint(color,i%2?.06:-.08),'leaf','foliage-cluster');
        leaf.position.set(x,y*h+lift,z);leaf.scale.set(rx,(bamboo?.045:.125)*h,rz);
        for(let k=0;k<(bamboo?0:3);k++){
          const a=k*2.4+i,lobe=mesh(group,new T.SphereGeometry(1,10,7),tint(color,.16),'leaf','leaf-tip');
          lobe.position.set(x+Math.cos(a)*rx*.50,(y+.075)*h+lift,z+Math.sin(a)*rz*.48);lobe.scale.set(rx*.43,.073*h,rz*.43);
        }
      });
    }
    function house(group,item,color) {
      if(item.variant==='pavilion'){
        box(group,[.80,.05*item.height,.80],[0,.025*item.height,0],tint(color,.40),'rock','pavilion-platform');
        // Roof triangles and posts meet exactly at each post's radial support.
        tent(group,PAVILION,.66*item.height,1.0*item.height,color,'pavilion-roof');
        for(let i=0;i<8;i++){const a=i*TAU/8,x=.40*Math.cos(a),z=.40*Math.sin(a),top=(1-.34*.40/.64)*item.height;
          rod(group,[x,.05*item.height,z],[x,top,z],.022,tint(color,-.28));}
        return;
      }
      if(item.variant==='hall'){
        const main=new T.Group();main.scale.set(.86/.65,1.16,.46/.43);group.add(main);house(main,{...item,variant:'cottage'},color);
        const porch=new T.Group();porch.position.z=.43;porch.scale.set(.30/.65,.68,.22/.43);group.add(porch);house(porch,{...item,variant:'cottage'},tint(color,.06));return;
      }
      const h=item.height;
      box(group,[.85,.60*h,.56],[0,.30*h,0],tint(color,.57),'plaster','plaster-walls');
      box(group,[.16,.38*h,.025],[0,.19*h,.291],tint(color,-.43),'wood','door');
      for(const x of [-.27,.27]) {
        box(group,[.16,.20*h,.026],[x,.40*h,.292],tint(color,-.31),'wood','window');
        for(const offset of [-.035,.035]) box(group,[.012,.185*h,.029],[x+offset,.40*h,.309],tint(color,.31),'wood','window-lattice');
      }
      const vertices=[],indices=[],nx=24,nz=20;
      function roofY(x,z) { const t=Math.abs(z)/.43;return (.82-.30*t+.11*Math.pow(t,4)+.075*Math.pow(Math.abs(x)/.65,5)*t*t)*h; }
      // Plastered gables close the volume up to the roof; eaves overhang it.
      const loft=[],loftFaces=[],steps=16,offset=(steps+1)*2;
      for(const x of [-.425,.425])for(let j=0;j<=steps;j++){
        const z=-.28+.56*j/steps;loft.push(x,.60*h,z,x,roofY(x,z)-.008*h,z);
      }
      for(let j=0;j<steps;j++){
        const a=j*2,b=a+2,c=a+1,d=a+3;
        loftFaces.push(a,b,c,b,d,c,a+offset,c+offset,b+offset,b+offset,c+offset,d+offset);
        loftFaces.push(c,d,c+offset,c+offset,d,d+offset);
      }
      for(const j of [0,steps]){
        const a=j*2,b=a+offset,c=a+1,d=b+1;
        if(j===0)loftFaces.push(a,c,b,b,c,d);else loftFaces.push(a,b,c,b,d,c);
      }
      mesh(group,geometry(loft,loftFaces),tint(color,.57),'plaster','plaster-gables');
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const x=-.65+1.3*i/nx,z=-.43+.86*j/nz;vertices.push(x,roofY(x,z),z);
      }
      for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
      mesh(group,geometry(vertices,indices),color,'roof-tile','swept-eaves-roof');
      // Close the visible roof edge rather than relying on host double-sided materials.
      for(const sign of [-1,1]) {
        const edge=[],faces=[];
        for(let i=0;i<=nx;i++){const x=-.65+1.3*i/nx,z=.43*sign,y=roofY(x,z);edge.push(x,y,z,x,y-.027*h,z);}
        for(let i=0;i<nx;i++){const a=i*2;if(sign>0)faces.push(a,a+1,a+2,a+1,a+3,a+2);else faces.push(a,a+2,a+1,a+1,a+2,a+3);}
        mesh(group,geometry(edge,faces),tint(color,-.12),'roof-tile','eave-edge');
      }
      rod(group,[-.635,.831*h,0],[.635,.831*h,0],.015,color,'roof-tile');
      for(let i=-7;i<=7;i++)for(const sign of [-1,1]){
        const x=i*.077;
        for(let j=0;j<6;j++){
          const z0=sign*.42*j/6,z1=sign*.42*(j+1)/6;
          rod(group,[x,roofY(x,z0)+.005,z0],[x,roofY(x,z1)+.005,z1],.007,tint(color,-.17),'roof-tile');
        }
      }
    }
    function boat(group,item,color) {
      const vertices=[],indices=[],nx=32,nz=16,h=item.height;
      // Outer and inner curved surfaces form a thin, open, leaf-shaped wooden shell.
      for(let side=0;side<2;side++)for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
        // Cosine spacing uses exactly the same 64 rim vertices as HULL.
        const u=-Math.cos(Math.PI*i/nx),v=-Math.PI/2+Math.PI*j/nz;
        const width=.185*Math.pow(Math.max(0,1-u*u),.7);
        const y=-Math.min(.015*h,.020/item.scale)+(.115*(1-Math.cos(v))+.095*Math.pow(u,4)+(side?.016:0))*h;
        vertices.push(.59*u,y,width*Math.sin(v)*(side?.88:1));
      }
      const stride=(nx+1)*(nz+1);
      for(let side=0;side<2;side++)for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
        const a=side*stride+i*(nz+1)+j,b=a+nz+1;
        if(side)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);
      }
      for(const j of [0,nz])for(let i=0;i<nx;i++){
        const a=i*(nz+1)+j,b=a+nz+1,c=a+stride,d=b+stride;
        if(j===0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);
      }
      mesh(group,geometry(vertices,indices),color,'wood','curved-open-hull');
      for(const x of [-.20,.17])box(group,[.062,.028*h,.28],[x,.092*h,0],tint(color,.24),'wood','seat-board');
      rod(group,[OAR[0].x,.125*h,OAR[0].z],[OAR[1].x,.08*h,OAR[1].z],.009,tint(color,-.32));
      const paddle=[];PADDLE.forEach(q=>paddle.push(q.x,.08*h,q.z));
      mesh(group,geometry(paddle,[0,2,1,0,3,2,0,1,2,0,2,3]),tint(color,-.16),'wood','oar-blade');
      if(item.variant==='canopy'){
        const v=[],f=[],n=16;
        for(const x of [-.30,.30])for(let j=0;j<=n;j++){const a=j*Math.PI/n;v.push(x,(.13+.27*Math.sin(a))*h,.135*Math.cos(a));}
        for(let j=0;j<n;j++){const b=n+1;f.push(j,j+b,j+1,j+1,j+b,j+b+1);}
        mesh(group,geometry(v,f),tint(color,.28),'wood','woven-canopy');
        const inside=v.map((n,i)=>i%3===1?n-.006*h:n),back=[];for(let j=0;j<f.length;j+=3)back.push(f[j+2],f[j+1],f[j]);
        mesh(group,geometry(inside,back),tint(color,.12),'wood','canopy-underside');
        for(const x of [-.28,.28])for(const z of [-.12,.12])rod(group,[x,.10*h,z],[x,(.13+.27*Math.sqrt(1-(z/.135)**2))*h,z],.009,tint(color,-.20)).name='canopy-post';
        for(let x=-.28;x<.30;x+=.07)for(let j=0;j<8;j++){const a=j*Math.PI/8,b=(j+1)*Math.PI/8;rod(group,[x,(.13+.27*Math.sin(a))*h,.135*Math.cos(a)],[x,(.13+.27*Math.sin(b))*h,.135*Math.cos(b)],.004,tint(color,-.24));}
      }
    }
    function tent(group,outline,eave,peak,color,name){
      const v=[0,peak,0],f=[];outline.forEach(q=>v.push(q.x,eave,q.z));
      for(let i=0;i<outline.length;i++){const a=i+1,b=(i+1)%outline.length+1;f.push(0,b,a);}
      const obj=mesh(group,geometry(v,f),color,'roof-tile',name);return obj;
    }
    function rock(group,item,color){
      const v=[],f=[],base=q=>(ground.height(world(item,q))-group.position.y)/item.scale;
      ROCK.forEach(q=>v.push(q.x,base(q),q.z));
      ROCK.forEach(q=>{const t=pt(q.x*.54-.035,q.z*.54-.025);v.push(t.x,base(t)+.22*item.height,t.z);});
      v.push(-.035,base(pt(-.035,-.025))+.34*item.height,-.025);
      for(let i=0;i<8;i++){const j=(i+1)%8;f.push(i,j,i+8,j,j+8,i+8,i+8,j+8,16);}
      // Orient every upper face toward the sky.
      for(let i=0;i<f.length;i+=3){const [a,b,c]=f.slice(i,i+3).map(k=>pt(v[k*3],v[k*3+2]));if(cross(a,b,c)>0)[f[i+1],f[i+2]]=[f[i+2],f[i+1]];}
      mesh(group,geometry(v,f),tint(color,-.04),'rock','grounded-stone');
    }
    function reeds(group,item,color){REED_STEMS.forEach(([x,z,tx,tz,h])=>{
      const root=(ground.height(world(item,pt(x,z)))-group.position.y)/item.scale;
      rod(group,[x,root,z],[tx,root+h*item.height,tz],.007,color,'leaf');
      rod(group,[x,root+.22*item.height,z],[x+.09,root+.34*item.height,z+.025],.010,tint(color,-.2),'leaf');
      const head=mesh(group,new T.SphereGeometry(1,8,6),tint(color,.2),'leaf','reed-head');head.position.set(tx,root+h*item.height,tz);head.scale.set(.022,.055*item.height,.022);
    });}
    function lantern(group,item,color){const h=item.height;
      box(group,[.25,.07*h,.25],[0,.035*h,0],tint(color,.32),'rock','lantern-base');
      box(group,[.065,.46*h,.065],[0,.30*h,0],tint(color,.18),'rock','lantern-stem');
      box(group,[.20,.045*h,.20],[0,.55*h,0],tint(color,.25),'rock','lantern-sill');
      box(group,[.12,.17*h,.12],[0,.65*h,0],tint(color,-.30),'plaster','lantern-window');
      for(const x of [-.083,.083])for(const z of [-.083,.083])box(group,[.03,.18*h,.03],[x,.65*h,z],tint(color,.2),'rock','lantern-frame');
      tent(group,LANTERN,.74*h,.89*h,color,'lantern-roof');
      box(group,[.045,.06*h,.045],[0,.915*h,0],tint(color,-.20),'rock','lantern-finial');
    }
    const merged=new Map();ground.surfaces.filter(s=>s.component.length>1).forEach(s=>s.component.forEach(e=>merged.set(e.item.id,s)));
    const drawn=new Set();
    p.items.slice().sort((a,b)=>ORDER[a.type]-ORDER[b.type]).forEach(item=>{
      if(merged.has(item.id)){
        const s=merged.get(item.id);if(!drawn.has(s)){const group=new T.Group();group.name='creator-merged-terrain';group.userData={type:'mountain',merged:true,itemIds:s.component.map(e=>e.item.id)};layers[0].add(group);const obj=mesh(group,geometry(s.vertices,s.indices),p.palette[0],'rock','continuous-mountain-surface');obj.userData.terrain=true;drawn.add(s);}return;
      }
      const group=new T.Group(),layer=LAYER[item.type];group.name='creator-item-'+item.id;
      group.userData={itemId:item.id,type:item.type,variant:item.variant,x:item.x,z:item.z};
      const y=item.type==='water'||item.type==='boat'?WATER_Y:['tree','rock','reeds'].includes(item.type)?ground.height(pt(item.x,item.z)):0;
      group.position.set(item.x,y,item.z);group.rotation.y=-item.rotation*Math.PI/180;group.scale.setScalar(item.scale);layers[layer].add(group);
      ({mountain,water,tree,house,boat,rock,reeds,lantern})[item.type](group,item,p.palette[layer]);
    });
    return layers;
  }
  const SAMPLES=Object.freeze([{id:'river',label:'溪山归舟'},{id:'village',label:'竹里山居'}].map(Object.freeze));
  function samplePlan(name='river') {
    const item=(type,id,x,z,extra)=>Object.assign(defaults(type,id,x,z),extra||{});
    if(name==='village')return normalize({version:1,title:'竹里山居',palette:PALETTE.slice(),items:[
      item('mountain','village-hill',-2.1,-1.6,{variant:'hill',scale:.95,height:1.5}),
      item('mountain','village-ridge',-.5,-1.7,{variant:'ridge',scale:.82,height:1.35}),
      item('house','village-hall',1.6,-1.28,{variant:'hall',scale:.78,rotation:0}),
      item('house','village-pavilion',-1.45,.35,{variant:'pavilion',scale:.70}),
      item('house','village-cottage',1.8,.25,{variant:'cottage',scale:.65}),
      item('tree','village-bamboo',.10,-.28,{variant:'bamboo',scale:.82}),
      item('tree','village-bent',-3.10,.15,{variant:'bent',scale:.68,rotation:18}),
      item('tree','village-pine',3.25,-1.30,{scale:.66}),
      item('water','village-stream',0,1.70,{width:.75,points:[pt(-3.7,-.05),pt(-1.2,.15),pt(1.2,-.12),pt(3.7,.02)]}),
      item('boat','village-canopy',-1.6,1.72,{variant:'canopy',scale:.65}),
      item('reeds','village-reeds',2.75,1.1,{scale:.65}),
      item('rock','village-stone',-.60,.60,{scale:.65}),
      item('lantern','village-lantern',.65,.55,{scale:.70})
    ]});
    return normalize({version:1,title:'溪山归舟',palette:PALETTE.slice(),items:[
      item('mountain','mountain-main',-2.2,-1.0,{scale:1.02,rotation:-12,height:2.05}),
      item('mountain','mountain-far',.05,-1.53,{scale:.72,rotation:14,height:1.25}),
      item('water','water-river',.25,1.12,{width:.82,points:[pt(-3.5,.10),pt(-1.45,-.18),pt(.8,.20),pt(3.5,-.42)]}),
      item('tree','tree-slope',-2.4,-.70,{scale:.68,height:.92}),
      item('tree','tree-bank',-3.65,.22,{scale:.67,rotation:-22}),
      item('tree','tree-east',2.95,-1.18,{scale:.73,rotation:18}),
      item('tree','tree-court',1.54,-1.18,{scale:.58,height:.85}),
      item('house','house-court',2.26,-.38,{scale:.75,rotation:-7,height:1}),
      item('boat','boat-leaf',.4,1.15,{scale:.72,rotation:3})
    ]});
  }
  root.YSHCreatorArt={W,D,TYPES:TYPES.slice(),VARIANTS,variants,SAMPLES,ORDER,layerOf,drawOrder,defaults,normalize,drawLayers,createLayers,validate,hitTest,bounds,samplePlan};
})(typeof window!=='undefined'?window:globalThis);
