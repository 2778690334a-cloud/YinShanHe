(function (root) {
  'use strict';

  var TAU = Math.PI * 2;

  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function assertThree(T) {
    if (!T || !T.Group || !T.BufferGeometry) {
      throw new Error('YSHCraft requires the supplied THREE namespace.');
    }
  }

  function setColorAttribute(T, geometry, colorFn) {
    var position = geometry.getAttribute('position');
    var colors = new Float32Array(position.count * 3);
    var color = new T.Color();
    for (var i = 0; i < position.count; i += 1) {
      color.set(colorFn(i, position));
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    return geometry;
  }

  function mergeGeometries(T, geometries) {
    var parts = [];
    var total = 0;
    var i;
    for (i = 0; i < geometries.length; i += 1) {
      var part = geometries[i].index ? geometries[i].toNonIndexed() : geometries[i].clone();
      parts.push(part);
      total += part.getAttribute('position').array.length;
    }
    var positions = new Float32Array(total);
    var normals = new Float32Array(total);
    var offset = 0;
    for (i = 0; i < parts.length; i += 1) {
      var p = parts[i].getAttribute('position').array;
      var nAttr = parts[i].getAttribute('normal');
      positions.set(p, offset);
      if (nAttr) normals.set(nAttr.array, offset);
      offset += p.length;
      parts[i].dispose();
    }
    var merged = new T.BufferGeometry();
    merged.setAttribute('position', new T.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new T.BufferAttribute(normals, 3));
    return merged;
  }

  function makeIrregularShell(T, rings, sides, random, roughness) {
    var positions = [];
    var colors = [];
    var indices = [];
    var ringNoise = [];
    var r;
    var s;
    for (s = 0; s <= sides; s += 1) {
      ringNoise[s] = 1 + (random() - 0.5) * roughness;
    }
    for (r = 0; r < rings.length; r += 1) {
      var ring = rings[r];
      for (s = 0; s <= sides; s += 1) {
        var angle = s / sides * TAU;
        var ripple = ringNoise[s] + Math.sin(angle * 7 + r * 0.8) * roughness * 0.18;
        positions.push(
          Math.cos(angle) * ring.rx * ripple,
          ring.y + (random() - 0.5) * roughness * 0.008,
          Math.sin(angle) * ring.rz * ripple
        );
        var shade = 0.72 + random() * 0.22 + Math.cos(angle) * 0.04;
        colors.push(0.25 * shade, 0.105 * shade, 0.035 * shade);
      }
    }
    for (r = 0; r < rings.length - 1; r += 1) {
      for (s = 0; s < sides; s += 1) {
        var a = r * (sides + 1) + s;
        var b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeFiberLines(T, options, random) {
    var positions = [];
    var colors = [];
    var count = options.count;
    var steps = options.steps;
    for (var i = 0; i < count; i += 1) {
      var angle = random() * TAU;
      var radial = Math.sqrt(random());
      var twist = (random() - 0.5) * 0.8;
      var swayX = (random() - 0.5) * options.sway;
      var swayZ = (random() - 0.5) * options.sway * 0.55;
      var previous = null;
      for (var j = 0; j <= steps; j += 1) {
        var t = j / steps;
        var flare = Math.pow(t, 1.35);
        var x = Math.cos(angle + twist * t) * (options.neckX * radial + options.flareX * flare * (0.55 + radial * 0.55));
        var z = Math.sin(angle + twist * t) * (options.neckZ * radial + options.flareZ * flare * (0.55 + radial * 0.55));
        x += swayX * t * t + Math.sin(t * Math.PI * (1.3 + random() * 0.2) + angle) * 0.009;
        z += swayZ * t * t;
        var y = options.topY * (1 - t);
        if (j === steps) y = 0.002 + random() * 0.008;
        var point = [x, y, z];
        if (previous) {
          positions.push(previous[0], previous[1], previous[2], point[0], point[1], point[2]);
          var warmth = 0.72 + random() * 0.28;
          colors.push(
            0.31 * warmth, 0.13 * warmth, 0.045 * warmth,
            0.22 * warmth, 0.075 * warmth, 0.018 * warmth
          );
        }
        previous = point;
      }
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    return geometry;
  }

  function makeHelixTubeY(T, rx, rz, y0, y1, turns, tubeRadius, segments, sides, phase) {
    var positions = [];
    var indices = [];
    var tangent = new T.Vector3();
    var outward = new T.Vector3();
    var binormal = new T.Vector3();
    for (var i = 0; i <= segments; i += 1) {
      var t = i / segments;
      var angle = phase + turns * TAU * t;
      var center = new T.Vector3(Math.cos(angle) * rx, y0 + (y1 - y0) * t, Math.sin(angle) * rz);
      tangent.set(-Math.sin(angle) * rx * turns * TAU, y1 - y0, Math.cos(angle) * rz * turns * TAU).normalize();
      outward.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
      binormal.crossVectors(tangent, outward).normalize();
      for (var j = 0; j <= sides; j += 1) {
        var q = j / sides * TAU;
        positions.push(
          center.x + outward.x * Math.cos(q) * tubeRadius + binormal.x * Math.sin(q) * tubeRadius,
          center.y + outward.y * Math.cos(q) * tubeRadius + binormal.y * Math.sin(q) * tubeRadius,
          center.z + outward.z * Math.cos(q) * tubeRadius + binormal.z * Math.sin(q) * tubeRadius
        );
      }
    }
    for (i = 0; i < segments; i += 1) {
      for (j = 0; j < sides; j += 1) {
        var a = i * (sides + 1) + j;
        var b = a + sides + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeHelixTubeX(T, x0, x1, ry, rz, turns, tubeRadius, segments, sides, phase) {
    var geometry = makeHelixTubeY(T, ry, rz, x0, x1, turns, tubeRadius, segments, sides, phase);
    var position = geometry.getAttribute('position');
    for (var i = 0; i < position.count; i += 1) {
      var oldX = position.getX(i);
      var oldY = position.getY(i);
      var oldZ = position.getZ(i);
      position.setXYZ(i, oldY, oldX, oldZ);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeInkingBrush(T) {
    var random = seededRandom(0x59494e31);
    var group = new T.Group();
    group.name = 'YSH_Inking_Palm_Fiber_Brush';
    group.userData.craftType = 'inking';
    group.userData.referenceForm = 'dense tied palm-fiber workshop brush';

    var fiberMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
    var lineMaterial = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82 });
    var ropeMaterial = new T.MeshStandardMaterial({ color: 0x8b6842, roughness: 0.92 });
    var clothMaterial = new T.MeshStandardMaterial({ color: 0x49382e, roughness: 1 });
    var woodMaterial = new T.MeshStandardMaterial({ color: 0x6f3f20, roughness: 0.78 });

    var shell = makeIrregularShell(T, [
      { y: 0, rx: 0.65, rz: 0.365 },
      { y: 0.09, rx: 0.64, rz: 0.35 },
      { y: 0.22, rx: 0.54, rz: 0.31 },
      { y: 0.37, rx: 0.40, rz: 0.245 },
      { y: 0.49, rx: 0.29, rz: 0.205 },
      { y: 0.57, rx: 0.255, rz: 0.185 }
    ], 48, random, 0.11);
    var mass = new T.Mesh(shell, fiberMaterial);
    mass.name = 'Broad_Flared_Palm_Fiber_Mass';
    mass.castShadow = true;
    mass.receiveShadow = true;
    group.add(mass);

    var strands = new T.LineSegments(makeFiberLines(T, {
      count: 290, steps: 5, topY: 0.555,
      neckX: 0.115, neckZ: 0.085, flareX: 0.47, flareZ: 0.26, sway: 0.11
    }, random), lineMaterial);
    strands.name = 'Dense_Tangled_Fine_Fiber_Strands';
    group.add(strands);

    var insertGeometry = new T.CylinderGeometry(0.105, 0.13, 0.31, 18, 3);
    setColorAttribute(T, insertGeometry, function (i, position) {
      return position.getY(i) > 0.05 ? 0x8a542b : 0x5e321b;
    });
    var insert = new T.Mesh(insertGeometry, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
    insert.position.y = 0.695;
    insert.name = 'Worn_Wood_Central_Insert';
    insert.castShadow = true;
    group.add(insert);

    var clothGeometry = makeIrregularShell(T, [
      { y: 0.485, rx: 0.295, rz: 0.215 },
      { y: 0.535, rx: 0.285, rz: 0.208 },
      { y: 0.605, rx: 0.235, rz: 0.18 },
      { y: 0.66, rx: 0.17, rz: 0.145 }
    ], 32, random, 0.035);
    var cloth = new T.Mesh(clothGeometry, clothMaterial);
    cloth.name = 'Worn_Cloth_Neck_Wrap';
    cloth.castShadow = true;
    group.add(cloth);

    var ropeParts = [];
    ropeParts.push(makeHelixTubeY(T, 0.292, 0.216, 0.495, 0.555, 2.4, 0.012, 48, 6, 0.2));
    ropeParts.push(makeHelixTubeY(T, 0.236, 0.184, 0.575, 0.63, 2.2, 0.011, 44, 6, 2.1));
    ropeParts.push(makeHelixTubeY(T, 0.135, 0.12, 0.744, 0.805, 2.4, 0.009, 42, 6, 1.0));
    var ropes = new T.Mesh(mergeGeometries(T, ropeParts), ropeMaterial);
    ropes.name = 'Rope_Bands_And_Narrow_Bound_Tail';
    ropes.castShadow = true;
    group.add(ropes);

    var knot = new T.Mesh(new T.TorusGeometry(0.052, 0.011, 7, 18), ropeMaterial);
    knot.rotation.y = Math.PI * 0.5;
    knot.position.set(0.22, 0.595, 0.16);
    knot.name = 'Side_Binding_Knot';
    group.add(knot);
    return group;
  }

  function makeRubbingBundle(T, random) {
    var positions = [];
    var colors = [];
    var indices = [];
    var xSegments = 28;
    var radialSegments = 28;
    for (var ix = 0; ix <= xSegments; ix += 1) {
      var u = ix / xSegments;
      var s = u * 2 - 1;
      var abs = Math.abs(s);
      var x = s * 0.75;
      var centerY = 0.145 + 0.15 * Math.pow(abs, 1.75);
      var radiusY = 0.14 * Math.pow(1 - abs * 0.72, 0.55);
      var radiusZ = 0.285 * (1 - abs * 0.34);
      for (var ir = 0; ir <= radialSegments; ir += 1) {
        var angle = ir / radialSegments * TAU;
        var grain = 1 + (random() - 0.5) * 0.045 + Math.sin(angle * 9 + ix) * 0.012;
        positions.push(x, centerY + Math.cos(angle) * radiusY * grain, Math.sin(angle) * radiusZ * grain);
        var shade = 0.7 + random() * 0.22;
        colors.push(0.29 * shade, 0.115 * shade, 0.036 * shade);
      }
    }
    for (ix = 0; ix < xSegments; ix += 1) {
      for (ir = 0; ir < radialSegments; ir += 1) {
        var a = ix * (radialSegments + 1) + ir;
        var b = a + radialSegments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeRubbingStrands(T, random) {
    var positions = [];
    var colors = [];
    var count = 180;
    var steps = 14;
    for (var i = 0; i < count; i += 1) {
      var angle = random() * TAU;
      var depth = 0.68 + random() * 0.32;
      var prior = null;
      for (var j = 0; j <= steps; j += 1) {
        var s = j / steps * 2 - 1;
        var abs = Math.abs(s);
        var x = s * 0.747 + Math.sin(j * 0.8 + i) * 0.004;
        var centerY = 0.145 + 0.15 * Math.pow(abs, 1.75);
        var ry = 0.14 * Math.pow(1 - abs * 0.72, 0.55);
        var rz = 0.285 * (1 - abs * 0.34);
        var y = centerY + Math.cos(angle) * ry * depth + (random() - 0.5) * 0.006;
        var z = Math.sin(angle) * rz * depth;
        var point = [x, Math.max(0.002, y), z];
        if (prior) {
          positions.push(prior[0], prior[1], prior[2], point[0], point[1], point[2]);
          var shade = 0.6 + random() * 0.35;
          colors.push(0.34 * shade, 0.14 * shade, 0.045 * shade, 0.24 * shade, 0.08 * shade, 0.02 * shade);
        }
        prior = point;
      }
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    return geometry;
  }

  function makeRubbingBrush(T) {
    var random = seededRandom(0x59494e32);
    var group = new T.Group();
    group.name = 'YSH_Rubbing_Yuanbao_Palm_Fiber_Brush';
    group.userData.craftType = 'rubbing';
    group.userData.referenceForm = 'upturned yuanbao palm-fiber rubbing brush';

    var fiberMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.98 });
    var fibers = new T.Mesh(makeRubbingBundle(T, random), fiberMaterial);
    fibers.name = 'Upturned_Yuanbao_Fiber_Bundle';
    fibers.castShadow = true;
    fibers.receiveShadow = true;
    group.add(fibers);

    var strandLines = new T.LineSegments(makeRubbingStrands(T, random), new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82 }));
    strandLines.name = 'Longitudinal_Palm_Fiber_Strands';
    group.add(strandLines);

    var woodMaterial = new T.MeshStandardMaterial({ color: 0x74431f, roughness: 0.82 });
    var block = new T.Mesh(new T.BoxGeometry(0.48, 0.235, 0.31, 4, 2, 3), woodMaterial);
    block.position.y = 0.315;
    block.name = 'Central_Wood_Block';
    block.castShadow = true;
    group.add(block);

    var cloth = new T.Mesh(new T.BoxGeometry(0.57, 0.17, 0.35, 6, 2, 4), new T.MeshStandardMaterial({ color: 0x514239, roughness: 1 }));
    cloth.position.y = 0.265;
    cloth.name = 'Tight_Fabric_Binding';
    cloth.castShadow = true;
    group.add(cloth);

    var ropeParts = [
      makeHelixTubeX(T, -0.285, -0.205, 0.105, 0.19, 2.1, 0.01, 40, 6, 0.2),
      makeHelixTubeX(T, -0.055, 0.055, 0.108, 0.19, 2.5, 0.01, 48, 6, 1.4),
      makeHelixTubeX(T, 0.205, 0.285, 0.105, 0.19, 2.1, 0.01, 40, 6, 2.6)
    ];
    for (var i = 0; i < ropeParts.length; i += 1) ropeParts[i].translate(0, 0.31, 0);
    var ropes = new T.Mesh(mergeGeometries(T, ropeParts), new T.MeshStandardMaterial({ color: 0x9a7447, roughness: 0.9 }));
    ropes.name = 'Three_Rope_Tightening_Bands';
    ropes.castShadow = true;
    group.add(ropes);

    var peg = new T.Mesh(new T.CylinderGeometry(0.032, 0.038, 0.36, 14, 2), woodMaterial);
    peg.rotation.x = Math.PI * 0.5;
    peg.rotation.z = 0.08;
    peg.position.set(0.02, 0.475, 0.015);
    peg.name = 'Short_Tightening_Wood_Peg';
    peg.castShadow = true;
    group.add(peg);
    return group;
  }

  function createBrush(T, kind) {
    assertThree(T);
    if (kind === 'inking') return makeInkingBrush(T);
    if (kind === 'rubbing') return makeRubbingBrush(T);
    throw new Error("Unknown YSH craft brush kind: " + kind);
  }

  function makeWoodHandleGeometry(T, profile, random) {
    var points = [];
    for (var i = 0; i < profile.length; i += 1) points.push(new T.Vector2(profile[i][1], profile[i][0]));
    var geometry = new T.LatheGeometry(points, 24);
    geometry.rotateX(Math.PI * 0.5);
    setColorAttribute(T, geometry, function (index, position) {
      var z = position.getZ(index);
      var stripe = Math.sin(z * 72 + index * 0.17) * 0.035;
      var shade = 0.7 + random() * 0.22 + stripe;
      var color = new T.Color();
      color.setRGB(0.39 * shade, 0.16 * shade, 0.055 * shade);
      return color;
    });
    return geometry;
  }

  function makePrismFromOutline(T, outline, thickness) {
    var positions = [];
    var indices = [];
    var count = outline.length;
    var i;
    for (i = 0; i < count; i += 1) positions.push(outline[i][0], thickness, outline[i][1]);
    for (i = 0; i < count; i += 1) positions.push(outline[i][0], 0, outline[i][1]);
    for (i = 1; i < count - 1; i += 1) {
      indices.push(0, i, i + 1);
      indices.push(count, count + i + 1, count + i);
    }
    for (i = 0; i < count; i += 1) {
      var next = (i + 1) % count;
      indices.push(i, count + i, next, next, count + i, count + next);
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeGougeGeometry(T, width, length, depth, segments) {
    var positions = [];
    var indices = [];
    var rows = 9;
    for (var iz = 0; iz <= segments; iz += 1) {
      var t = iz / segments;
      var z = 0.12 - length * t;
      var taper = 1 - t * 0.14;
      for (var ix = 0; ix <= rows; ix += 1) {
        var s = ix / rows * 2 - 1;
        var curve = depth * (1 - s * s);
        positions.push(s * width * 0.5 * taper, 0.025 + curve, z);
        positions.push(s * width * 0.5 * taper, 0.006 + curve, z);
      }
    }
    var rowWidth = (rows + 1) * 2;
    for (iz = 0; iz < segments; iz += 1) {
      for (ix = 0; ix < rows; ix += 1) {
        var topA = iz * rowWidth + ix * 2;
        var topB = topA + rowWidth;
        indices.push(topA, topB, topA + 2, topA + 2, topB, topB + 2);
        indices.push(topA + 1, topA + 3, topB + 1, topA + 3, topB + 3, topB + 1);
      }
    }
    for (iz = 0; iz < segments; iz += 1) {
      var left = iz * rowWidth;
      var leftNext = left + rowWidth;
      var right = left + rows * 2;
      var rightNext = right + rowWidth;
      indices.push(left, left + 1, leftNext, left + 1, leftNext + 1, leftNext);
      indices.push(right, rightNext, right + 1, right + 1, rightNext, rightNext + 1);
    }
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeVGougeGeometry(T) {
    var left = new T.BoxGeometry(0.095, 0.018, 0.7, 1, 1, 5);
    left.rotateZ(-0.48);
    left.translate(-0.042, 0.053, -0.23);
    var right = new T.BoxGeometry(0.095, 0.018, 0.7, 1, 1, 5);
    right.rotateZ(0.48);
    right.translate(0.042, 0.053, -0.23);
    return mergeGeometries(T, [left, right]);
  }

  function makeTool(T, spec, materials, random) {
    var tool = new T.Group();
    tool.name = spec.name;
    tool.userData.edgeProfile = spec.edge;

    var handleGeometry = makeWoodHandleGeometry(T, spec.profile, random);
    var handle = new T.Mesh(handleGeometry, materials.wood);
    handle.position.y = spec.radius;
    handle.name = 'Wood_Handle_' + spec.name;
    handle.castShadow = true;
    tool.add(handle);

    var ferrule = new T.Mesh(new T.CylinderGeometry(spec.radius * 0.67, spec.radius * 0.73, 0.15, 18, 2), materials.ferrule);
    ferrule.rotation.x = Math.PI * 0.5;
    ferrule.position.set(0, spec.radius, 0.12);
    ferrule.name = 'Darkened_Metal_Ferrule_' + spec.name;
    ferrule.castShadow = true;
    tool.add(ferrule);

    var bladeGeometry;
    if (spec.edge === 'round-gouge') {
      bladeGeometry = makeGougeGeometry(T, spec.width, spec.length, 0.055, 12);
    } else if (spec.edge === 'v-gouge') {
      bladeGeometry = makeVGougeGeometry(T);
    } else if (spec.edge === 'skew-chisel') {
      bladeGeometry = makePrismFromOutline(T, [
        [-spec.width * 0.5, 0.13], [spec.width * 0.5, 0.13],
        [spec.width * 0.5, -spec.length], [-spec.width * 0.5, -spec.length + 0.16]
      ], 0.038);
    } else {
      bladeGeometry = makePrismFromOutline(T, [
        [-spec.width * 0.5, 0.13], [spec.width * 0.5, 0.13],
        [spec.width * 0.43, -spec.length], [-spec.width * 0.43, -spec.length]
      ], 0.04);
    }
    var blade = new T.Mesh(bladeGeometry, materials.metal);
    blade.position.y = 0.016;
    blade.name = 'Reflective_' + spec.edge.replace('-', '_') + '_Blade';
    blade.castShadow = true;
    tool.add(blade);

    var bindingParts = [
      makeHelixTubeY(T, spec.radius * 0.73, spec.radius * 0.73, 0.02, 0.075, 2.0, 0.007, 34, 5, random() * TAU),
      makeHelixTubeY(T, spec.radius * 0.76, spec.radius * 0.76, 0.09, 0.14, 1.8, 0.006, 30, 5, random() * TAU)
    ];
    var bindingGeometry = mergeGeometries(T, bindingParts);
    bindingGeometry.rotateX(Math.PI * 0.5);
    bindingGeometry.translate(0, spec.radius, 0.105);
    var binding = new T.Mesh(bindingGeometry, materials.binding);
    binding.name = 'Worn_Handle_Binding_' + spec.name;
    tool.add(binding);
    return tool;
  }

  function createCarvingTools(T) {
    assertThree(T);
    var random = seededRandom(0x59494e33);
    var group = new T.Group();
    group.name = 'YSH_Traditional_Woodblock_Carving_Tools';
    group.userData.toolCount = 4;

    var materials = {
      wood: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.73 }),
      ferrule: new T.MeshStandardMaterial({ color: 0x4d4b47, roughness: 0.42, metalness: 0.72 }),
      metal: new T.MeshStandardMaterial({ color: 0xc7ced0, roughness: 0.2, metalness: 0.9 }),
      binding: new T.MeshStandardMaterial({ color: 0x6b4930, roughness: 0.95 })
    };
    var specs = [
      {
        name: 'Tool_01_Wide_Flat_Chisel', edge: 'flat-chisel', width: 0.22, length: 0.72, radius: 0.105,
        x: -0.53, z: -0.34, yaw: -0.13,
        profile: [[0.15, 0.072], [0.22, 0.096], [0.35, 0.108], [0.7, 0.1], [0.9, 0.073], [0.98, 0.025]]
      },
      {
        name: 'Tool_02_Deep_Round_Gouge', edge: 'round-gouge', width: 0.19, length: 0.69, radius: 0.097,
        x: -0.18, z: 0.31, yaw: 0.09,
        profile: [[0.15, 0.066], [0.24, 0.092], [0.48, 0.099], [0.72, 0.087], [0.91, 0.059], [0.97, 0.022]]
      },
      {
        name: 'Tool_03_V_Groove_Gouge', edge: 'v-gouge', width: 0.18, length: 0.7, radius: 0.09,
        x: 0.18, z: -0.2, yaw: -0.04,
        profile: [[0.15, 0.061], [0.25, 0.085], [0.54, 0.092], [0.78, 0.076], [0.93, 0.048], [0.98, 0.018]]
      },
      {
        name: 'Tool_04_Skew_Detail_Chisel', edge: 'skew-chisel', width: 0.135, length: 0.68, radius: 0.083,
        x: 0.5, z: 0.38, yaw: 0.15,
        profile: [[0.15, 0.055], [0.23, 0.078], [0.43, 0.085], [0.72, 0.073], [0.9, 0.046], [0.96, 0.016]]
      }
    ];
    for (var i = 0; i < specs.length; i += 1) {
      var tool = makeTool(T, specs[i], materials, random);
      tool.position.set(specs[i].x, 0, specs[i].z);
      tool.rotation.y = specs[i].yaw;
      group.add(tool);
    }
    return group;
  }

  root.YSHCraft = {
    createBrush: createBrush,
    createCarvingTools: createCarvingTools
  };
}(window));
