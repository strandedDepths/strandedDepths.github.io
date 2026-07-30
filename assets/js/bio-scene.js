import { careerSteps } from "./data/career.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

renderFallbackList(); // always populate the accessible list, regardless of what happens next

if (reduceMotion) {
  document.body.classList.add("no-3d");
} else {
  initScene().catch(() => {
    document.body.classList.add("no-3d");
  });
}

function renderFallbackList() {
  const list = document.getElementById("timeline-list");
  if (!list) return;
  list.innerHTML = careerSteps
    .map(
      (step) => `
      <li>
        <span class="depth-tag">${step.label}</span>
        <h3>${step.title}</h3>
        <span class="period">${step.period}</span>
        <p>${step.description}</p>
      </li>`
    )
    .join("");
}

async function initScene() {
  if (!window.WebGLRenderingContext) throw new Error("no-webgl");

  const THREE = await import("./vendor/three.module.js");

  const canvas = document.getElementById("bio-canvas");
  const sceneWrap = document.getElementById("dive-scene");
  const track = document.getElementById("dive-track");
  const labelsWrap = document.getElementById("dive-labels");
  if (!canvas || !sceneWrap || !track) throw new Error("missing-dom");

  // ---- renderer / scene -------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9fc7d9, 18, 62);

  const frustumSize = 20;
  let aspect = sceneWrap.clientWidth / sceneWrap.clientHeight;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    120
  );
  // No X component on the offset: world +X maps exactly to screen-right,
  // so the route (which runs mostly along +X) reads unambiguously left-to-right.
  const isoOffset = new THREE.Vector3(0, 8, 14);

  // ---- lights -------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xbfe3ea, 1.0));
  const sun = new THREE.DirectionalLight(0xfff3d6, 0.85);
  sun.position.set(8, 14, 6);
  scene.add(sun);

  // ---- the sailing route: left to right --------------------------------------
  const routePoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(12, 0, 2.4),
    new THREE.Vector3(23, 0, -1.8),
    new THREE.Vector3(35, 0, 2.6),
    new THREE.Vector3(46, 0, -1.2),
    new THREE.Vector3(58, 0, 1.6),
  ];
  const curve = new THREE.CatmullRomCurve3(routePoints);
  const routeSpanX = 58;

  const wakeGeo = new THREE.TubeGeometry(curve, 240, 0.035, 6, false);
  const wakeMat = new THREE.MeshBasicMaterial({ color: 0xf3fbff, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Mesh(wakeGeo, wakeMat));

  // ---- sea -------------------------------------------------------------------
  const seaGeo = new THREE.PlaneGeometry(120, 70, 48, 32);
  const seaBasePos = Float32Array.from(seaGeo.attributes.position.array);
  const seaMat = new THREE.MeshStandardMaterial({
    color: 0x2f7d95,
    flatShading: true,
    roughness: 0.85,
    transparent: true,
    opacity: 0.96,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(routeSpanX / 2, -0.15, 0.5);
  scene.add(sea);

  // ---- landmark islands, one per career step — big and clear ------------------
  const ISLAND_SCALE = 1.9;
  const up = new THREE.Vector3(0, 1, 0);
  const islandData = [];
  careerSteps.forEach((step, i) => {
    const pos = curve.getPointAt(step.t);
    const tangent = curve.getTangentAt(step.t).normalize();

    if (step.marker === "fog") {
      // No landmass here — just a misty patch of violet water, right on the route.
      buildMistZone(THREE, scene, pos);
      islandData.push({ step, worldPos: pos.clone() });
      return;
    }

    let islandPos;
    if (step.marker === "house") {
      // The starting island: place it to the left of where the route begins,
      // so the drakkar visibly departs from it rather than sailing past it.
      islandPos = pos.clone().add(new THREE.Vector3(-4.6, 0, 1.4));
    } else {
      const side = i % 2 === 0 ? 1 : -1;
      const perp = new THREE.Vector3().crossVectors(tangent, up).normalize().multiplyScalar(6.5 * side);
      islandPos = pos.clone().add(perp);
    }
    const group = buildLandmark(THREE, step.marker);
    group.scale.setScalar(ISLAND_SCALE);
    group.position.copy(islandPos);
    scene.add(group);
    islandData.push({ step, worldPos: islandPos });
  });

  // DOM label per stop
  const labelEls = islandData.map(({ step }) => {
    const el = document.createElement("div");
    el.className = "dive-label";
    el.innerHTML = `
      <span class="dive-label__dot"></span>
      <span class="dive-label__text"><strong>${step.title}</strong><span>${step.period} · ${step.label}</span></span>`;
    labelsWrap.appendChild(el);
    return el;
  });

  // ---- small islands scattered here and there ----------------------------------
  const scatterCount = 14;
  for (let i = 0; i < scatterCount; i++) {
    const t = clamp(rand(0.02, 0.99), 0, 0.99);
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = rand(4.5, 15);
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const perp = new THREE.Vector3().crossVectors(tangent, up).normalize().multiplyScalar(dist * side);
    const islet = buildScatterIslet(THREE, rand(0.4, 0.9));
    islet.position.copy(pos.clone().add(perp));
    scene.add(islet);
  }

  // ---- cloud wall beyond the last island — hides what comes next, map-style ---
  const endPos = curve.getPointAt(1);
  const endTangent = curve.getTangentAt(1).normalize();

  const cloudWall = buildCloudWall(THREE, endPos.clone().add(endTangent.clone().multiplyScalar(7)));
  scene.add(cloudWall);

  // ---- low-poly drakkar --------------------------------------------------------
  const { group: ship, oars, pennant } = buildShip(THREE);
  scene.add(ship);

  // ---- resize -----------------------------------------------------------------
  function resize() {
    const w = sceneWrap.clientWidth;
    const h = sceneWrap.clientHeight;
    aspect = w / h;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", resize);
  resize();

  // ---- scroll-driven progress ---------------------------------------------
  let targetProgress = 0;
  let progress = 0;

  function updateProgressFromScroll() {
    const rect = track.getBoundingClientRect();
    const trackHeight = track.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    targetProgress = trackHeight > 0 ? clamp(scrolled / trackHeight, 0, 1) : 0;
  }
  window.addEventListener("scroll", updateProgressFromScroll, { passive: true });
  updateProgressFromScroll();

  // ---- animation loop -------------------------------------------------------
  const tmpTangent = new THREE.Vector3();
  const forwardAxis = new THREE.Vector3(1, 0, 0);
  const worldPos = new THREE.Vector3();
  const clock = new THREE.Clock();
  let rowIntensity = 0;

  function animate() {
    const t = clock.getElapsedTime();

    const progressBefore = progress;
    progress += (targetProgress - progress) * 0.08;
    const moving = Math.abs(progress - progressBefore) > 0.0002;
    rowIntensity += ((moving ? 1 : 0) - rowIntensity) * 0.12;

    const pos = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress, tmpTangent).normalize();

    ship.position.copy(pos);
    ship.position.y = Math.sin(t * 1.4) * 0.06; // gentle bob
    const quat = new THREE.Quaternion().setFromUnitVectors(forwardAxis, tangent);
    ship.quaternion.slerp(quat, 0.25);
    ship.rotation.z += Math.sin(t * 1.1) * 0.002; // slight roll

    camera.position.copy(pos).add(isoOffset);
    camera.lookAt(pos);

    // rowing oars — only stroke while the ship is actually advancing
    oars.forEach((o) => {
      o.pivot.rotation.x = Math.sin(t * 4 + o.phase) * 0.4 * rowIntensity;
    });

    // pennant fluttering in the wind
    if (pennant) {
      pennant.rotation.y = Math.sin(t * 6) * 0.5;
      pennant.rotation.z = Math.sin(t * 4.2) * 0.08;
    }

    // waves on the sea
    if (!reduceMotion) {
      const posAttr = sea.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = seaBasePos[i * 3];
        const by = seaBasePos[i * 3 + 1];
        posAttr.setZ(i, Math.sin(bx * 0.3 + t * 1.1) * 0.06 + Math.cos(by * 0.26 + t * 0.75) * 0.045);
      }
      posAttr.needsUpdate = true;
    }

    // label projection + lit state
    islandData.forEach((isle, i) => {
      worldPos.copy(isle.worldPos);
      const screen = worldPos.clone().project(camera);
      const x = (screen.x * 0.5 + 0.5) * sceneWrap.clientWidth;
      const y = (-screen.y * 0.5 + 0.5) * sceneWrap.clientHeight;
      const el = labelEls[i];
      el.style.transform = `translate(${x + 14}px, ${y - 10}px)`;
      el.classList.toggle("is-lit", progress >= isle.step.t - 0.015);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ---- landmark dispatch ---------------------------------------------------------

function buildLandmark(THREE, marker) {
  switch (marker) {
    case "house":
      return buildHouseIsland(THREE);
    case "osaka":
      return buildOsakaIsland(THREE);
    case "montblanc":
      return buildMontBlancIsland(THREE);
    case "bigben":
      return buildBigBenIsland(THREE);
    default:
      return buildScatterIslet(THREE, 0.7);
  }
}

function buildLandBase(THREE, radius, colorLand, colorCliff) {
  const group = new THREE.Group();
  const land = new THREE.Mesh(
    new THREE.ConeGeometry(radius, radius * 0.7, 6),
    new THREE.MeshStandardMaterial({ color: colorLand, flatShading: true, roughness: 1 })
  );
  land.position.y = radius * 0.08;
  group.add(land);

  const cliff = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 1.15, radius * 0.35, 6),
    new THREE.MeshStandardMaterial({ color: colorCliff, flatShading: true, roughness: 1 })
  );
  cliff.position.y = -radius * 0.2;
  group.add(cliff);

  return group;
}

function buildPine(THREE, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.3, 5),
    new THREE.MeshStandardMaterial({ color: 0x5a4127, flatShading: true })
  );
  trunk.position.y = 0.15;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x2f6b45, flatShading: true })
  );
  foliage.position.y = 0.48;
  group.add(trunk, foliage);
  group.scale.setScalar(scale);
  return group;
}

