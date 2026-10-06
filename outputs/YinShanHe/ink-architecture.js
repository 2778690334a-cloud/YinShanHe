(function (global) {
  'use strict';

  function createTemple(THREE, options) {
    if (!THREE || !THREE.Group || !THREE.BufferGeometry || !THREE.Mesh || !THREE.InstancedMesh) {
      throw new TypeError('YSHArchitecture.createTemple requires a THREE namespace.');
    }
    options = options || {};
    var root = new THREE.Group();
    root.name = 'YSH-temple-complex';

    var cache = Object.create(null);
    function material(color, kind) {
      var key = kind + ':' + color;
      if (cache[key]) return cache[key];
      var result = typeof options.material === 'function' ? options.material(color, kind) : null;
      if (!result || !result.isMaterial) result = new THREE.MeshLambertMaterial({ color: color, flatShading: true });
      cache[key] = result;
      return result;
    }
    var mats = {
      stone: material(0x817464, 'stone-block'), stoneLight: material(0xa08e76, 'stone-block'), stoneDark: material(0x625b54, 'stone-block'),
      plaster: material(0xb95b3d, 'plaster'), plasterWarm: material(0xcd7750, 'plaster'), plasterDeep: material(0x91432f, 'plaster'),
      wood: material(0x583528, 'wood'), woodLight: material(0x794830, 'wood'), woodDark: material(0x30231f, 'wood'),
      roof: material(0x263d49, 'roof-tile'), roofLight: material(0x3f5962, 'roof-tile'), roofDark: material(0x192d37, 'roof-tile')
    };

    var unitBox = new THREE.BoxGeometry(1, 1, 1);
    var unitColumn = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
    var boxes = Object.create(null), columns = [];
    function queueBox(batch, x, y, z, sx, sy, sz, ry) {
      if (!boxes[batch]) boxes[batch] = [];
      boxes[batch].push([x, y, z, sx, sy, sz, ry || 0]);
    }
    function queueColumn(x, y, z, radius, height) { columns.push([x, y, z, radius, height]); }
    function addMesh(geometry, mat, x, y, z, name) {
      var mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      mesh.name = name;
      root.add(mesh);
      return mesh;
    }
    function addBlock(x, y, z, sx, sy, sz, mat, name) {
      var mesh = addMesh(unitBox, mat, x, y, z, name);
      mesh.scale.set(sx, sy, sz);
      return mesh;
    }

    function roofHeight(spec, x, z) {
      var ax = Math.min(1, Math.abs(x) / (spec.width * 0.5));
      var az = Math.min(1, Math.abs(z) / (spec.depth * 0.5));
      var profile = ax;
      if (spec.type === 'hip') profile = Math.max(ax, Math.max(0, (az - spec.ridgeRatio) / (1 - spec.ridgeRatio)));
      var sweep = 1 - 0.58 * profile - 0.42 * profile * profile;
      return spec.height * sweep + 0.026 * Math.pow(ax, 5) + (spec.type === 'hip' ? 0.035 * Math.pow(ax * az, 2.5) : 0);
    }
    function createRoofGeometry(spec) {
      var sx = 24, sz = 16, row = sx + 1, layerSize = row * (sz + 1), p = [], idx = [], x, z, layer;
      for (layer = 0; layer < 2; layer++) for (z = 0; z <= sz; z++) for (x = 0; x <= sx; x++) {
        var px = -spec.width * 0.5 + spec.width * x / sx;
        var pz = -spec.depth * 0.5 + spec.depth * z / sz;
        p.push(px, roofHeight(spec, px, pz) - layer * spec.thickness, pz);
      }
      function top(ix, iz) { return iz * row + ix; }
      function bottom(ix, iz) { return layerSize + iz * row + ix; }
      function side(ta, tb, ba, bb) { idx.push(ta, tb, ba, tb, bb, ba); }
      for (z = 0; z < sz; z++) for (x = 0; x < sx; x++) {
        var a = top(x, z), b = top(x + 1, z), c = top(x + 1, z + 1), d = top(x, z + 1);
        idx.push(a, d, b, b, d, c);
        a = bottom(x, z); b = bottom(x + 1, z); c = bottom(x + 1, z + 1); d = bottom(x, z + 1);
        idx.push(a, b, d, b, c, d);
      }
      for (x = 0; x < sx; x++) {
        side(top(x + 1, 0), top(x, 0), bottom(x + 1, 0), bottom(x, 0));
        side(top(x, sz), top(x + 1, sz), bottom(x, sz), bottom(x + 1, sz));
      }
      for (z = 0; z < sz; z++) {
        side(top(0, z), top(0, z + 1), bottom(0, z), bottom(0, z + 1));
        side(top(sx, z + 1), top(sx, z), bottom(sx, z + 1), bottom(sx, z));
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    }

    function builder() { return { p: [], i: [] }; }
    function appendTube(out, points, radius, sides) {
      var first = out.p.length / 3, tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), ref = new THREE.Vector3(), radial = new THREE.Vector3();
      var n, s;
      for (n = 0; n < points.length; n++) {
        if (n === 0) tangent.subVectors(points[1], points[0]);
        else if (n === points.length - 1) tangent.subVectors(points[n], points[n - 1]);
        else tangent.subVectors(points[n + 1], points[n - 1]);
        tangent.normalize();
        if (Math.abs(tangent.y) < 0.92) ref.set(0, 1, 0); else ref.set(0, 0, 1);
        normal.crossVectors(ref, tangent).normalize(); binormal.crossVectors(tangent, normal).normalize();
        for (s = 0; s < sides; s++) {
          var angle = Math.PI * 2 * s / sides;
          radial.copy(normal).multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
          out.p.push(points[n].x + radial.x * radius, points[n].y + radial.y * radius, points[n].z + radial.z * radius);
        }
      }
      for (n = 0; n < points.length - 1; n++) for (s = 0; s < sides; s++) {
        var next = (s + 1) % sides, a = first + n * sides + s, b = first + n * sides + next, c = first + (n + 1) * sides + next, d = first + (n + 1) * sides + s;
        out.i.push(a, b, d, b, c, d);
      }
      var start = out.p.length / 3; out.p.push(points[0].x, points[0].y, points[0].z);
      var end = out.p.length / 3, last = first + (points.length - 1) * sides; out.p.push(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z);
      for (s = 0; s < sides; s++) { var ns = (s + 1) % sides; out.i.push(start, first + ns, first + s, end, last + s, last + ns); }
    }
    function finish(out) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(out.p, 3)); g.setIndex(out.i); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    }
    function roofPoint(spec, x, z, lift) { return new THREE.Vector3(x, roofHeight(spec, x, z) + lift, z); }

    function addRoof(spec, cx, baseY, cz, name) {
      addMesh(createRoofGeometry(spec), mats.roof, cx, baseY, cz, name + '-closed-roof');
      var tileA = builder(), tileB = builder(), tileCount = Math.max(9, Math.round(spec.depth / 0.036));
      for (var t = 0; t < tileCount; t++) {
        var tz = -spec.depth * 0.46 + spec.depth * 0.92 * t / (tileCount - 1);
        for (var side = -1; side <= 1; side += 2) {
          var path = [];
          for (var k = 0; k <= 10; k++) { var tx = side * spec.width * 0.495 * k / 10; path.push(roofPoint(spec, tx, tz, 0.008)); }
          appendTube(t % 4 === 0 ? tileB : tileA, path, 0.0052, 5);
        }
      }
      addMesh(finish(tileA), mats.roofDark, cx, baseY, cz, name + '-batched-field-tiles');
      addMesh(finish(tileB), mats.roofLight, cx, baseY, cz, name + '-batched-weathered-tiles');

      var trim = builder(), ridge = [], ridgeHalf = spec.type === 'gable' ? spec.depth * 0.485 : spec.depth * spec.ridgeRatio * 0.5;
      for (var r = 0; r <= 12; r++) { var rt = r / 12, rz = -ridgeHalf + ridgeHalf * 2 * rt; ridge.push(roofPoint(spec, 0, rz, 0.017 + 0.015 * Math.pow(Math.abs(rt - 0.5) * 2, 4))); }
      appendTube(trim, ridge, 0.0115, 7);
      if (spec.type === 'hip') [-1, 1].forEach(function (zs) { [-1, 1].forEach(function (xs) {
        var hip = [];
        for (var h = 0; h <= 8; h++) { var ht = h / 8; hip.push(roofPoint(spec, xs * spec.width * 0.49 * ht, zs * (ridgeHalf + (spec.depth * 0.5 - ridgeHalf) * ht), 0.013)); }
        appendTube(trim, hip, 0.0075, 6);
      }); });
      [-1, 1].forEach(function (zs) { var eave = []; for (var e = 0; e <= 16; e++) { var ex = -spec.width * 0.495 + spec.width * 0.99 * e / 16; eave.push(roofPoint(spec, ex, zs * spec.depth * 0.498, 0.002)); } appendTube(trim, eave, 0.0085, 6); });
      [-1, 1].forEach(function (xs) { var eave = []; for (var e = 0; e <= 12; e++) { var ez = -spec.depth * 0.498 + spec.depth * 0.996 * e / 12; eave.push(roofPoint(spec, xs * spec.width * 0.498, ez, 0.002)); } appendTube(trim, eave, 0.0075, 6); });
      addMesh(finish(trim), mats.roofDark, cx, baseY, cz, name + '-capped-eaves-and-ridges');
    }

    function addTerrace(cx, cz, width, depth, height, name) {
      addBlock(cx, height * 0.5, cz, width, height, depth, mats.stone, name + '-terrace');
      addBlock(cx, height + 0.011, cz, width + 0.03, 0.022, depth + 0.03, mats.stoneLight, name + '-capstone');
      addBlock(cx, 0.014, cz, width + 0.035, 0.028, depth + 0.035, mats.stoneDark, name + '-footing');
    }
    function addStairs(cx, front, width, height, count, run) {
      var depth = run / count;
      for (var i = 0; i < count; i++) { var h = height * (count - i) / count; queueBox('stoneLight', cx, h * 0.5, front + depth * (i + 0.5), width + i * 0.018, h, depth + 0.012, 0); }
    }
    function addDoor(cx, y0, z, width, height, name) {
      addBlock(cx, y0 + height * 0.5, z, width, height, 0.025, mats.woodDark, name + '-door-leaves');
      queueBox('woodLight', cx, y0 + height * 0.5, z + 0.019, 0.016, height * 0.94, 0.012, 0);
      for (var side = -1; side <= 1; side += 2) {
        var px = cx + side * width * 0.245;
        queueBox('wood', px, y0 + height * 0.52, z + 0.019, width * 0.40, 0.018, 0.012, 0);
        queueBox('wood', px, y0 + height * 0.78, z + 0.019, width * 0.40, 0.018, 0.012, 0);
        queueBox('wood', px + side * width * 0.10, y0 + height * 0.60, z + 0.024, 0.012, 0.012, 0.010, 0);
      }
    }
    function addFrontBay(cx, z, y0, width, height, bays, name) {
      var bay = width / bays;
      queueBox('wood', cx, y0 + 0.025, z, width + 0.045, 0.05, 0.04, 0); queueBox('wood', cx, y0 + height - 0.022, z, width + 0.045, 0.055, 0.04, 0);
      for (var i = 0; i <= bays; i++) queueBox('wood', cx - width * 0.5 + bay * i, y0 + height * 0.5, z, 0.035, height, 0.04, 0);
      for (i = 0; i < bays; i++) {
        var bx = cx - width * 0.5 + bay * (i + 0.5), opening = bay * 0.73;
        if (i === Math.floor(bays * 0.5)) addDoor(bx, y0 + height * 0.08, z + 0.008, opening, height * 0.78, name);
        else {
          addBlock(bx, y0 + height * 0.57, z + 0.008, opening, height * 0.48, 0.024, mats.woodDark, name + '-window-recess');
          for (var lx = -2; lx <= 2; lx++) queueBox('woodLight', bx + lx * opening * 0.15, y0 + height * 0.57, z + 0.026, 0.009, height * 0.44, 0.009, 0);
          for (var ly = -1; ly <= 1; ly++) queueBox('woodLight', bx, y0 + height * (0.57 + ly * 0.14), z + 0.026, opening * 0.94, 0.009, 0.009, 0);
        }
      }
    }
    function addBrackets(cx, y, z, width, count) {
      for (var i = 0; i < count; i++) { var x = cx - width * 0.5 + width * i / (count - 1); queueBox('woodDark', x, y, z, 0.052, 0.040, 0.105, 0); queueBox('wood', x, y - 0.030, z - 0.018, 0.032, 0.040, 0.070, 0); queueBox('woodDark', x, y + 0.026, z + 0.022, 0.085, 0.020, 0.055, 0); }
    }
    function addHall(c) {
      addTerrace(c.x, c.z, c.terraceW, c.terraceD, c.terraceH, c.name); addStairs(c.x, c.z + c.terraceD * 0.5, c.stairW, c.terraceH, c.steps, c.stairRun);
      var bodyY = c.terraceH + c.wallH * 0.5, frontZ = c.z + c.wallD * 0.5 + 0.020, backZ = c.z - c.wallD * 0.5 - 0.020;
      addBlock(c.x, bodyY, c.z, c.wallW, c.wallH, c.wallD, mats.plaster, c.name + '-plaster-walls');
      addBlock(c.x - c.wallW * 0.28, bodyY + 0.02, c.z - c.wallD * 0.5 - 0.010, c.wallW * 0.34, c.wallH * 0.68, 0.015, mats.plasterWarm, c.name + '-rear-aged-plaster');
      addBlock(c.x + c.wallW * 0.25, bodyY - 0.02, c.z - c.wallD * 0.5 - 0.011, c.wallW * 0.22, c.wallH * 0.50, 0.016, mats.plasterDeep, c.name + '-rear-patina');
      for (var i = 0; i <= c.bays; i++) { var x = c.x - c.wallW * 0.5 + c.wallW * i / c.bays; queueColumn(x, bodyY, frontZ, 0.026, c.wallH + 0.055); queueColumn(x, bodyY, backZ, 0.023, c.wallH + 0.040); }
      addFrontBay(c.x, frontZ + 0.004, c.terraceH, c.wallW, c.wallH, c.bays, c.name);
      queueBox('wood', c.x - c.wallW * 0.5 - 0.014, bodyY, c.z, 0.035, c.wallH + 0.04, c.wallD + 0.04, 0); queueBox('wood', c.x + c.wallW * 0.5 + 0.014, bodyY, c.z, 0.035, c.wallH + 0.04, c.wallD + 0.04, 0);
      addBrackets(c.x, c.terraceH + c.wallH - 0.012, frontZ + 0.026, c.wallW * 0.94, c.bays + 1);
      addRoof({ width: c.roofW, depth: c.roofD, height: c.roofH, thickness: 0.035, ridgeRatio: 0.42, type: c.roofType }, c.x, c.terraceH + c.wallH - 0.015, c.z, c.name);
    }

    addHall({ name: 'main-hall', x: -0.22, z: -0.28, terraceW: 1.04, terraceD: 0.70, terraceH: 0.18, wallW: 0.88, wallD: 0.48, wallH: 0.47, roofW: 1.18, roofD: 0.80, roofH: 0.31, roofType: 'hip', bays: 3, stairW: 0.34, steps: 3, stairRun: 0.18 });
    addHall({ name: 'side-scripture-hall', x: 0.49, z: 0.10, terraceW: 0.59, terraceD: 0.48, terraceH: 0.13, wallW: 0.47, wallD: 0.35, wallH: 0.34, roofW: 0.72, roofD: 0.54, roofH: 0.24, roofType: 'gable', bays: 2, stairW: 0.22, steps: 2, stairRun: 0.12 });

    var upperX = -0.28, upperZ = -0.31;
    addBlock(upperX, 0.965, upperZ, 0.49, 0.16, 0.34, mats.plasterWarm, 'upper-story-plaster');
    addBlock(upperX, 1.035, upperZ + 0.178, 0.39, 0.19, 0.018, mats.woodDark, 'upper-story-window-recess');
    for (var ux = -2; ux <= 2; ux++) queueBox('woodLight', upperX + ux * 0.075, 1.035, upperZ + 0.192, 0.010, 0.18, 0.010, 0);
    for (var uy = -1; uy <= 1; uy++) queueBox('woodLight', upperX, 1.035 + uy * 0.055, upperZ + 0.192, 0.40, 0.010, 0.010, 0);
    [-1, 1].forEach(function (s) { queueColumn(upperX + s * 0.235, 1.005, upperZ + 0.18, 0.021, 0.25); queueColumn(upperX + s * 0.235, 1.005, upperZ - 0.18, 0.021, 0.25); });
    addBrackets(upperX, 1.125, upperZ + 0.20, 0.43, 4);
    addRoof({ width: 0.68, depth: 0.50, height: 0.28, thickness: 0.030, ridgeRatio: 0.38, type: 'hip' }, upperX, 1.13, upperZ, 'upper-pavilion');

    (function () {
      var cx = -0.48, cz = 0.43;
      addTerrace(cx, cz, 0.54, 0.31, 0.105, 'mountain-gate'); addStairs(cx, cz + 0.155, 0.28, 0.105, 3, 0.239);
      [-1, 1].forEach(function (s) { queueColumn(cx + s * 0.205, 0.32, cz + 0.095, 0.034, 0.43); queueColumn(cx + s * 0.205, 0.32, cz - 0.095, 0.032, 0.43); queueBox('wood', cx + s * 0.205, 0.50, cz, 0.06, 0.05, 0.28, 0); });
      queueBox('wood', cx, 0.47, cz, 0.46, 0.055, 0.07, 0); addBlock(cx, 0.425, cz + 0.112, 0.20, 0.09, 0.035, mats.woodDark, 'gateway-tablet'); queueBox('woodLight', cx, 0.425, cz + 0.134, 0.115, 0.014, 0.010, 0);
      addBrackets(cx, 0.51, cz + 0.13, 0.44, 4); addRoof({ width: 0.66, depth: 0.43, height: 0.22, thickness: 0.030, ridgeRatio: 0.38, type: 'hip' }, cx, 0.50, cz, 'mountain-gate');
    })();

    var batchMats = { stoneLight: mats.stoneLight, wood: mats.wood, woodLight: mats.woodLight, woodDark: mats.woodDark };
    var matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(), position = new THREE.Vector3(), scale = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
    Object.keys(boxes).forEach(function (name) {
      var items = boxes[name], mesh = new THREE.InstancedMesh(unitBox, batchMats[name], items.length); mesh.name = 'temple-' + name + '-details';
      for (var i = 0; i < items.length; i++) { var v = items[i]; position.set(v[0], v[1], v[2]); quaternion.setFromAxisAngle(yAxis, v[6]); scale.set(v[3], v[4], v[5]); matrix.compose(position, quaternion, scale); mesh.setMatrixAt(i, matrix); }
      mesh.instanceMatrix.needsUpdate = true; root.add(mesh);
    });
    var columnMesh = new THREE.InstancedMesh(unitColumn, mats.woodDark, columns.length); columnMesh.name = 'temple-columns';
    for (var i = 0; i < columns.length; i++) { var v = columns[i]; position.set(v[0], v[1], v[2]); quaternion.identity(); scale.set(v[3], v[4], v[3]); matrix.compose(position, quaternion, scale); columnMesh.setMatrixAt(i, matrix); }
    columnMesh.instanceMatrix.needsUpdate = true; root.add(columnMesh);

    root.userData.kind = 'procedural-chinese-mountain-monastery';
    root.userData.front = '+Z';
    root.userData.entrance = { x: -0.48, y: 0, z: 0.83, width: 0.38 };
    root.userData.nominalBounds = { width: 1.66, depth: 1.51, height: 1.45 };
    return root;
  }

  global.YSHArchitecture = Object.freeze({ createTemple: createTemple });
})(window);
