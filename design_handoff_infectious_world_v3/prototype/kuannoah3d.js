/* Infectious World — dunia 3D Dusun Kuannoah (ilustratif) + model spesimen.
   <kuannoah-3d infection awareness mode focus shield misinfo paused lens reduced quality outcome>
   <specimen-3d kind locked>
   three.js dimuat langsung dari unpkg (tanpa import map). */
(() => {
  'use strict';
  if (window.__KUANNOAH3D__) return;
  window.__KUANNOAH3D__ = true;
  const URL3 = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  let p3 = null;
  const loadThree = () => p3 || (p3 = import(URL3));

  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) >>> 0; let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function noiseFactory(seed) {
    const r = rng(seed), p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const g = (i) => perm[i] / 127.5 - 1, f = (t) => t * t * (3 - 2 * t);
    const v = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const h = (a, b) => g(perm[(a & 255) + perm[b & 255]]);
      const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), u = f(xf), w = f(yf);
      return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    };
    return (x, y, oct = 3) => { let s = 0, amp = 1, fr = 1, n = 0; for (let o = 0; o < oct; o++) { s += v(x * fr, y * fr) * amp; n += amp; amp *= 0.5; fr *= 2.03; } return s / n; };
  }
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

  /* ---------- data peta (sama dengan CommunityMap.tsx) ---------- */
  const INF_T = (i) => (((i * 37) % 48) + 0.5) * (100 / 48);
  const AW_T = (i) => (((i * 29 + 11) % 48) + 0.5) * (100 / 48);
  const FACS = [
    { i: 21, key: 'pasar', name: 'PASAR', x: 4, z: 17, ry: Math.PI, rad: 15 },
    { i: 3, key: 'puskesmas', name: 'PUSKESMAS', x: 40, z: -17, ry: 0, rad: 15 },
    { i: 10, key: 'sekolah', name: 'SD KUANNOAH', x: -28, z: -48, ry: 0.06, rad: 19 },
    { i: 27, key: 'balai', name: 'BALAI DUSUN', x: -27, z: 31, ry: 0.3, rad: 12 },
    { i: 36, key: 'posyandu', name: 'POSYANDU', x: -3, z: 45, ry: Math.PI - 0.25, rad: 9 },
    { i: 44, key: 'warung', name: 'WARUNG', x: -50, z: 10, ry: Math.PI + 0.12, rad: 8 },
  ];
  const FAC_BY_KEY = Object.fromEntries(FACS.map((f) => [f.key, f]));
  const SHIELD_SRC = { E1: 'posyandu', E2: 'puskesmas', E3: 'puskesmas', E4: 'balai' };

  const roadZ = (x) => 6 * Math.sin(x / 55);
  const ROAD = []; for (let x = -340; x <= 340; x += 8) ROAD.push([x, roadZ(x)]);
  const ROAD_NEAR = ROAD.filter((p) => Math.abs(p[0]) <= 84);
  const LANES = [
    [[-14, roadZ(-14)], [-15, -18], [-20, -32], [-30, -36], [-48, -40], [-68, -37]],
    [[18, roadZ(18)], [20, 22], [15, 42], [8, 60], [-3, 80]],
    [[-34, roadZ(-34)], [-31, 14], [-26, 22], [-12, 36], [4, 47], [24, 55]],
    [[28, roadZ(28)], [30, -22], [22, -40], [8, -57], [-8, -68]],
    [[54, roadZ(54)], [59, 22], [49, 42], [34, 53]],
    [[-63, roadZ(-63)], [-70, -22], [-66, -50]],
    [[-15, -18], [0, -27], [22, -31]],
  ];
  const CREEK = [[96, -150], [84, -90], [70, -45], [66, -10], [74, 22], [68, 52], [52, 86], [34, 130], [20, 190]];
  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = Math.max(0, Math.min(1, t));
    const x = ax + dx * t - px, z = az + dz * t - pz; return Math.sqrt(x * x + z * z);
  }
  function distPoly(px, pz, pts) { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, distSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return m; }
  const distRoad = (x, z) => (Math.abs(x) < 360 ? Math.abs(z - roadZ(x)) * Math.cos(Math.atan(6 / 55 * Math.cos(x / 55))) : 1e9);
  const distLanes = (x, z) => { let m = 1e9; for (const L of LANES) m = Math.min(m, distPoly(x, z, L)); return m; };

  const NA = noiseFactory(7), NB = noiseFactory(19), NC = noiseFactory(41);
  function H(x, z) {
    const d = Math.hypot(x * 0.85, z * 0.62);
    let h = NA(x * 0.03, z * 0.03, 2) * 0.35;
    const hill = sstep(110, 250, d);
    h += hill * (12 + 26 * (NA(x * 0.006 + 5, z * 0.006 - 3, 4) * 0.5 + 0.5));
    h += sstep(230, 360, d) * 34 * (NB(x * 0.004, z * 0.004, 3) * 0.5 + 0.65);
    const dc = distPoly(x, z, CREEK);
    h -= 1.25 * (1 - sstep(2.5, 7.5, dc)) * (1 - hill);
    return h;
  }

  /* ---------- tata letak deterministik ---------- */
  function buildLayout() {
    const r = rng(20261027);
    const paths = [ROAD_NEAR, ...LANES];
    const cands = [];
    for (const P of paths) {
      let acc = 6;
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, az] = P[i], [bx, bz] = P[i + 1], len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len;
        while (acc < len) {
          const px = ax + tx * acc, pz = az + tz * acc;
          for (const side of [-1, 1]) {
            const off = 11.5 + r() * 2.5, j = (r() - 0.5) * 3;
            const cx = px + -tz * side * off + tx * j, cz = pz + tx * side * off + tz * j;
            cands.push({ x: cx, z: cz, ry: Math.atan2(px - cx, pz - cz) });
          }
          acc += 13.5;
        }
        acc -= len;
      }
    }
    for (let k = 0; k < 160; k++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()); cands.push({ x: Math.cos(a) * rr * 72, z: Math.sin(a) * rr * 84, ry: r() * Math.PI * 2 }); }
    const ok = [];
    for (const c of cands) {
      if ((c.x / 76) ** 2 + (c.z / 88) ** 2 > 1) continue;
      if (FACS.some((f) => Math.hypot(c.x - f.x, c.z - f.z) < f.rad + 7)) continue;
      if (Math.min(distRoad(c.x, c.z), distLanes(c.x, c.z)) < 7.4) continue;
      if (distPoly(c.x, c.z, CREEK) < 9) continue;
      if (ok.some((o) => Math.hypot(o.x - c.x, o.z - c.z) < 13.2)) continue;
      ok.push(c);
    }
    ok.sort((a, b) => Math.hypot(a.x, a.z * 0.9) - Math.hypot(b.x, b.z * 0.9));
    const slots = ok.slice(0, 42);
    const pasar = FAC_BY_KEY.pasar;
    slots.sort((a, b) => Math.hypot(a.x - pasar.x, a.z - pasar.z) - Math.hypot(b.x - pasar.x, b.z - pasar.z));
    const houseIdx = [...Array(48).keys()].filter((i) => !FACS.some((f) => f.i === i)).sort((a, b) => INF_T(a) - INF_T(b));
    const blds = new Array(48);
    houseIdx.forEach((idx, n) => {
      const s = slots[n % slots.length], t = r();
      blds[idx] = { i: idx, x: s.x, z: s.z, ry: s.ry, kind: t < 0.52 ? 'modern' : t < 0.8 ? 'kbubu' : 'gewang', seed: Math.floor(r() * 1e9) };
    });
    for (const f of FACS) blds[f.i] = { i: f.i, x: f.x, z: f.z, ry: f.ry, kind: f.key, seed: f.i * 977 };
    const free = (x, z, rHouse = 9, rPath = 5) => {
      if (Math.min(distRoad(x, z), distLanes(x, z)) < rPath) return false;
      if (distPoly(x, z, CREEK) < 3.5) return false;
      for (const b of blds) if (Math.hypot(b.x - x, b.z - z) < (b.kind.length > 6 || FAC_BY_KEY[b.kind] ? (FAC_BY_KEY[b.kind]?.rad ?? 8) : rHouse)) return false;
      return true;
    };
    return { blds, free, r };
  }

  /* ---------- tekstur kanvas ---------- */
  function canvasTex(THREE, w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function pinPath(g, kind) {
    g.beginPath();
    if (kind === 'protected') {
      g.moveTo(80, 18); g.bezierCurveTo(104, 30, 128, 30, 140, 28); g.bezierCurveTo(142, 92, 120, 130, 80, 152); g.bezierCurveTo(40, 130, 18, 92, 20, 28); g.bezierCurveTo(32, 30, 56, 30, 80, 18);
    } else {
      g.arc(80, 76, 60, Math.PI * 0.78, Math.PI * 2.22); g.lineTo(80, 178); g.closePath();
    }
  }
  function virusGlyph(g, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 6; g.lineJoin = 'round';
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); } g.closePath(); g.stroke();
    g.beginPath(); for (let k = 0; k < 6; k += 2) { const a = Math.PI / 6 + k * Math.PI / 3; g.moveTo(0, 0); g.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); } g.stroke();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.beginPath(); g.arc(Math.cos(a) * 33, Math.sin(a) * 33, 5, 0, 7); g.fill(); }
    g.restore();
  }
  function dropGlyph(g, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(14, -12, 24, 2, 24, 12); g.arc(0, 12, 24, 0, Math.PI); g.bezierCurveTo(-24, 2, -14, -12, 0, -30); g.fill();
    g.fillStyle = 'rgba(42,93,168,.55)'; g.beginPath(); g.arc(-8, 14, 6, 0, 7); g.fill(); g.restore();
  }
  function markerTex(THREE, kind) {
    return canvasTex(THREE, 160, 200, (g) => {
      const RED = '#B83A2A', BLUE = '#2A5DA8', INK = '#2A1E16';
      g.save(); g.translate(0, 8); pinPath(g, kind); g.fillStyle = 'rgba(20,12,6,.45)'; g.fill(); g.restore();
      pinPath(g, kind); g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.lineWidth = 9; g.strokeStyle = '#FFF8EC'; g.stroke();
      g.save(); pinPath(g, kind); g.clip();
      if (kind === 'both') { g.fillStyle = RED; g.fillRect(0, 0, 160, 200); g.fillStyle = BLUE; g.beginPath(); g.moveTo(160, 0); g.lineTo(160, 200); g.lineTo(0, 200); g.lineTo(0, 150); g.closePath(); g.fill(); }
      else { g.fillStyle = kind === 'infected' ? RED : BLUE; g.fillRect(0, 0, 160, 200); }
      g.restore();
      if (kind === 'infected') virusGlyph(g, 80, 76, 1.25);
      else if (kind === 'protected') dropGlyph(g, 80, 80, 1.3);
      else { virusGlyph(g, 58, 58, 0.72); dropGlyph(g, 104, 100, 0.78); }
    });
  }
  function signTex(THREE, text, bg, fg) {
    return canvasTex(THREE, 512, 128, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 78; g.font = `${fs}px "Lilita One", "Arial Black", sans-serif`;
      while (g.measureText(text).width > w - 60 && fs > 30) { fs -= 4; g.font = `${fs}px "Lilita One", "Arial Black", sans-serif`; }
      g.fillText(text, w / 2, h / 2 + 4);
    });
  }

  /* ---------- dunia ---------- */
  async function createWorld(el) {
    const THREE = await loadThree();
    try { await document.fonts.load('64px "Lilita One"'); } catch (e) { /* fallback */ }
    const V3 = THREE.Vector3, COL = (h) => new THREE.Color(h);
    const L = buildLayout();
    const R = L.r;
    const quality = el._p.quality === 'hemat' ? 'hemat' : 'tinggi';

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'hemat' ? 1 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 1, 2400);
    const U = { uDesat: { value: 0 } };
    const desat = (m) => {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uDesat = U.uDesat;
        sh.fragmentShader = 'uniform float uDesat;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.3,.59,.11)))*vec3(1.03,1.0,.95)*1.08, uDesat);');
      };
      m.customProgramCacheKey = () => 'kdesat';
      return m;
    };

    /* langit */
    const skyU = { uZen: { value: COL('#5d8fc9') }, uHor: { value: COL('#f2cfa0') }, uGround: { value: COL('#8d7656') }, uSunDir: { value: new V3(-0.6, 0.35, -0.5).normalize() }, uSunCol: { value: COL('#ffd9a8') } };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }',
      fragmentShader: 'uniform vec3 uZen,uHor,uGround,uSunDir,uSunCol; varying vec3 vDir; void main(){ vec3 d = normalize(vDir); float h = d.y; vec3 c = mix(uHor, uZen, pow(clamp(h,0.,1.),0.5)); c = mix(c, uGround, smoothstep(0.0,-0.12,h)); float s = max(dot(d, normalize(uSunDir)),0.); c += uSunCol*(pow(s,900.)*6. + pow(s,10.)*.28); gl_FragColor = vec4(c,1.); }',
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), skyMat);
    sky.frustumCulled = false; scene.add(sky);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.fog = new THREE.Fog(COL('#e8cfa6'), 200, 640);

    /* cahaya */
    const hemi = new THREE.HemisphereLight(COL('#c4d8ef'), COL('#8a6a48'), 0.9); scene.add(hemi);
    const sun = new THREE.DirectionalLight(COL('#ffd2a1'), 3.0);
    sun.castShadow = true; sun.shadow.mapSize.set(quality === 'hemat' ? 1024 : 2048, quality === 'hemat' ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -105, right: 105, top: 105, bottom: -105, near: 10, far: 520 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    scene.add(sun); scene.add(sun.target);

    /* bucket gabungan */
    class Bucket {
      constructor() { this.p = []; this.n = []; this.u = []; this.c = []; }
      add(geo, m, color, jit = 0.08) {
        const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv;
        const nm = new THREE.Matrix3().getNormalMatrix(m), v = new V3(), start = this.p.length / 3;
        const c = color.isColor ? color : COL(color);
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i); const lx = v.x, ly = v.y, lz = v.z; v.applyMatrix4(m); this.p.push(v.x, v.y, v.z);
          v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z);
          if (UV) this.u.push(UV.getX(i), UV.getY(i)); else this.u.push(0, 0);
          const k = 1 + (hash3(lx * 3.1 + m.elements[12], ly * 3.7, lz * 2.9 + m.elements[14]) - 0.5) * jit * 2;
          this.c.push(c.r * k, c.g * k, c.b * k);
        }
        return [start, P.count];
      }
      mesh(material, shadow = true) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
        g.computeBoundingSphere();
        const me = new THREE.Mesh(g, material); me.castShadow = shadow; me.receiveShadow = true; this.geo = g; return me;
      }
    }
    const B = { wall: new Bucket(), zinc: new Bucket(), thatch: new Bucket(), wood: new Bucket(), dark: new Bucket(), stone: new Bucket(), leaf: new Bucket(), trunk: new Bucket(), misc: new Bucket(), concrete: new Bucket() };
    const STATEFUL = ['wall', 'zinc', 'thatch'];

    const gBox = new THREE.BoxGeometry(1, 1, 1), gCyl8 = new THREE.CylinderGeometry(1, 1, 1, 8), gCyl16 = new THREE.CylinderGeometry(1, 1, 1, 18);
    const gCone4 = new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4);
    const mkCone = (seed) => { const g = new THREE.ConeGeometry(1, 1, 30, 5); const P = g.attributes.position, v = new V3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const a = Math.atan2(v.z, v.x), k = 1 + (NC(a * 3 + seed, v.y * 4, 2)) * 0.07 * (0.5 - v.y); P.setXYZ(i, v.x * k, v.y, v.z * k); } g.computeVertexNormals(); return g; };
    const gCones = [mkCone(1), mkCone(7), mkCone(13)];
    const mkLump = (seed) => { const g = new THREE.IcosahedronGeometry(1, 2); const P = g.attributes.position, v = new V3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const k = 1 + NC(v.x * 1.7 + seed, v.z * 1.7 + v.y, 2) * 0.32; P.setXYZ(i, v.x * k, v.y * k * 0.86, v.z * k); } g.computeVertexNormals(); return g; };
    const gLumps = [mkLump(2), mkLump(9), mkLump(23), mkLump(31)];
    const triGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); return g; };
    const gTri = triGeo();
    const gFan = new THREE.CircleGeometry(1, 9, Math.PI / 2 - 1.15, 2.3);
    const gBlade = (() => { const g = new THREE.PlaneGeometry(1, 1, 1, 6); g.translate(0, 0.5, 0); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setX(i, P.getX(i) * (1 - y * 0.85)); P.setZ(i, y * y * 0.55); } g.computeVertexNormals(); return g; })();

    const M4 = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new V3(sx, sy, sz));
    const frame = (x, y, z, ry) => M4(x, y, z, ry);
    const at = (G, lx, ly, lz, sx, sy, sz, ry = 0, rx = 0, rz = 0) => G.clone().multiply(M4(lx, ly, lz, ry, rx, rz, sx, sy, sz));

    const ranges = Array.from({ length: 48 }, () => ({ wall: [], zinc: [], thatch: [] }));
    const tops = new Array(48).fill(6);
    const fronts = new Array(48);
    const addS = (i, bucket, geo, m, color, jit) => { const rg = B[bucket].add(geo, m, color, jit); if (i != null && STATEFUL.includes(bucket)) ranges[i][bucket].push(rg); return rg; };

    function gable(i, G, w, d, top, hR, o, bucket, color, wallColor, thick = 0.1) {
      const W = w + 2 * o, hd = d / 2 + o, Ls = Math.hypot(hd, hR), a = Math.atan2(hR, hd);
      addS(i, bucket, gBox, at(G, 0, top + hR / 2, hd / 2, W, thick, Ls, 0, a), color, 0.06);
      addS(i, bucket, gBox, at(G, 0, top + hR / 2, -hd / 2, W, thick, Ls, 0, -a), color, 0.06);
      addS(i, 'wall', gTri, at(G, w / 2, top, 0, d, hR, 1, Math.PI / 2), wallColor, 0.04);
      addS(i, 'wall', gTri, at(G, -w / 2, top, 0, d, hR, 1, -Math.PI / 2), wallColor, 0.04);
    }
    function hip(i, G, w, d, top, hR, o, color) { addS(i, 'zinc', gCone4, at(G, 0, top + hR / 2, 0, (w + 2 * o) / Math.SQRT2, hR, (d + 2 * o) / Math.SQRT2), color, 0.05); }
    function windows(G, w, d, y, n, side = 1) { for (let k = 0; k < n; k++) { const x = -w / 2 + (w / (n + 1)) * (k + 1); B.dark.add(gBox, at(G, x, y, side * (d / 2 + 0.03), 1.0, 1.0, 0.08), '#2b2620', 0.02); B.wood.add(gBox, at(G, x, y, side * (d / 2 + 0.05), 1.18, 0.1, 0.06), '#e9e1d0', 0.02); } }

    const WALLS = ['#ece4d3', '#dbe5cf', '#efd8d0', '#d6e2ea', '#f1e1b5', '#e5d3bb', '#cfe0dc', '#f3ead9'];
    const ZINC = ['#a6abae', '#8b6d58', '#7f8a8e', '#a3473a', '#4e6d72', '#9fa4a6', '#7a5b48'];
    const BEBAK = ['#b49a6e', '#a08a66', '#bba57a'];
    const smokeSrc = [], tanks = [];

    function buildHouse(b) {
      const r = rng(b.seed), G = frame(b.x, H(b.x, b.z) - 0.05, b.z, b.ry), i = b.i;
      if (b.kind === 'modern') {
        const w = 7 + r() * 2.2, d = 6 + r() * 1.6, Hh = 2.9 + r() * 0.3, wc = WALLS[Math.floor(r() * WALLS.length)], zc = ZINC[Math.floor(r() * ZINC.length)];
        B.concrete.add(gBox, at(G, 0, 0.22, 0, w + 0.4, 0.5, d + 0.4), '#8e877b');
        addS(i, 'wall', gBox, at(G, 0, 0.45 + Hh / 2, 0, w, Hh, d), wc, 0.04);
        B.dark.add(gBox, at(G, -w * 0.18, 1.45, d / 2 + 0.03, 0.95, 2.0, 0.08), '#3a2c22');
        windows(G, w, d, 2.05, 2); windows(G, w, d, 2.05, 1, -1);
        const top = 0.45 + Hh;
        if (r() < 0.58) gable(i, G, w, d, top, 1.5 + r() * 0.5, 0.55, 'zinc', zc, wc); else hip(i, G, w, d, top, 1.7 + r() * 0.4, 0.6, zc);
        if (r() < 0.6) {
          B.concrete.add(gBox, at(G, 0, 0.12, d / 2 + 1.2, w * 0.7, 0.24, 2.4), '#9a9284');
          B.wood.add(gBox, at(G, -w * 0.32, 1.35, d / 2 + 2.25, 0.14, 2.6, 0.14), '#6b4a30'); B.wood.add(gBox, at(G, w * 0.32, 1.35, d / 2 + 2.25, 0.14, 2.6, 0.14), '#6b4a30');
          addS(i, 'zinc', gBox, at(G, 0, top - 0.3, d / 2 + 1.35, w * 0.74, 0.07, 2.9, 0, 0.16), zc, 0.05);
        }
        if (r() < 0.25) { tanks.push(at(G, w / 2 + 1.2, 0, -d / 2 + 1)); }
        if (r() < 0.42) { const K = at(G, (r() - 0.5) * 4, 0, -d / 2 - 5, 1, 1, 1); B.wall.add(gCyl16, K.clone().multiply(M4(0, 0.55, 0, 0, 0, 0, 1.9, 1.1, 1.9)), BEBAK[0]); B.thatch.add(gCones[1], K.clone().multiply(M4(0, 2.4, 0, 0, 0, 0, 2.9, 3.9, 2.9)), '#8a7656'); smokeSrc.push(new V3().setFromMatrixPosition(K).add(new V3(0, 4.2, 0))); }
        if (r() < 0.3) { const y = 1.6; B.wood.add(gBox, at(G, -w / 2 - 1.6, y / 2, d / 2 + 3.4, 0.08, y, 0.08), '#5d4128'); B.wood.add(gBox, at(G, -w / 2 - 1.6, y / 2, d / 2 + 6.4, 0.08, y, 0.08), '#5d4128'); const cl = ['#b83a2a', '#2a5da8', '#f2b33d', '#e9e2d0', '#3e7d4f']; for (let k = 0; k < 4; k++) B.misc.add(gBox, at(G, -w / 2 - 1.6, y - 0.42, d / 2 + 3.9 + k * 0.62, 0.04, 0.7, 0.5), cl[Math.floor(r() * cl.length)], 0.02); }
        tops[i] = top + 1.9; fronts[i] = at(G, w / 2 - 0.6, 0, d / 2 + 1.1);
      } else if (b.kind === 'kbubu') {
        const rr = 2.3 + r() * 0.4;
        addS(i, 'wall', gCyl16, at(G, 0, 0.55, 0, rr, 1.1, rr), BEBAK[Math.floor(r() * 3)], 0.06);
        addS(i, 'thatch', gCones[Math.floor(r() * 3)], at(G, 0, 0.45 + 2.6, 0, rr + 1.35, 5.2 + r() * 0.6, rr + 1.35, r() * 6), '#8f7b58', 0.12);
        B.wood.add(gCyl8, at(G, 0, 5.9, 0, 0.12, 0.8, 0.12), '#4a3524');
        B.dark.add(gBox, at(G, 0, 0.75, rr + 0.95, 0.85, 1.1, 0.5), '#2e241b');
        smokeSrc.push(new V3().setFromMatrixPosition(G).add(new V3(0, 5.6, 0)));
        tops[i] = 6.4; fronts[i] = at(G, rr + 1.6, 0, rr + 0.8);
      } else if (b.kind === 'gewang') {
        const w = 6.2 + r(), d = 5 + r() * 0.8, Hh = 2.5, wc = BEBAK[Math.floor(r() * 3)];
        B.stone.add(gBox, at(G, 0, 0.18, 0, w + 0.3, 0.4, d + 0.3), '#8f8270');
        addS(i, 'wall', gBox, at(G, 0, 0.35 + Hh / 2, 0, w, Hh, d), wc, 0.1);
        B.dark.add(gBox, at(G, 0, 1.3, d / 2 + 0.03, 0.9, 1.8, 0.08), '#33281e');
        gable(i, G, w, d, 0.35 + Hh, 2.5, 0.85, 'thatch', '#9a8459', wc, 0.38);
        tops[i] = 0.35 + Hh + 3.6; fronts[i] = at(G, w / 2, 0, d / 2 + 1);
      }
    }
    const signs = [];
    function sign(G, lx, ly, lz, text, bg, fg, w = 5, h = 1.25) {
      B.wood.add(gBox, at(G, lx - w / 2 + 0.3, ly / 2, lz, 0.14, ly + h / 2, 0.14), '#4a3524'); B.wood.add(gBox, at(G, lx + w / 2 - 0.3, ly / 2, lz, 0.14, ly + h / 2, 0.14), '#4a3524');
      const tex = signTex(THREE, text, bg, fg), m = desat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
      for (const s of [1, -1]) { const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.applyMatrix4(at(G, lx, ly + h / 2, lz + s * 0.06, 1, 1, 1, s === 1 ? 0 : Math.PI)); me.castShadow = true; signs.push(me); scene.add(me); }
    }
    function buildFacility(b) {
      const f = FAC_BY_KEY[b.kind], i = b.i, G = frame(f.x, H(f.x, f.z) - 0.05, f.z, f.ry);
      if (f.key === 'puskesmas') {
        B.concrete.add(gBox, at(G, 0, 0.3, 0, 19, 0.6, 9), '#4c7d62');
        addS(i, 'wall', gBox, at(G, 0, 0.6 + 1.7, 0, 18, 3.4, 8), '#f2f1ec', 0.02);
        hip(i, G, 18, 8, 4.0, 2.1, 0.7, '#5e8c6e');
        windows(G, 18, 8, 2.4, 6); windows(G, 18, 8, 2.4, 6, -1);
        B.dark.add(gBox, at(G, 0, 1.7, 4.04, 2.2, 2.3, 0.1), '#24302a');
        B.concrete.add(gBox, at(G, 0, 0.15, 6, 7, 0.3, 4), '#a39b8e');
        for (const x of [-3.2, 3.2]) B.wood.add(gBox, at(G, x, 1.7, 7.7, 0.2, 3.1, 0.2), '#e9e6de');
        addS(i, 'zinc', gBox, at(G, 0, 3.3, 6, 7.6, 0.12, 4.4, 0, 0.08), '#5e8c6e');
        sign(G, -7, 2.4, 9.2, 'PUSKESMAS', '#3f7a5c', '#fff8ec', 6.5, 1.4);
        tops[i] = 8.2; fronts[i] = at(G, 5.2, 0, 7.5);
      } else if (f.key === 'sekolah') {
        B.concrete.add(gBox, at(G, 0, 0.3, 0, 25, 0.6, 8), '#9b3b2e');
        addS(i, 'wall', gBox, at(G, 0, 0.6 + 1.6, 0, 24, 3.2, 7), '#efe2bf', 0.03);
        gable(i, G, 24, 7, 3.8, 2.2, 0.6, 'zinc', '#a64534', '#efe2bf');
        windows(G, 24, 7, 2.3, 8); windows(G, 24, 7, 2.3, 8, -1);
        for (let k = 0; k < 7; k++) B.wood.add(gBox, at(G, -11 + k * (22 / 6), 1.7, 5.4, 0.22, 3.0, 0.22), '#e6dcc6');
        addS(i, 'zinc', gBox, at(G, 0, 3.4, 4.6, 24.6, 0.1, 2.6, 0, 0.12), '#a64534');
        B.stone.add(gCyl8, at(G, 0, 0.3, 14, 1.2, 0.6, 1.2), '#c9c2b4');
        B.wood.add(gCyl8, at(G, 0, 5, 14, 0.07, 9.4, 0.07), '#eeeae0');
        B.misc.add(gBox, at(G, 1.25, 9.1, 14, 2.4, 0.72, 0.04), '#c8231f', 0); B.misc.add(gBox, at(G, 1.25, 8.38, 14, 2.4, 0.72, 0.04), '#f4f1ea', 0);
        for (const x of [-12, 12]) { B.wood.add(gBox, at(G, x, 1.1, 20, 0.12, 2.2, 0.12), '#f2efe6'); B.wood.add(gBox, at(G, x, 1.1, 24, 0.12, 2.2, 0.12), '#f2efe6'); B.wood.add(gBox, at(G, x, 2.2, 22, 0.12, 0.12, 4.1), '#f2efe6'); }
        sign(G, 9, 2.0, 9.5, 'SD KUANNOAH', '#efe2bf', '#7c2e24', 6, 1.3);
        tops[i] = 8.4; fronts[i] = at(G, -6, 0, 6.6);
      } else if (f.key === 'pasar') {
        B.concrete.add(gBox, at(G, 0, 0.1, 0, 20, 0.22, 16), '#a59d90');
        const tarp = ['#2e66a8', '#d9772e', '#3d8452', '#c9553f', '#2e66a8', '#e0b23a'];
        let n = 0;
        for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
          const x = -6 + col * 6, z = -5 + row * 5, h = 2.5, tc = tarp[(n++ + row) % tarp.length];
          for (const dx of [-2.2, 2.2]) for (const dz of [-1.5, 1.5]) B.wood.add(gBox, at(G, x + dx, h / 2, z + dz, 0.1, h + (dz > 0 ? 0 : 0.5), 0.1), '#6a4a2e');
          addS(i, 'wall', gBox, at(G, x, h + 0.25, z, 4.9, 0.05, 3.6, 0, -0.14), tc, 0.05);
          B.wood.add(gBox, at(G, x, 0.8, z + 0.4, 4.0, 0.12, 1.6), '#7a5638');
          const goods = ['#c8352e', '#e3b33a', '#5d8b3a', '#d97a2b', '#7a3e7a'];
          for (let k = 0; k < 6; k++) B.misc.add(gLumps[k % 4], at(G, x - 1.6 + k * 0.64, 1.02, z + 0.4 + (k % 2 ? 0.3 : -0.3), 0.26, 0.2, 0.26), goods[(k + row + col) % goods.length], 0.1);
        }
        sign(G, 0, 3.3, 8.6, 'PASAR', '#f2b33d', '#2a1e16', 4.6, 1.2);
        for (const [x, z] of [[11, 6], [12, 3.5]]) { B.dark.add(gBox, at(G, x, 0.55, z, 0.45, 0.7, 1.7), '#24201c'); B.misc.add(gBox, at(G, x, 0.9, z + 0.25, 0.4, 0.25, 0.9), '#b83a2a'); }
        tops[i] = 7; fronts[i] = at(G, 9.5, 0, -6.5);
      } else if (f.key === 'balai') {
        B.stone.add(gCyl16, at(G, 0, 0.3, 0, 7, 0.6, 7), '#9c8f7c');
        for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; B.wood.add(gCyl8, at(G, Math.cos(a) * 5.8, 1.8, Math.sin(a) * 5.8, 0.18, 3.0, 0.18), '#5b3f27'); }
        for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) B.wood.add(gCyl8, at(G, x, 3.5, z, 0.26, 6.4, 0.26), '#4d3522');
        addS(i, 'thatch', gCones[2], at(G, 0, 3.1 + 3.4, 0, 8.6, 6.8, 8.6), '#a38a5a', 0.1);
        B.wood.add(gCyl8, at(G, 0, 10.2, 0, 0.16, 1.2, 0.16), '#3f2c1d');
        for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; B.wood.add(gBox, at(G, Math.cos(a) * 3.6, 0.95, Math.sin(a) * 3.6, 2.8, 0.14, 0.6, -a + Math.PI / 2), '#7a5638'); }
        sign(G, 0, 1.4, 8.6, 'BALAI DUSUN', '#5b3a24', '#f6eedf', 5.6, 1.2);
        tops[i] = 11.5; fronts[i] = at(G, 4.6, 0, 7.4);
      } else if (f.key === 'posyandu') {
        B.concrete.add(gBox, at(G, 0, 0.22, 0, 8.4, 0.45, 6.4), '#8e877b');
        addS(i, 'wall', gBox, at(G, 0, 0.45 + 1.45, 0, 8, 2.9, 6), '#f1e2a6', 0.03);
        gable(i, G, 8, 6, 3.35, 1.7, 0.6, 'zinc', '#3f6f9e', '#f1e2a6');
        windows(G, 8, 6, 2.0, 2); B.dark.add(gBox, at(G, 0, 1.45, 3.03, 1.0, 2.0, 0.08), '#33281e');
        sign(G, 0, 1.6, 5.2, 'POSYANDU', '#2a5da8', '#fff8ec', 4.6, 1.15);
        tops[i] = 6.8; fronts[i] = at(G, 3.2, 0, 4.2);
      } else if (f.key === 'warung') {
        B.concrete.add(gBox, at(G, 0, 0.15, 0, 5.6, 0.3, 4.6), '#8e877b');
        addS(i, 'wall', gBox, at(G, 0, 0.3 + 1.35, 0, 5, 2.7, 4), '#7fb7a4', 0.03);
        addS(i, 'zinc', gBox, at(G, 0, 3.15, -0.2, 5.8, 0.08, 5.0, 0, 0.12), '#9fa4a6');
        addS(i, 'wall', gBox, at(G, 0, 2.6, 3.0, 5.6, 0.05, 2.2, 0, 0.32), '#c9553f');
        B.dark.add(gBox, at(G, 0, 1.6, 2.03, 3.6, 1.4, 0.08), '#2b2620');
        const cl = ['#f2b33d', '#c8352e', '#2a5da8', '#3e7d4f', '#e9e2d0'];
        for (let k = 0; k < 10; k++) B.misc.add(gBox, at(G, -1.6 + (k % 5) * 0.8, 1.2 + Math.floor(k / 5) * 0.55, 2.1, 0.5, 0.4, 0.2), cl[k % 5], 0.05);
        B.wood.add(gBox, at(G, 0, 0.5, 4.3, 3.4, 0.12, 0.6), '#6a4a2e');
        sign(G, 0, 3.2, 2.4, 'WARUNG', '#f6eedf', '#b83a2a', 3.4, 0.9);
        B.dark.add(gBox, at(G, 3.6, 0.55, 3.6, 0.45, 0.7, 1.7, 0.4), '#24201c');
        tops[i] = 5.6; fronts[i] = at(G, 3.2, 0, 3.4);
      }
    }
    for (const b of L.blds) (FAC_BY_KEY[b.kind] ? buildFacility : buildHouse)(b);

    /* pagar batu di sebagian halaman */
    for (const b of L.blds) {
      if (FAC_BY_KEY[b.kind]) continue;
      const r = rng(b.seed + 5); if (r() > 0.55) continue;
      const G = frame(b.x, H(b.x, b.z), b.z, b.ry), hw = 8.5 + r() * 1.5, hd = 7.5 + r();
      const edges = [[-hw, -hd, hw, -hd], [hw, -hd, hw, hd], [-hw, -hd, -hw, hd], [-hw, hd, -2.2, hd], [2.2, hd, hw, hd]];
      for (const [ax, az, bx, bz] of edges) {
        const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 1.6));
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = lerp(ax, bx, t), z = lerp(az, bz, t); if (r() < 0.1) continue; B.stone.add(gLumps[k % 4], at(G, x, 0.35, z, 0.95, 0.5 + r() * 0.25, 0.8, r() * 3), r() < 0.5 ? '#9a8f80' : '#857a6b', 0.14); }
      }
    }
    /* tandon air */
    for (const T of tanks) { B.wood.add(gBox, T.clone().multiply(M4(0, 1.2, 0, 0, 0, 0, 1.3, 2.4, 1.3)), '#5d5650'); B.misc.add(gCyl16, T.clone().multiply(M4(0, 3.0, 0, 0, 0, 0, 0.7, 1.3, 0.7)), R() < 0.5 ? '#d9772e' : '#2e66a8', 0.04); }

    /* pohon */
    const lontar = (x, z, s) => {
      const y = H(x, z), h = (12 + R() * 5) * s, lean = (R() - 0.5) * 0.08;
      B.trunk.add(gCyl8, M4(x, y + h / 2, z, 0, lean, lean, 0.34, h, 0.34), '#5e554c', 0.12);
      const top = new V3(x + Math.sin(lean) * h * 0.5, y + h, z - Math.sin(lean) * h * 0.5);
      for (let k = 0; k < 16; k++) {
        const az = (k / 16) * Math.PI * 2 + R() * 0.3, tilt = -0.6 + (k % 3) * 0.45 + R() * 0.2, dead = k > 12;
        const m = M4(top.x, top.y, top.z, az, -(Math.PI / 2 - tilt) * (dead ? -0.6 : 1), 0, 2.4 * s, 2.4 * s, 1);
        B.leaf.add(gFan, m, dead ? '#7a6a4a' : R() < 0.3 ? '#8c9152' : '#5f7a3e', 0.12);
      }
    };
    const broad = (x, z, s, big = false) => {
      const y = H(x, z), th = (big ? 4.5 : 2.6 + R() * 1.4) * s;
      B.trunk.add(gCyl8, M4(x, y + th / 2, z, 0, 0, 0, (big ? 1.1 : 0.32) * s, th, (big ? 1.1 : 0.32) * s), '#4d3d30', 0.1);
      const n = big ? 16 : 5 + Math.floor(R() * 3), cols = ['#4e6b34', '#5c7a3a', '#3f5a2c', '#6a7f3c'];
      for (let k = 0; k < n; k++) { const a = R() * 6.28, rr = R() * (big ? 6.5 : 1.8) * s, sc = (big ? 3.6 + R() * 1.8 : 1.6 + R() * 1.2) * s; B.leaf.add(gLumps[k % 4], M4(x + Math.cos(a) * rr, y + th + sc * 0.55 + R() * (big ? 3 : 1.2) * s, z + Math.sin(a) * rr, R() * 6, 0, 0, sc, sc, sc), cols[Math.floor(R() * 4)], 0.16); }
      if (big) for (let k = 0; k < 10; k++) { const a = R() * 6.28, rr = 1.5 + R() * 4; B.trunk.add(gCyl8, M4(x + Math.cos(a) * rr, y + 3, z + Math.sin(a) * rr, 0, 0, 0, 0.08, 6, 0.08), '#5a4a3c'); }
    };
    const banana = (x, z) => { const y = H(x, z); for (let k = 0; k < 6; k++) { const a = k * 1.05 + R(); B.leaf.add(gBlade, M4(x, y + 1.2, z, a, -0.5 - R() * 0.4, 0, 1.3, 3.3, 1), R() < 0.2 ? '#9a9450' : '#76a043', 0.1); } B.trunk.add(gCyl8, M4(x, y + 0.9, z, 0, 0, 0, 0.22, 1.8, 0.22), '#7f8f4c'); };
    const coconut = (x, z) => {
      const y = H(x, z), h = 9 + R() * 4, bend = (R() - 0.5) * 3, dir = R() * 6.28;
      const curve = new THREE.QuadraticBezierCurve3(new V3(x, y, z), new V3(x + Math.cos(dir) * bend, y + h * 0.5, z + Math.sin(dir) * bend), new V3(x + Math.cos(dir) * bend * 2.2, y + h, z + Math.sin(dir) * bend * 2.2));
      B.trunk.add(new THREE.TubeGeometry(curve, 10, 0.22, 7), new THREE.Matrix4(), '#7a6b58', 0.1);
      const tp = curve.getPoint(1);
      for (let k = 0; k < 11; k++) B.leaf.add(gBlade, M4(tp.x, tp.y, tp.z, k * 0.57 + R() * 0.2, -1.35 + R() * 0.35, 0, 0.9, 4.8, 1.8), R() < 0.25 ? '#8f8f45' : '#5f8a3a', 0.1);
    };
    for (let k = 0; k < 110; k++) { const a = R() * 6.28, rr = 40 + Math.sqrt(R()) * 220, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 1.2; if (L.free(x, z, 11, 6)) lontar(x, z, 0.9 + R() * 0.3); }
    for (let k = 0; k < 260; k++) { const a = R() * 6.28, rr = Math.sqrt(R()) * 210, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 1.2; if (L.free(x, z, 7.5, 5)) broad(x, z, 0.85 + R() * 0.5); }
    broad(-38, 38, 1.0, true);
    for (let k = 0; k < 40; k++) { const t = R(), i = Math.floor(t * (CREEK.length - 1)), f = t * (CREEK.length - 1) - i, [ax, az] = CREEK[i], [bx, bz] = CREEK[i + 1], s = R() < 0.5 ? -1 : 1; const x = lerp(ax, bx, f) + s * (5 + R() * 4), z = lerp(az, bz, f); if (k < 18 && L.free(x, z, 8, 5)) coconut(x, z); }
    for (const b of L.blds) { if (FAC_BY_KEY[b.kind]) continue; const r = rng(b.seed + 9); if (r() < 0.6) { const a = b.ry + Math.PI + (r() - 0.5) * 1.6, x = b.x + Math.sin(a) * 9, z = b.z + Math.cos(a) * 9; if (L.free(x, z, 5.5, 4.5)) banana(x, z); } }
    for (let k = 0; k < 160; k++) { const a = R() * 6.28, rr = Math.sqrt(R()) * 150, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 1.15; if (L.free(x, z, 6.5, 4)) B.leaf.add(gLumps[k % 4], M4(x, H(x, z) + 0.5, z, R() * 6, 0, 0, 0.9 + R() * 0.8, 0.8 + R() * 0.5, 0.9 + R() * 0.8), R() < 0.5 ? '#6b7a3c' : '#55693a', 0.18); }

    /* sapi, tiang listrik */
    for (const [x, z, ry] of [[-96, -24, 0.5], [-90, -16, 2.4], [104, 40, 1.2], [70, -96, 0.3], [-30, 102, 2.0]]) {
      const y = H(x, z), G = frame(x, y, z, ry), c = R() < 0.5 ? '#9b5a32' : '#b7744a';
      B.misc.add(gBox, at(G, 0, 1.05, 0, 0.7, 0.7, 1.7), c); B.misc.add(gBox, at(G, 0, 1.2, 1.05, 0.42, 0.45, 0.55), c);
      for (const [lx, lz] of [[-0.25, -0.6], [0.25, -0.6], [-0.25, 0.6], [0.25, 0.6]]) B.misc.add(gBox, at(G, lx, 0.38, lz, 0.14, 0.76, 0.14), '#e9e2d0');
    }
    const poles = [];
    for (let x = -176; x <= 176; x += 32) { const z = roadZ(x) - 5.6, y = H(x, z); B.concrete.add(gCyl8, M4(x, y + 4.5, z, 0, 0, 0, 0.13, 9, 0.13), '#9a968c'); B.wood.add(gBox, M4(x, y + 8.4, z, 0, 0, 0, 0.1, 0.1, 1.8), '#4a3c30'); poles.push(new V3(x, y + 8.4, z)); }
    const wirePts = [];
    for (const off of [-0.8, 0.8]) for (let k = 0; k < poles.length - 1; k++) { const a = poles[k].clone().add(new V3(0, 0, off)), b = poles[k + 1].clone().add(new V3(0, 0, off)); for (let s = 0; s < 8; s++) { const t0 = s / 8, t1 = (s + 1) / 8; const p0 = a.clone().lerp(b, t0); p0.y -= Math.sin(t0 * Math.PI) * 1.1; const p1 = a.clone().lerp(b, t1); p1.y -= Math.sin(t1 * Math.PI) * 1.1; wirePts.push(p0, p1); } }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wirePts), new THREE.LineBasicMaterial({ color: COL('#2a2622'), transparent: true, opacity: 0.7 })));

    /* tekstur & material */
    const groundTex = canvasTex(THREE, 256, 256, (g, w, h) => { const im = g.createImageData(w, h); for (let k = 0; k < w * h; k++) { const x = k % w, y = Math.floor(k / w); const n = 0.86 + NC(x * 0.09, y * 0.09, 3) * 0.16 + (hash3(x, y, 3) - 0.5) * 0.16; const v = Math.max(0, Math.min(255, n * 235)); im.data[k * 4] = v; im.data[k * 4 + 1] = v; im.data[k * 4 + 2] = v * 0.97; im.data[k * 4 + 3] = 255; } g.putImageData(im, 0, 0); });
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(110, 110);
    const thatchTex = canvasTex(THREE, 256, 256, (g, w, h) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const x = hash3(k, 1, 2) * w, y = hash3(k, 3, 4) * h, l = 20 + hash3(k, 5, 6) * 70, v = Math.floor(150 + hash3(k, 7, 8) * 105); g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + hash3(k, 9, 1) * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash3(k, 2, 2) - 0.5) * 6, y + l); g.stroke(); } for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y, w, 3); } });
    thatchTex.wrapS = thatchTex.wrapT = THREE.RepeatWrapping; thatchTex.repeat.set(6, 3);
    const corrTex = canvasTex(THREE, 64, 8, (g, w, h) => { for (let x = 0; x < w; x++) { const s = Math.sin((x / w) * Math.PI * 2 * 4) * 0.6; const r = Math.floor((s * 0.5 + 0.5) * 255), b = Math.floor(Math.sqrt(1 - s * s) * 127 + 128); g.fillStyle = `rgb(${r},128,${b})`; g.fillRect(x, 0, 1, h); } }, false);
    corrTex.wrapS = corrTex.wrapT = THREE.RepeatWrapping; corrTex.repeat.set(5, 1);

    const MAT = {
      wall: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }),
      zinc: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.55, normalMap: corrTex, normalScale: new THREE.Vector2(0.9, 0.9) }),
      thatch: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: thatchTex }),
      wood: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })),
      dark: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 })),
      stone: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 })),
      leaf: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide })),
      trunk: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })),
      misc: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })),
      concrete: desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })),
    };
    const meshes = {};
    for (const k of Object.keys(B)) { if (!B[k].p.length) continue; meshes[k] = B[k].mesh(MAT[k], k !== 'concrete'); scene.add(meshes[k]); }
    const baseColors = {}; for (const k of STATEFUL) if (meshes[k]) baseColors[k] = meshes[k].geometry.attributes.color.array.slice();

    /* tanah */
    const TS = 760, TN = 230;
    const tg = new THREE.PlaneGeometry(TS, TS, TN, TN).rotateX(-Math.PI / 2);
    { const P = tg.attributes.position, C = new Float32Array(P.count * 3), c = new THREE.Color(), t = new THREE.Color();
      const dry = COL('#a58c52'), dry2 = COL('#c4aa6c'), green = COL('#6b7a3c'), dirt = COL('#9a6744'), yard = COL('#a98b63'), dust = COL('#a68e6a'), scrub = COL('#6f6a3e'), field = COL('#a48655'), till = COL('#8a7148');
      const CORN = [[-64, 44, 22, 14, 0.3], [62, -52, 18, 16, -0.2], [34, 76, 20, 12, 0.1]];
      for (let k = 0; k < P.count; k++) {
        const x = P.getX(k), z = P.getZ(k); P.setY(k, H(x, z));
        const n1 = NA(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = NB(x * 0.05, z * 0.05, 2) * 0.5 + 0.5;
        c.copy(dry).lerp(dry2, n1);
        if (n2 > 0.5) c.lerp(green, Math.min(0.85, (n2 - 0.5) * 2.2));
        const d = Math.hypot(x * 0.85, z * 0.62); if (d > 150) c.lerp(scrub, sstep(0.55, 0.8, NB(x * 0.015 + 9, z * 0.015, 3) * 0.5 + 0.5) * 0.6);
        if (d < 120) { let my = 1e9; for (const b of L.blds) { if (FAC_BY_KEY[b.kind]) continue; my = Math.min(my, Math.hypot(b.x - x, b.z - z)); } c.lerp(yard, (1 - sstep(5, 10, my)) * 0.85); for (const f of FACS) { const df = Math.hypot(f.x - x, f.z - z); c.lerp(f.key === 'sekolah' ? field : yard, (1 - sstep(f.rad * 0.6, f.rad + 6, df)) * 0.8); } }
        const sk = FAC_BY_KEY.sekolah; if (Math.abs(x - sk.x) < 15 && z > sk.z + 9 && z < sk.z + 27) c.lerp(field, 0.9);
        for (const [cx, cz, w, h, rot] of CORN) { const dx = x - cx, dz = z - cz, lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot); if (Math.abs(lx) < w / 2 + 1 && Math.abs(lz) < h / 2 + 1) c.lerp(till, 0.85); }
        const dr = distRoad(x, z); c.lerp(dust, (1 - sstep(3.5, 9, dr)) * 0.7);
        const dl = distLanes(x, z); c.lerp(dirt, 1 - sstep(1.2, 2.8, dl));
        const dc = distPoly(x, z, CREEK); c.lerp(t.set('#7d6e58'), (1 - sstep(2, 6.5, dc)) * 0.8);
        C[k * 3] = c.r; C[k * 3 + 1] = c.g; C[k * 3 + 2] = c.b;
      }
      tg.setAttribute('color', new THREE.BufferAttribute(C, 3)); tg.computeVertexNormals();
      const ground = new THREE.Mesh(tg, desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: groundTex })));
      ground.receiveShadow = true; scene.add(ground);
      /* jagung */
      const corn = (() => { const bk = new Bucket(); bk.add(gCyl8, M4(0, 1, 0, 0, 0, 0, 0.05, 2, 0.05), '#a3a457'); for (let k = 0; k < 4; k++) bk.add(gBlade, M4(0, 0.6 + k * 0.32, 0, k * 1.7, -1.0, 0, 0.18, 1.1, 0.6), '#8f9a46'); const m = bk.mesh(MAT.leaf); return m.geometry; })();
      const cornPts = []; for (const [cx, cz, w, h, rot] of CORN) for (let a = -w / 2; a < w / 2; a += 1.15) for (let b2 = -h / 2; b2 < h / 2; b2 += 0.9) { const x = cx + a * Math.cos(rot) + b2 * Math.sin(rot), z = cz - a * Math.sin(rot) + b2 * Math.cos(rot); if (L.free(x, z, 7, 3)) cornPts.push([x, z]); }
      const cornM = new THREE.InstancedMesh(corn, MAT.leaf, cornPts.length); cornPts.forEach(([x, z], k) => cornM.setMatrixAt(k, M4(x + (R() - 0.5) * 0.3, H(x, z), z, R() * 6, 0, 0, 1, 0.8 + R() * 0.4, 1))); cornM.castShadow = true; scene.add(cornM);
      /* rumput */
      const tuft = (() => { const bk = new Bucket(); for (let k = 0; k < 3; k++) bk.add(gBlade, M4(0, 0, 0, k * 2.1, -0.25, 0, 0.35, 0.8, 0.4), '#ffffff', 0); return bk.mesh(MAT.leaf).geometry; })();
      const gm = desat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
      const GN = quality === 'hemat' ? 2200 : 5200, grass = new THREE.InstancedMesh(tuft, gm, GN), gc = new THREE.Color();
      let gi = 0; for (let k = 0; k < GN * 3 && gi < GN; k++) { const a = R() * 6.28, rr = Math.sqrt(R()) * 240, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 1.2; if (Math.min(distRoad(x, z), distLanes(x, z)) < 3) continue; if (rr < 110 && !L.free(x, z, 6, 3)) continue; grass.setMatrixAt(gi, M4(x, H(x, z), z, R() * 6, 0, 0, 1 + R(), 0.7 + R() * 0.9, 1 + R())); gc.set(R() < 0.7 ? '#c2a466' : '#8f8f4e').multiplyScalar(0.85 + R() * 0.3); grass.setColorAt(gi, gc); gi++; }
      grass.count = gi; scene.add(grass);
    }
    /* jalan, garis tengah, sungai, jembatan */
    function ribbon(pts, width, yOff, step = 1) {
      const pos = [], nor = [], uv = []; let acc = 0;
      for (let k = 0; k < pts.length - 1; k += step) {
        const a = pts[k], b = pts[Math.min(k + step, pts.length - 1)], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), nx = -dz / len * width / 2, nz = dx / len * width / 2;
        const A1 = [a[0] + nx, H(a[0] + nx, a[1] + nz) + yOff, a[1] + nz], A2 = [a[0] - nx, H(a[0] - nx, a[1] - nz) + yOff, a[1] - nz], B1 = [b[0] + nx, H(b[0] + nx, b[1] + nz) + yOff, b[1] + nz], B2 = [b[0] - nx, H(b[0] - nx, b[1] - nz) + yOff, b[1] - nz];
        pos.push(...A1, ...B1, ...A2, ...A2, ...B1, ...B2); for (let q = 0; q < 6; q++) nor.push(0, 1, 0);
        uv.push(0, acc, 0, acc + len, 1, acc, 1, acc, 0, acc + len, 1, acc + len); acc += len;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
    }
    const densify = (P, step) => { const out = []; for (let k = 0; k < P.length - 1; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step)); for (let s = 0; s < n; s++) out.push([lerp(ax, bx, s / n), lerp(az, bz, s / n)]); } out.push(P[P.length - 1]); return out; };
    const roadDense = densify(ROAD, 3);
    const road = new THREE.Mesh(ribbon(roadDense, 6.6, 0.07), desat(new THREE.MeshStandardMaterial({ color: COL('#56524d'), roughness: 0.88 }))); road.receiveShadow = true; scene.add(road);
    const dash = []; for (let k = 0; k < roadDense.length - 2; k += 3) dash.push(roadDense[k], roadDense[k + 1]);
    { const pos = []; for (let k = 0; k < dash.length; k += 2) { const g = ribbon([dash[k], dash[k + 1]], 0.16, 0.1); pos.push(...g.attributes.position.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, desat(new THREE.MeshStandardMaterial({ color: COL('#d8d2c2'), roughness: 0.8 })))); }
    const water = new THREE.Mesh(ribbon(densify(CREEK, 3), 4.6, -0.55), new THREE.MeshStandardMaterial({ color: COL('#4f7478'), roughness: 0.06, metalness: 0.1, envMapIntensity: 1.4, transparent: true, opacity: 0.92 }));
    scene.add(water);
    { const bx = 69.5, bz = roadZ(69.5); const m = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), desat(new THREE.MeshStandardMaterial({ color: COL('#9a9284'), roughness: 0.9 }))); m.position.set(bx, H(bx + 6, bz) + 0.1, bz); m.castShadow = m.receiveShadow = true; scene.add(m); }

    /* penanda status (bentuk berbeda per state) */
    const TEX = { infected: markerTex(THREE, 'infected'), protected: markerTex(THREE, 'protected'), both: markerTex(THREE, 'both') };
    const markers = L.blds.map((b) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.infected, depthTest: false, depthWrite: false, transparent: true })); s.center.set(0.5, 0.02); s.position.set(b.x, H(b.x, b.z) + tops[b.i] + 0.4, b.z); s.renderOrder = 10; s.scale.set(0.001, 0.001, 1); scene.add(s); return s; });
    /* tempat cuci tangan */
    const barrelGeo = (() => { const bk = new Bucket(); bk.add(gCyl16, M4(0, 0.95, 0, 0, 0, 0, 0.34, 0.8, 0.34), '#2f6fb5', 0.04); bk.add(gCyl16, M4(0, 1.37, 0, 0, 0, 0, 0.36, 0.05, 0.36), '#e9eef2', 0); for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) bk.add(gBox, M4(x, 0.27, z, 0, 0, 0, 0.06, 0.55, 0.06), '#6a4a2e'); bk.add(gBox, M4(0, 0.7, 0.36, 0, 0, 0, 0.08, 0.08, 0.14), '#d9d9d9', 0); bk.add(gCyl8, M4(0.55, 0.45, 0, 0, 0, 0, 0.16, 0.12, 0.16), '#e6b23a', 0.03); return bk.mesh(MAT.misc).geometry; })();
    const barrels = new THREE.InstancedMesh(barrelGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), 48); barrels.castShadow = true; scene.add(barrels);
    const barrelM = L.blds.map((b) => { const F = fronts[b.i] || frame(b.x + 4, 0, b.z + 4, 0), p = new V3().setFromMatrixPosition(F); p.y = H(p.x, p.z); return { p, ry: b.ry }; });
    /* kabut infeksi (points) */
    const mistN = 9, mist = new THREE.BufferGeometry(), mp = [], ms = [], mh = [];
    L.blds.forEach((b) => { for (let k = 0; k < mistN; k++) { mp.push(b.x, H(b.x, b.z), b.z); ms.push(Math.random(), Math.random(), Math.random()); mh.push(b.i); } });
    mist.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mist.setAttribute('aSeed', new THREE.Float32BufferAttribute(ms, 3)); mist.setAttribute('aHouse', new THREE.Float32BufferAttribute(mh, 1));
    const mistU = { uTime: { value: 0 }, uAlpha: { value: new Array(48).fill(0) }, uScale: { value: 1 } };
    const mistMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: mistU,
      vertexShader: 'uniform float uTime; uniform float uAlpha[48]; uniform float uScale; attribute vec3 aSeed; attribute float aHouse; varying float vA; void main(){ float a = aSeed.x*6.283 + uTime*(0.25+aSeed.y*0.35); float r = 2.2 + aSeed.z*3.2; float y = mod(uTime*(0.35+aSeed.y*0.5) + aSeed.x*5.0, 6.0); vec3 p = position + vec3(cos(a)*r, 1.0 + y, sin(a)*r); vA = uAlpha[int(aHouse)] * smoothstep(0.,1.,y) * (1.0 - y/6.0); vec4 mv = modelViewMatrix*vec4(p,1.); gl_PointSize = (7.0 + aSeed.z*7.0) * uScale * 300.0 / -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard; float s = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(0.78,0.24,0.18), s*vA*0.7); }' });
    const mistPts = new THREE.Points(mist, mistMat); mistPts.frustumCulled = false; scene.add(mistPts);
    /* asap dapur */
    const smG = new THREE.BufferGeometry(), sp = [], ss = []; for (const s of smokeSrc.slice(0, 14)) for (let k = 0; k < 12; k++) { sp.push(s.x, s.y, s.z); ss.push(Math.random(), Math.random()); }
    smG.setAttribute('position', new THREE.Float32BufferAttribute(sp.length ? sp : [0, -99, 0], 3)); smG.setAttribute('aSeed', new THREE.Float32BufferAttribute(ss.length ? ss : [0, 0], 2));
    const smU = { uTime: { value: 0 }, uScale: { value: 1 } };
    const smoke = new THREE.Points(smG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: smU,
      vertexShader: 'uniform float uTime; uniform float uScale; attribute vec2 aSeed; varying float vA; void main(){ float t = fract(uTime*0.07 + aSeed.x); vec3 p = position + vec3(sin(t*5.0+aSeed.y*6.0)*1.2 + t*4.0, t*14.0, cos(t*4.0+aSeed.y*5.0)*0.8); vA = smoothstep(0.,0.15,t)*(1.0-t); vec4 mv = modelViewMatrix*vec4(p,1.); gl_PointSize = (6.0 + t*24.0) * uScale * 300.0 / -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(0.86,0.84,0.8), smoothstep(0.5,0.05,d)*vA*0.16); }' }));
    smoke.frustumCulled = false; scene.add(smoke);
    /* warga berjalan */
    const walkPaths = [densify(ROAD_NEAR, 2), ...LANES.map((P) => densify(P, 2))].map((P) => { const acc = [0]; for (let k = 1; k < P.length; k++) acc.push(acc[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1])); return { P, acc, len: acc[acc.length - 1] }; });
    const VN = 34, bodyM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.27, 1.05, 8), desat(new THREE.MeshStandardMaterial({ roughness: 0.85 })), VN), headM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), desat(new THREE.MeshStandardMaterial({ roughness: 0.7 })), VN);
    bodyM.castShadow = true; scene.add(bodyM, headM);
    const CLOTH = ['#8e2f25', '#2e3f66', '#2b2622', '#b07a2e', '#e8e2d6', '#4a6b3c', '#a3473a', '#e3b33a'];
    const walkers = Array.from({ length: VN }, (_, k) => { const wp = walkPaths[k % walkPaths.length]; bodyM.setColorAt(k, COL(CLOTH[k % CLOTH.length])); headM.setColorAt(k, COL(['#6b4630', '#5a3a26', '#7a5038'][k % 3])); return { wp, s: R() * wp.len, dir: R() < 0.5 ? -1 : 1, v: 0.9 + R() * 0.7, off: (R() < 0.5 ? -1 : 1) * (k % walkPaths.length === 0 ? 2.6 : 0.7), ph: R() * 6 }; });
    /* gelombang event */
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 120).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COL('#cfe3ff'), transparent: true, opacity: 0, depthWrite: false, fog: false }));
    wave.renderOrder = 5; scene.add(wave);
    const wave2 = new THREE.Mesh(new THREE.CircleGeometry(1, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COL('#9cc4f5'), transparent: true, opacity: 0, depthWrite: false, fog: false }));
    scene.add(wave2);

    /* pasca-proses: tilt-shift + tone map + vinyet + grain */
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    const postU = { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uFocus: { value: 0.5 }, uBand: { value: 0.3 }, uBlur: { value: 3 }, uSat: { value: 1.06 }, uExpo: { value: 1 }, uVig: { value: 0.55 }, uTime: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } };
    const postMat = new THREE.ShaderMaterial({ uniforms: postU, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFocus, uBand, uBlur, uSat, uExpo, uVig, uTime; uniform vec3 uTint; varying vec2 vUv;
        void main(){ float d = abs(vUv.y - uFocus); float r = smoothstep(uBand*0.5, uBand*0.5 + 0.32, d) * uBlur; vec4 sum = texture2D(tDiffuse, vUv); float w = 1.0;
          if (r > 0.2) { for (int i = 0; i < 20; i++) { float fi = float(i); float a = fi * 2.39996; float rr = sqrt(fi + 0.5) / 4.5; vec2 o = vec2(cos(a), sin(a)) * rr * r / uRes; sum += texture2D(tDiffuse, vUv + o); w += 1.0; } }
          vec3 c = sum.rgb / w; c *= uExpo * uTint; float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(l), c, uSat); gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          float v = smoothstep(1.15, 0.3, length((vUv - 0.5) * vec2(1.0, 1.15)) * 1.25); gl_FragColor.rgb *= mix(1.0, v, uVig);
          float n = fract(sin(dot(vUv * uRes + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453); gl_FragColor.rgb += (n - 0.5) * 0.028; }` });
    const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat); quad.frustumCulled = false; postScene.add(quad);

    /* suasana */
    const MOODS = {
      golden: { sun: '#ffd2a1', sunI: 3.0, dir: [-0.62, 0.38, -0.42], hs: '#c4d8ef', hg: '#8a6a48', hi: 0.95, zen: '#5d8fc9', hor: '#f2cfa0', fog: '#e8cfa6', near: 220, far: 680, expo: 1.0, sat: 1.08, env: 0.55 },
      dusk: { sun: '#d9a48c', sunI: 1.3, dir: [0.7, 0.16, -0.5], hs: '#8f98b0', hg: '#5e5048', hi: 0.8, zen: '#46506a', hor: '#c8a592', fog: '#a89590', near: 150, far: 560, expo: 0.86, sat: 0.72, env: 0.4 },
      dawn: { sun: '#ffe6bf', sunI: 3.5, dir: [0.55, 0.5, 0.35], hs: '#cfe2f6', hg: '#9a7a52', hi: 1.15, zen: '#6aa6dc', hor: '#ffe3b6', fog: '#f1dcbc', near: 260, far: 760, expo: 1.08, sat: 1.12, env: 0.65 },
      haze: { sun: '#d9d2c2', sunI: 1.4, dir: [-0.62, 0.45, -0.42], hs: '#b2b3ae', hg: '#7a7166', hi: 1.0, zen: '#8f9598', hor: '#c6c0b2', fog: '#b9b4a8', near: 40, far: 260, expo: 0.9, sat: 0.5, env: 0.4 },
    };
    const cur = { sun: COL('#ffd2a1'), sunI: 3, dir: new V3(-0.62, 0.38, -0.42), hs: COL('#c4d8ef'), hg: COL('#8a6a48'), hi: 0.95, zen: COL('#5d8fc9'), hor: COL('#f2cfa0'), fog: COL('#e8cfa6'), near: 220, far: 680, expo: 1, sat: 1.08, env: 0.55 };
    const tmpC = new THREE.Color();
    function stepMood(name, k) {
      const m = MOODS[name] || MOODS.golden;
      cur.sun.lerp(tmpC.set(m.sun), k); cur.hs.lerp(tmpC.set(m.hs), k); cur.hg.lerp(tmpC.set(m.hg), k); cur.zen.lerp(tmpC.set(m.zen), k); cur.hor.lerp(tmpC.set(m.hor), k); cur.fog.lerp(tmpC.set(m.fog), k);
      cur.dir.lerp(new V3(...m.dir), k).normalize();
      for (const f of ['sunI', 'hi', 'near', 'far', 'expo', 'sat', 'env']) cur[f] = lerp(cur[f], m[f], k);
    }

    /* kamera */
    const camS = { yaw: 0.9, pitch: 0.4, dist: 220, tx: 0, ty: 0, tz: 4 }, camT = { ...camS };
    let userYaw = 0.3, userPitch = 0.92, userZoom = 1, W = 4, Hh = 4;
    const FOCUS = { overview: null, pasar: [FAC_BY_KEY.pasar, 0.25, 0.62, 62], puskesmas: [FAC_BY_KEY.puskesmas, -0.5, 0.55, 60], sekolah: [FAC_BY_KEY.sekolah, 0.6, 0.6, 70], balai: [FAC_BY_KEY.balai, 1.0, 0.5, 58], posyandu: [FAC_BY_KEY.posyandu, 0.4, 0.55, 52], warung: [FAC_BY_KEY.warung, -0.3, 0.5, 48] };
    function fitDist(pitch) { const a = W / Hh, th = Math.tan(camera.fov * Math.PI / 360); return Math.max(58 / (th * Math.min(a, 1.7)), 80 * Math.sin(pitch) / th) * (a < 1 ? 1.0 : 0.95); }
    function targetCam(dt, t) {
      const p = el._p, mode = p.mode || 'title', a = W / Hh, port = a < 1;
      camera.fov = port ? 46 : 34;
      if (mode === 'game') { camT.pitch = userPitch; camT.yaw = userYaw; camT.dist = fitDist(userPitch) * userZoom; camT.tx = 0; camT.ty = 0; camT.tz = port ? 6 : 2; }
      else if (mode === 'guide' && FOCUS[p.focus]) { const [f, yaw, pitch, d] = FOCUS[p.focus]; camT.tx = f.x; camT.ty = 2; camT.tz = f.z; camT.yaw = yaw; camT.pitch = pitch; camT.dist = d * (port ? 1.7 : 1); }
      else if (mode === 'guide') { camT.pitch = 0.88; camT.yaw = 0.3; camT.dist = fitDist(0.88) * 1.05; camT.tx = 0; camT.ty = 0; camT.tz = port ? 10 : 4; }
      else {
        const spin = p.reduced ? 0 : (mode === 'title' ? 0.04 : 0.022);
        camT.yaw += spin * dt; camT.tx = 0; camT.ty = 0; camT.tz = 4;
        if (mode === 'title') { camT.pitch = port ? 0.42 : 0.34; camT.dist = port ? 250 : 190; }
        else if (mode === 'result') { camT.pitch = 0.6; camT.dist = port ? 300 : 210; }
        else { camT.pitch = 0.5; camT.dist = port ? 240 : 180; }
      }
      const k = 1 - Math.exp(-dt * (mode === 'game' ? 7 : 2.2));
      for (const f of ['pitch', 'dist', 'tx', 'ty', 'tz']) camS[f] = lerp(camS[f], camT[f], k);
      let dy = camT.yaw - camS.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); camS.yaw += dy * k;
      const cp = Math.cos(camS.pitch);
      camera.position.set(camS.tx + Math.sin(camS.yaw) * cp * camS.dist, camS.ty + Math.sin(camS.pitch) * camS.dist, camS.tz + Math.cos(camS.yaw) * cp * camS.dist);
      camera.lookAt(camS.tx, camS.ty, camS.tz); camera.updateProjectionMatrix();
    }
    /* input */
    const ptrs = new Map(); let pinch0 = 0, zoom0 = 1, down = null;
    canvas.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId); if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = userZoom; } });
    canvas.addEventListener('pointermove', (e) => {
      const pr = ptrs.get(e.pointerId); if (!pr) return; const dx = e.clientX - pr.x, dy = e.clientY - pr.y; pr.x = e.clientX; pr.y = e.clientY;
      if (el._p.mode !== 'game') return;
      if (ptrs.size === 1) { userYaw -= dx * 0.006; userPitch = Math.max(0.42, Math.min(1.3, userPitch + dy * 0.004)); if (down) down.moved += Math.abs(dx) + Math.abs(dy); }
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) userZoom = Math.max(0.4, Math.min(1.5, zoom0 * pinch0 / d)); if (down) down.moved = 99; }
    });
    const up = (e) => {
      ptrs.delete(e.pointerId);
      if (down && ptrs.size === 0 && down.moved < 8 && performance.now() - down.t < 350 && el._p.mode === 'game') {
        const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top; let best = -1, bd = 44;
        L.blds.forEach((b, i) => { const v = new V3(b.x, H(b.x, b.z) + tops[i] * 0.6, b.z).project(camera); const sx = (v.x * 0.5 + 0.5) * rect.width, sy = (-v.y * 0.5 + 0.5) * rect.height, dd = Math.hypot(sx - mx, sy - my); if (dd < bd) { bd = dd; best = i; } });
        if (best >= 0) { const b = L.blds[best]; const detail = { index: best, kind: b.kind, name: FAC_BY_KEY[b.kind]?.name ?? null, state: state[best], x: mx, y: my }; el.dispatchEvent(new CustomEvent('buildingtap', { detail, bubbles: true })); el.dispatchEvent(new CustomEvent('BuildingTap', { detail })); if (typeof el._p.onBuildingTap === 'function') el._p.onBuildingTap(detail); }
      }
      if (ptrs.size === 0) down = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { if (el._p.mode !== 'game') return; e.preventDefault(); userZoom = Math.max(0.4, Math.min(1.5, userZoom * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
    canvas.addEventListener('dblclick', () => { userYaw = 0.3; userPitch = 0.92; userZoom = 1; });

    /* state bangunan */
    const state = new Array(48).fill('healthy'), pop = new Array(48).fill(1), shown = new Array(48).fill(0), barrelS = new Array(48).fill(0);
    const LENS = { healthy: ['#ebe4d4', '#d9d2c2'], infected: ['#c2412f', '#b5372a'], protected: ['#3569b8', '#2a5da8'], both: ['#3569b8', '#b5372a'] };
    let lensOn = false;
    function paintLens(i) {
      for (const k of STATEFUL) { const me = meshes[k]; if (!me) continue; const arr = me.geometry.attributes.color.array, base = baseColors[k], col = lensOn ? tmpC.set(LENS[state[i]][k === 'wall' ? 0 : 1]) : null;
        for (const [s, n] of ranges[i][k]) for (let v = s; v < s + n; v++) { if (col) { const j = 0.94 + hash3(v, 1, 2) * 0.1; arr[v * 3] = col.r * j; arr[v * 3 + 1] = col.g * j; arr[v * 3 + 2] = col.b * j; } else { arr[v * 3] = base[v * 3]; arr[v * 3 + 1] = base[v * 3 + 1]; arr[v * 3 + 2] = base[v * 3 + 2]; } }
        me.geometry.attributes.color.needsUpdate = true; }
    }
    function syncState(force) {
      const inf = +el._p.infection || 0, aw = +el._p.awareness || 0;
      for (let i = 0; i < 48; i++) { const a = inf >= INF_T(i), b = aw >= AW_T(i), s = a && b ? 'both' : a ? 'infected' : b ? 'protected' : 'healthy';
        if (s !== state[i] || force) { const was = state[i]; state[i] = s; if (s !== was) pop[i] = 0; if (s !== 'healthy') markers[i].material.map = TEX[s]; markers[i].material.needsUpdate = true; if (lensOn || force) paintLens(i); } }
    }

    /* loop */
    let last = performance.now(), time = 0, alive = true, waveT = -1, waveSrc = null, flashT = -1, lastShield = '', lastMis = false;
    const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    function resize() {
      const r = el.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); Hh = Math.max(2, Math.round(r.height));
      renderer.setSize(W, Hh, false); const pr = renderer.getPixelRatio(); rt.setSize(Math.round(W * pr), Math.round(Hh * pr)); postU.uRes.value.set(W * pr, Hh * pr); camera.aspect = W / Hh; camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    syncState(true);
    let fcount = 0;
    function frameLoop(now) {
      if (!alive) return; requestAnimationFrame(frameLoop);
      try { frameBody(now); } catch (err) { if (fcount++ < 3) console.error('kuannoah-3d frame', err && err.stack || err); }
    }
    function frameBody(now) {
      if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const p = el._p;
      const paused = !!p.paused, reduced = !!p.reduced, mode = p.mode || 'title';
      if (!paused) time += dt * (reduced ? 0.35 : 1);
      if (!!p.lens !== lensOn) { lensOn = !!p.lens; for (let i = 0; i < 48; i++) paintLens(i); }
      syncState(false);
      const sh = p.shield || ''; if (sh && sh !== lastShield && !reduced) { waveT = 0; waveSrc = FAC_BY_KEY[SHIELD_SRC[sh]]; } lastShield = sh;
      const mis = !!p.misinfo; if (lastMis && !mis && mode === 'game' && p.outcome !== 'victory' && p.outcome !== 'defeat') { flashT = 0; if (!reduced) { waveT = 0; waveSrc = FAC_BY_KEY.puskesmas; } } lastMis = mis;
      let mood = 'golden'; if (mode === 'result') mood = p.outcome === 'victory' ? 'dusk' : 'dawn'; else if (mis && mode === 'game') mood = 'haze';
      stepMood(mood, 1 - Math.exp(-dt * 1.6));
      sun.color.copy(cur.sun); sun.intensity = cur.sunI; hemi.color.copy(cur.hs); hemi.groundColor.copy(cur.hg); hemi.intensity = cur.hi;
      skyU.uZen.value.copy(cur.zen); skyU.uHor.value.copy(cur.hor); skyU.uSunDir.value.copy(cur.dir); skyU.uSunCol.value.copy(cur.sun); skyU.uGround.value.copy(cur.fog).multiplyScalar(0.8);
      scene.fog.color.copy(cur.fog); scene.fog.near = cur.near; scene.fog.far = cur.far; scene.environmentIntensity = cur.env;
      U.uDesat.value = lerp(U.uDesat.value, lensOn ? 0.86 : 0, 1 - Math.exp(-dt * 6));
      targetCam(dt, time);
      sky.position.copy(camera.position);
      const tgt = new V3(camS.tx, 0, camS.tz); sun.position.copy(tgt).addScaledVector(cur.dir, 260); sun.target.position.copy(tgt); sun.target.updateMatrixWorld();
      /* penanda */
      const vh = Hh, px = Math.max(28, Math.min(42, vh * 0.044)) * (lensOn ? 1.25 : 1) * (mode === 'game' || mode === 'result' ? 1 : mode === 'guide' ? 0.9 : 0.75);
      const th2 = 2 * Math.tan(camera.fov * Math.PI / 360);
      for (let i = 0; i < 48; i++) {
        const s = markers[i], vis = state[i] !== 'healthy' ? 1 : 0; shown[i] = lerp(shown[i], vis, 1 - Math.exp(-dt * 10)); if (pop[i] < 1) pop[i] = Math.min(1, pop[i] + dt * (reduced ? 10 : 2.4));
        const k = vis ? (reduced ? 1 : easeBack(pop[i])) : shown[i], dd = camera.position.distanceTo(s.position), wpp = dd * th2 / vh, sc = px * wpp * k;
        s.scale.set(sc * 0.8, sc, 1); s.visible = sc > 0.01; s.position.y = H(L.blds[i].x, L.blds[i].z) + tops[i] + 0.4 + (reduced ? 0 : Math.sin(time * 2 + i) * 0.25 * wpp * 6);
        mistU.uAlpha.value[i] = lerp(mistU.uAlpha.value[i], state[i] === 'infected' || state[i] === 'both' ? (lensOn ? 0.5 : 1) : 0, 1 - Math.exp(-dt * 3));
        const bt = state[i] === 'protected' || state[i] === 'both' ? 1 : 0; barrelS[i] = lerp(barrelS[i], bt, 1 - Math.exp(-dt * 6));
        const bm = barrelM[i]; barrels.setMatrixAt(i, M4(bm.p.x, bm.p.y, bm.p.z, bm.ry, 0, 0, barrelS[i] * 1.2 + 0.0001, barrelS[i] * 1.2 + 0.0001, barrelS[i] * 1.2 + 0.0001));
      }
      barrels.instanceMatrix.needsUpdate = true;
      mistU.uTime.value = time; mistU.uScale.value = renderer.getPixelRatio() * (Hh / 800); smU.uTime.value = time; smU.uScale.value = renderer.getPixelRatio() * (Hh / 800);
      /* warga */
      if (!paused && !reduced) walkers.forEach((w, k) => { w.s += w.dir * w.v * dt; if (w.s > w.wp.len) { w.s = w.wp.len; w.dir = -1; } if (w.s < 0) { w.s = 0; w.dir = 1; } });
      walkers.forEach((w, k) => {
        const { P, acc } = w.wp; let j = 1; while (j < acc.length - 1 && acc[j] < w.s) j++; const f = (w.s - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1), ax = P[j - 1][0], az = P[j - 1][1], bx = P[j][0], bz = P[j][1];
        const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, x = lerp(ax, bx, f) + (-dz / l) * w.off * w.dir, z = lerp(az, bz, f) + (dx / l) * w.off * w.dir, y = H(x, z) + Math.abs(Math.sin(time * 7 + w.ph)) * 0.06, ry = Math.atan2(dx * w.dir, dz * w.dir);
        bodyM.setMatrixAt(k, M4(x, y + 0.52, z, ry)); headM.setMatrixAt(k, M4(x, y + 1.24, z, ry));
      });
      bodyM.instanceMatrix.needsUpdate = true; headM.instanceMatrix.needsUpdate = true;
      /* gelombang & kilat */
      if (waveT >= 0 && waveSrc) { waveT += dt / 2.6; const r = 4 + easeOut(waveT) * 95, y = H(waveSrc.x, waveSrc.z) + 0.35; wave.position.set(waveSrc.x, y, waveSrc.z); wave.scale.set(r, 1, r); wave.material.opacity = (1 - waveT) * 0.85; wave2.position.set(waveSrc.x, y - 0.05, waveSrc.z); wave2.scale.set(r, 1, r); wave2.material.opacity = (1 - waveT) * 0.12; if (waveT >= 1) { waveT = -1; wave.material.opacity = 0; wave2.material.opacity = 0; } }
      let flash = 1; if (flashT >= 0) { flashT += dt / 0.9; flash = 1 + Math.sin(Math.min(1, flashT) * Math.PI) * 0.35; if (flashT >= 1) flashT = -1; }
      /* pasca */
      const blurBase = (W / Hh < 1 ? 2.4 : 3.2) * renderer.getPixelRatio();
      const backdrop = mode === 'select' || mode === 'dex';
      postU.uBlur.value = lerp(postU.uBlur.value, p.quality === 'hemat' ? 0 : backdrop ? blurBase * 3.2 : blurBase, 1 - Math.exp(-dt * 4));
      postU.uBand.value = lerp(postU.uBand.value, backdrop ? 0.05 : mode === 'game' ? 0.42 : 0.3, 1 - Math.exp(-dt * 4));
      postU.uFocus.value = mode === 'game' ? 0.47 : 0.5;
      postU.uSat.value = lerp(postU.uSat.value, cur.sat * (paused ? 0.28 : 1), 1 - Math.exp(-dt * 5));
      postU.uExpo.value = cur.expo * (paused ? 0.82 : 1) * flash * (backdrop ? 0.9 : 1); postU.uTime.value = reduced ? 0 : time;
      renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam);
      if (window.__K3DEBUG && !window.__k3logged && time > 0.2) { window.__k3logged = 1; const px = new Uint8Array(4); renderer.readRenderTargetPixels; const gl = renderer.getContext(); gl.readPixels(Math.floor(W/2), Math.floor(Hh/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); console.log('px', px.join(','), 'cam', camera.position.toArray().map((v) => v.toFixed(1)).join(','), 'fov', camera.fov, 'calls', renderer.info.render.calls, 'tris', renderer.info.render.triangles, 'W', W, Hh, 'meshes', Object.keys(meshes).join(','), 'sat', postU.uSat.value, 'expo', postU.uExpo.value); }
    }
    const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, t), 3);
    requestAnimationFrame(frameLoop);
    el.dispatchEvent(new CustomEvent('ready'));
    return { dispose() { alive = false; ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); }, syncState };
  }

  const PROPS = ['infection', 'awareness', 'mode', 'focus', 'shield', 'misinfo', 'paused', 'lens', 'reduced', 'quality', 'outcome', 'onBuildingTap'];
  class Kuannoah3D extends HTMLElement {
    constructor() { super(); this._p = { infection: 0, awareness: 0, mode: 'title', focus: '', shield: '', misinfo: false, paused: false, lens: false, reduced: false, quality: 'tinggi', outcome: '' }; }
    static get observedAttributes() { return PROPS.filter((p) => p !== 'onBuildingTap'); }
    attributeChangedCallback(n, o, v) { const bool = ['misinfo', 'paused', 'lens', 'reduced'].includes(n); this._p[n] = bool ? v !== null && v !== 'false' : ['infection', 'awareness'].includes(n) ? +v : v; }
    connectedCallback() {
      this.style.display = 'block'; if (!this.style.position) this.style.position = 'relative'; this.style.width = this.style.width || '100%'; this.style.height = this.style.height || '100%'; this.style.overflow = 'hidden';
      if (this._w || this._busy) return; this._busy = true;
      createWorld(this).then((w) => { this._busy = false; if (!this.isConnected) { w.dispose(); return; } this._w = w; }).catch((e) => { this._busy = false; console.error('kuannoah-3d', e); this.style.background = '#c9ae78'; });
    }
    disconnectedCallback() { setTimeout(() => { if (!this.isConnected && this._w) { this._w.dispose(); this._w = null; } }, 0); }
  }
  for (const p of PROPS) Object.defineProperty(Kuannoah3D.prototype, p, { get() { return this._p[p]; }, set(v) { this._p[p] = v; }, configurable: true });
  customElements.define('kuannoah-3d', Kuannoah3D);

  /* ---------- spesimen ---------- */
  async function createSpecimen(el) {
    const THREE = await loadThree(), V3 = THREE.Vector3, COL = (h) => new THREE.Color(h);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.setClearColor(0x000000, 0);
    const cv = renderer.domElement; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;'; el.appendChild(cv);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50); camera.position.set(0, 0.3, 5.4); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(COL('#f3e6d0'), COL('#3a2c22'), 0.9));
    const key = new THREE.DirectionalLight(COL('#ffe2bd'), 2.6); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(COL('#9cc0ff'), 2.2); rim.position.set(-4, 1.5, -3); scene.add(rim);
    const g = new THREE.Group(); scene.add(g);
    const kind = el._p.kind || 'rhinovirus', locked = !!el._p.locked;
    const tone = (hex) => { const c = COL(hex); if (locked) { const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; c.setRGB(l, l, l).multiplyScalar(0.75); } return c; };
    if (kind === 'rhinovirus') {
      const ico = new THREE.IcosahedronGeometry(1, 9), P = ico.attributes.position, seen = new Map(), pts = [];
      for (let i = 0; i < P.count; i++) { const k = `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`; if (!seen.has(k)) { seen.set(k, 1); pts.push(new V3(P.getX(i), P.getY(i), P.getZ(i)).normalize()); } }
      const ax5 = []; { const b = new THREE.IcosahedronGeometry(1, 0).attributes.position, s2 = new Set(); for (let i = 0; i < b.count; i++) { const k = `${b.getX(i).toFixed(3)},${b.getY(i).toFixed(3)},${b.getZ(i).toFixed(3)}`; if (!s2.has(k)) { s2.add(k); ax5.push(new V3(b.getX(i), b.getY(i), b.getZ(i)).normalize()); } } }
      const ax3 = []; { const b = new THREE.IcosahedronGeometry(1, 0).attributes.position; for (let i = 0; i < b.count; i += 3) ax3.push(new V3().fromBufferAttribute(b, i).add(new V3().fromBufferAttribute(b, i + 1)).add(new V3().fromBufferAttribute(b, i + 2)).normalize()); }
      const bead = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 }), pts.length);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
      pts.forEach((p, i) => {
        const a5 = Math.min(...ax5.map((a) => p.angleTo(a))), a3 = Math.min(...ax3.map((a) => p.angleTo(a)));
        const r = 1 + 0.085 * Math.exp(-((a5 / 0.15) ** 2)) - 0.055 * Math.exp(-(((a5 - 0.29) / 0.055) ** 2)) + 0.03 * Math.exp(-((a3 / 0.1) ** 2)) + (Math.random() - 0.5) * 0.012;
        const hex = a5 < 0.21 ? '#5d86b5' : a3 < 0.17 ? '#c46a4f' : '#86a56d';
        c.copy(tone(hex)).multiplyScalar(0.88 + Math.random() * 0.22); bead.setColorAt(i, c);
        const s = 0.083 + (Math.random() - 0.5) * 0.012; m.compose(p.clone().multiplyScalar(r), q, new V3(s, s, s)); bead.setMatrixAt(i, m);
      });
      g.add(bead); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.97, 48, 32), new THREE.MeshStandardMaterial({ color: tone('#3a2e28'), roughness: 0.8 })));
    } else if (kind === 'ecoli') {
      const body = new THREE.CapsuleGeometry(0.42, 1.5, 12, 40).rotateZ(Math.PI / 2); const P = body.attributes.position, v = new V3(), nz = noiseFactory(3);
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const k = 1 + nz(v.x * 4, v.y * 4 + v.z * 3, 2) * 0.05; P.setXYZ(i, v.x, v.y * k, v.z * k); } body.computeVertexNormals();
      g.add(new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: tone('#bba77a'), roughness: 0.62 })));
      const fm = new THREE.MeshStandardMaterial({ color: tone('#8e7f5c'), roughness: 0.7 });
      for (let f = 0; f < 7; f++) { const ang = (f / 7) * Math.PI * 2, st = new V3(-0.9 + Math.random() * 1.6, Math.cos(ang) * 0.4, Math.sin(ang) * 0.4); const ptsF = []; for (let k = 0; k <= 40; k++) { const t = k / 40; ptsF.push(new V3(st.x - t * 2.6, st.y * (1 + t * 1.6) + Math.sin(t * 14 + f) * 0.12, st.z * (1 + t * 1.6) + Math.cos(t * 14 + f) * 0.12)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsF), 80, 0.016, 5), fm)); }
      const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), fm, 90), m = new THREE.Matrix4();
      for (let k = 0; k < 90; k++) { const a = Math.random() * 6.28, x = (Math.random() - 0.5) * 1.8, n = new V3(0, Math.cos(a), Math.sin(a)), p = new V3(x, n.y * 0.43, n.z * 0.43).addScaledVector(n, 0.09); m.compose(p, new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), n), new V3(1, 1, 1)); pil.setMatrixAt(k, m); }
      g.add(pil); g.rotation.z = 0.35; g.scale.setScalar(1.05);
    } else {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 32), new THREE.MeshStandardMaterial({ color: tone('#38454c'), roughness: 0.7 })));
      const N = 180, dim = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), new THREE.MeshStandardMaterial({ roughness: 0.48 }), N * 2), m = new THREE.Matrix4(), c = new THREE.Color();
      for (let k = 0; k < N; k++) { const y = 1 - (k / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = k * 2.39996, n = new V3(Math.cos(th) * rr, y, Math.sin(th) * rr), t = new V3().crossVectors(n, new V3(0, 1, 0.3)).normalize(), b = new V3().crossVectors(n, t), raft = Math.floor(th / 1.1) % 3;
        for (const s of [-1, 1]) { const p = n.clone().multiplyScalar(0.97).addScaledVector(b, s * 0.065); const qq = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), t); m.compose(p, qq, new V3(1, 1, 1)); dim.setMatrixAt(k * 2 + (s > 0 ? 1 : 0), m); c.copy(tone(raft === 0 ? '#d8c9a3' : raft === 1 ? '#9db3a8' : '#c9a98a')).multiplyScalar(0.9 + Math.random() * 0.2); dim.setColorAt(k * 2 + (s > 0 ? 1 : 0), c); } }
      g.add(dim);
    }
    let alive = true, last = performance.now(), visible = true, drag = null, vy = 0;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }); io.observe(el);
    cv.addEventListener('pointerdown', (e) => { drag = e.clientX; }); window.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('pointermove', (e) => { if (drag != null) { vy = (e.clientX - drag) * 0.01; drag = e.clientX; } });
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); renderer.setSize(Math.max(2, r.width), Math.max(2, r.height), false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); }); ro.observe(el);
    const loop = (now) => { if (!alive) return; requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!visible || document.hidden) return; const red = document.documentElement.dataset.motion === 'reduced'; g.rotation.y += (red ? 0 : (locked ? 0.08 : 0.28) * dt) + vy; g.rotation.x = Math.sin(now / 4000) * (red ? 0 : 0.12); vy *= 0.9; renderer.render(scene, camera); };
    requestAnimationFrame(loop);
    return { dispose() { alive = false; io.disconnect(); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); cv.remove(); } };
  }
  class Specimen3D extends HTMLElement {
    constructor() { super(); this._p = { kind: 'rhinovirus', locked: false }; }
    static get observedAttributes() { return ['kind', 'locked']; }
    attributeChangedCallback(n, o, v) { this._p[n] = n === 'locked' ? v !== null && v !== 'false' : v; }
    connectedCallback() { this.style.display = 'block'; this.style.position = this.style.position || 'relative'; this.style.width = this.style.width || '100%'; this.style.height = this.style.height || '100%'; if (this._w || this._busy) return; this._busy = true; createSpecimen(this).then((w) => { this._busy = false; if (!this.isConnected) { w.dispose(); return; } this._w = w; }).catch((e) => { this._busy = false; console.error('specimen-3d', e); }); }
    disconnectedCallback() { setTimeout(() => { if (!this.isConnected && this._w) { this._w.dispose(); this._w = null; } }, 0); }
  }
  for (const p of ['kind', 'locked']) Object.defineProperty(Specimen3D.prototype, p, { get() { return this._p[p]; }, set(v) { this._p[p] = v; }, configurable: true });
  customElements.define('specimen-3d', Specimen3D);
})();