function buildBoulder(THREE, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: 0x7d7a72, flatShading: true, roughness: 1 })
  );
  rock.scale.set(rand(0.8, 1.2) * scale, rand(0.55, 0.8) * scale, rand(0.8, 1.2) * scale);
  rock.rotation.y = rand(0, Math.PI);
  return rock;
}

// ---- island 1 — the starting island: a wooden house ----------------------------

function buildHouseIsland(THREE) {
  const group = buildLandBase(THREE, 1.9, 0x5c8a4f, 0x8a7a5c);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6b4530, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9aa9ad, flatShading: true });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, flatShading: true });

  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.68), wallMat);
  walls.position.set(0, 0.5, 0);
  group.add(walls);

  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.3, 3), roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.position.set(0, 0.92, 0);
  group.add(roof);

  [-0.5, 0.5].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.4, 0.045), trimMat);
    post.position.set(x, 0.9, 0.34);
    post.rotation.x = -0.15;
    group.add(post);
  });

  // two pines, tucked in close to the house — not out on the water
  const pine1 = buildPine(THREE, 0.55);
  pine1.position.set(0.55, 0.32, 0.55);
  const pine2 = buildPine(THREE, 0.5);
  pine2.position.set(-0.5, 0.3, -0.5);
  group.add(pine1, pine2);

  [
    [0.9, 0.28, -0.4],
    [-0.85, 0.26, 0.5],
  ].forEach(([x, y, z]) => {
    const b = buildBoulder(THREE, 1);
    b.position.set(x, y, z);
    group.add(b);
  });

  return group;
}

// ---- island 2 — Osaka castle + a cherry blossom tree ---------------------------

function buildOsakaIsland(THREE) {
  const group = buildLandBase(THREE, 1.7, 0x6a9457, 0x8a7a5c);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2ede0, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f5c4a, flatShading: true });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, flatShading: true });

  const tiers = [
    { w: 0.95, h: 0.36, y: 0.78 },
    { w: 0.68, h: 0.3, y: 1.2 },
    { w: 0.44, h: 0.26, y: 1.54 },
  ];
  tiers.forEach((tier) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.w * 0.8), wallMat);
    wall.position.y = tier.y;
    group.add(wall);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(tier.w * 0.8, tier.h * 0.75, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = tier.y + tier.h / 2 + tier.h * 0.38;
    group.add(roof);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), trimMat);
    finial.position.y = tier.y + tier.h + tier.h * 0.6;
    group.add(finial);
  });

  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3226, flatShading: true })
  );
  trunk.position.y = 0.3;
  tree.add(trunk);

  const blossomMat = new THREE.MeshStandardMaterial({ color: 0xf4a9c8, flatShading: true });
  const blossomSpots = [
    [0, 0.68, 0],
    [0.18, 0.6, 0.1],
    [-0.18, 0.62, -0.08],
    [0.1, 0.8, -0.14],
    [-0.14, 0.76, 0.12],
    [0, 0.92, 0],
  ];
  blossomSpots.forEach(([x, y, z]) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), blossomMat);
    puff.position.set(x, y, z);
    tree.add(puff);
  });
  tree.position.set(-1.1, 0.5, 0.55);
  group.add(tree);

  return group;
}

// ---- island 3 — Mont Blanc, a snow-capped peak ---------------------------------

function buildMontBlancIsland(THREE) {
  const group = buildLandBase(THREE, 1.95, 0x4d6a5a, 0x7d7266);

  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b6459, flatShading: true, roughness: 1 })
  );
  rock.position.y = 1.2;
  group.add(rock);

  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.95, 6),
    new THREE.MeshStandardMaterial({ color: 0xf4fbff, flatShading: true, roughness: 0.7 })
  );
  snow.position.y = 2.1;
  group.add(snow);

  const pine = buildPine(THREE, 0.7);
  pine.position.set(1.05, 0.4, 0.6);
  group.add(pine);

  return group;
}

// ---- island 5 — Big Ben, a clock tower ------------------------------------------

function buildBigBenIsland(THREE) {
  const group = buildLandBase(THREE, 1.6, 0x5c8a4f, 0x8a7a5c);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbb994, flatShading: true, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c4a3a, flatShading: true });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd0, flatShading: true });
  const handMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true });

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.9, 0.42), stoneMat);
  tower.position.y = 1.15;
  group.add(tower);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.6, 4), roofMat);
  spire.rotation.y = Math.PI / 4;
  spire.position.y = 2.4;
  group.add(spire);

  const face = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), faceMat);
  face.position.set(0, 1.6, 0.22);
  group.add(face);

  const hourHand = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.07), handMat);
  hourHand.position.set(0, 1.62, 0.225);
  hourHand.rotation.z = -1.1;
  group.add(hourHand);

  const minuteHand = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.1), handMat);
  minuteHand.position.set(0, 1.63, 0.225);
  minuteHand.rotation.z = 0.6;
  group.add(minuteHand);

  return group;
}

// ---- small decorative islets scattered here and there --------------------------

function buildScatterIslet(THREE, scale) {
  const group = buildLandBase(THREE, 1.1, 0x5c8a4f, 0x8a7a5c);
  if (Math.random() > 0.4) {
    const pine = buildPine(THREE, 0.6);
    pine.position.set(rand(-0.3, 0.3), 0.35, rand(-0.3, 0.3));
    group.add(pine);
  }
  group.scale.setScalar(scale);
  return group;
}

// ---- stage 4 — no island, just a misty patch of violet water ------------------

function buildMistZone(THREE, scene, pos) {
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x6a4fb0,
    flatShading: true,
    transparent: true,
    opacity: 0.75,
    roughness: 0.6,
  });
  const patch = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), waterMat);
  patch.rotation.x = -Math.PI / 2;
  patch.position.copy(pos);
  patch.position.y = -0.1;
  scene.add(patch);

  const fogMat = new THREE.MeshBasicMaterial({ color: 0xd8cdf0, transparent: true, opacity: 0.4 });
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(new THREE.CircleGeometry(rand(1.2, 2.4), 10), fogMat.clone());
    puff.rotation.x = -Math.PI / 2;
    puff.position.set(pos.x + rand(-2.8, 2.8), rand(0.3, 1.8), pos.z + rand(-2.8, 2.8));
    scene.add(puff);
  }
}

// ---- the cloud wall beyond the last island, map-style ---------------------------

function buildCloudWall(THREE, centerPos) {
  const group = new THREE.Group();
  const puffMat = new THREE.MeshStandardMaterial({ color: 0xf6fbff, flatShading: true, roughness: 1 });
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xd7e6ee, flatShading: true, roughness: 1 });

  for (let i = 0; i < 15; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1, 2), 0), puffMat);
    puff.position.set(
      centerPos.x + rand(-2, 9),
      rand(0.4, 7),
      centerPos.z + rand(-17, 17)
    );
    puff.scale.set(rand(0.8, 1.3), rand(0.6, 0.9), rand(0.8, 1.3));
    group.add(puff);

    // a softer shaded puff tucked just behind/below each one, for a little volume
    const shade = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.7, 1.5), 0), shadeMat);
    shade.position.set(puff.position.x - 0.5, puff.position.y - 0.4, puff.position.z);
    shade.scale.set(rand(0.7, 1.1), rand(0.5, 0.7), rand(0.7, 1.1));
    group.add(shade);
  }

  return group;
}

// ---- the drakkar ------------------------------------------------------------------

function buildShip(THREE) {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4530, flatShading: true, roughness: 0.8 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x40291a, flatShading: true });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xece2cf, flatShading: true, side: THREE.DoubleSide });
  const oarMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, flatShading: true });
  const pennantMat = new THREE.MeshStandardMaterial({ color: 0xff7a45, flatShading: true, side: THREE.DoubleSide });

  const hullGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.8, 6);
  hullGeo.rotateZ(Math.PI / 2);
  hullGeo.scale(1, 0.55, 1);
  const hull = new THREE.Mesh(hullGeo, woodMat);
  group.add(hull);

  const bowGeo = new THREE.ConeGeometry(0.3, 0.6, 6);
  bowGeo.rotateZ(-Math.PI / 2);
  bowGeo.scale(1, 0.55, 1);
  const bow = new THREE.Mesh(bowGeo, woodMat);
  bow.position.set(1.15, 0, 0);
  group.add(bow);

  const sternGeo = new THREE.ConeGeometry(0.28, 0.45, 6);
  sternGeo.rotateZ(Math.PI / 2);
  sternGeo.scale(1, 0.55, 1);
  const stern = new THREE.Mesh(sternGeo, woodMat);
  stern.position.set(-1.15, 0, 0);
  group.add(stern);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 5), darkWoodMat);
  head.position.set(1.42, 0.16, 0);
  head.rotation.z = -0.5;
  group.add(head);

  // shields along both sides
  const shieldColors = [0xd9432e, 0xe4c14a];
  for (let i = -3; i <= 3; i++) {
    [1, -1].forEach((side) => {
      const shield = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 8),
        new THREE.MeshStandardMaterial({ color: shieldColors[(i + side + 5) % 2], flatShading: true, side: THREE.DoubleSide })
      );
      shield.position.set(i * 0.26, 0.08, 0.34 * side);
      shield.rotation.y = Math.PI / 2;
      group.add(shield);
    });
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6), darkWoodMat);
  mast.position.set(0, 0.85, 0);
  group.add(mast);

  // Sail: rotated so its face is perpendicular to the direction of travel
  // (spanning the beam, catching the wind) — not lying along the hull's length.
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.85), sailMat);
  sail.position.set(0, 0.95, 0);
  sail.rotation.y = (60 * Math.PI) / 180;
  group.add(sail);

  // pennant at the masthead, toward the stern — flutters in the animation loop
  const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.14), pennantMat);
  pennant.position.set(-0.16, 1.62, 0);
  group.add(pennant);

  // oars — grouped under a pivot per side so each can rock for the rowing stroke
  const oars = [];
  const oarLength = 0.85;
  [-0.55, 0, 0.55].forEach((x, idx) => {
    [1, -1].forEach((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.06, 0.32 * side);
      const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, oarLength, 5), oarMat);
      oar.rotation.x = Math.PI / 2; // align along Z, pointing out from the hull
      oar.position.z = (side * oarLength) / 2;
      pivot.add(oar);
      group.add(pivot);
      oars.push({ pivot, phase: idx * 0.7 + (side < 0 ? Math.PI : 0) });
    });
  });

  return { group, oars, pennant };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
