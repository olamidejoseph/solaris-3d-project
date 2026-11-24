import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import './style.css';

// Orbital periods are in Earth days. Distances and radii are intentionally
// compressed/exaggerated so the complete system can be explored on screen.
const PLANETS = [
  { name:'Mercury', subtitle:'The swiftest world', au:0.387, period:87.969, diameter:'4,879 km', day:'58.6 Earth days', radius:0.24, color:'#a99b8b', type:'TERRESTRIAL PLANET', description:'A small, cratered world with an ancient surface and extreme temperature swings.', e:0.206, inc:7.0, node:48, tilt:0.03, spin:58.6, phase:0.4, texture:'rock' },
  { name:'Venus', subtitle:'The veiled planet', au:0.723, period:224.701, diameter:'12,104 km', day:'243 Earth days', radius:0.42, color:'#d9ad72', type:'TERRESTRIAL PLANET', description:'A volcanic world wrapped in dense clouds, with a surface hot enough to melt lead.', e:0.007, inc:3.39, node:76, tilt:177.4, spin:-243, phase:2.2, texture:'venus' },
  { name:'Earth', subtitle:'Our pale blue dot', au:1, period:365.256, diameter:'12,742 km', day:'23.9 hours', radius:0.46, color:'#4e9bd4', type:'TERRESTRIAL PLANET', description:'Our home world, with liquid-water oceans, a life-supporting atmosphere and one natural moon.', e:0.017, inc:0, node:0, tilt:23.4, spin:1, phase:4.1, texture:'earth' },
  { name:'Mars', subtitle:'The red planet', au:1.524, period:686.98, diameter:'6,779 km', day:'24.6 hours', radius:0.34, color:'#d66c4c', type:'TERRESTRIAL PLANET', description:'A cold desert world with giant volcanoes, ancient river valleys and two tiny moons.', e:0.093, inc:1.85, node:49, tilt:25.2, spin:1.03, phase:1.1, texture:'mars' },
  { name:'Jupiter', subtitle:'King of the planets', au:5.203, period:4332.59, diameter:'139,820 km', day:'9.9 hours', radius:1.55, color:'#d6ad87', type:'GAS GIANT', description:'The largest planet, a vast gas giant with turbulent cloud bands and a centuries-old Great Red Spot.', e:0.049, inc:1.3, node:100, tilt:3.1, spin:0.41, phase:3.4, texture:'jupiter' },
  { name:'Saturn', subtitle:'The ringed wonder', au:9.537, period:10759.22, diameter:'116,460 km', day:'10.7 hours', radius:1.28, color:'#d8c08b', type:'GAS GIANT', description:'A gas giant surrounded by spectacular rings made mostly of countless pieces of ice and rock.', e:0.057, inc:2.49, node:113, tilt:26.7, spin:0.45, phase:5.0, texture:'saturn', rings:true },
  { name:'Uranus', subtitle:'The tilted ice giant', au:19.191, period:30688.5, diameter:'50,724 km', day:'17.2 hours', radius:0.83, color:'#8dd5d8', type:'ICE GIANT', description:'An ice giant with a blue-green atmosphere and an extreme axial tilt that makes it rotate almost on its side.', e:0.046, inc:0.77, node:74, tilt:97.8, spin:-0.72, phase:2.8, texture:'uranus', rings:true },
  { name:'Neptune', subtitle:'The distant blue world', au:30.07, period:60182, diameter:'49,244 km', day:'16.1 hours', radius:0.80, color:'#477be0', type:'ICE GIANT', description:'A dark, cold and windy world far beyond Uranus, with supersonic atmospheric winds.', e:0.010, inc:1.77, node:132, tilt:28.3, spin:0.67, phase:0.9, texture:'neptune' },
  { name:'Pluto', subtitle:'The distant dwarf planet', au:39.482, period:90560, diameter:'2,377 km', day:'6.4 Earth days', radius:0.22, color:'#c6a28b', type:'DWARF PLANET', description:'A small icy world in the Kuiper Belt, with mountains, glaciers and the famous heart-shaped region Tombaugh Regio.', e:0.249, inc:17.16, node:110, tilt:122.5, spin:-6.39, phase:5.7, texture:'pluto' }
];

const YEAR_SECONDS = 12; // At 1x, one simulated Earth year takes 12 real seconds.
const DISTANCE_SCALE = 5.0;
const AU_TO_SCENE = au => 5 + Math.sqrt(au) * 4.7;
const $ = id => document.getElementById(id);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050d);
scene.fog = new THREE.FogExp2(0x03050d, 0.00085);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 1200);
camera.position.set(0, 48, 76);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
$('scene').appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
$('scene').appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 8;
controls.maxDistance = 230;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 0, 0);

// Lighting: a bright point source at the Sun plus gentle ambient fill.
scene.add(new THREE.AmbientLight(0x7180a8, 0.34));
const sunLight = new THREE.PointLight(0xffd7a0, 2600, 500, 1.35);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Deterministic random helper for repeatable procedural textures and star positions.
function seeded(seed) {
  let x = seed >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

function makePlanetTexture(kind, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const rand = seeded(seed);
  const palettes = {
    rock:['#635c55','#a69a88','#c4b49d','#393b3d'],
    venus:['#805c37','#c99a5d','#e2c18a','#9d7445'],
    earth:['#0b3264','#176ba0','#277c4e','#6d9b50'],
    mars:['#6f2f20','#b55234','#d17a4d','#e0a477'],
    jupiter:['#8b5b3e','#d4ae8b','#ead1ad','#a96d4c'],
    saturn:['#9a805a','#d9c39a','#f0dfb7','#b79a70'],
    uranus:['#4b9ba9','#91d3d7','#b3e5e3','#70bac8'],
    neptune:['#183b9a','#2868c7','#4a8be4','#173b87'],
    pluto:['#755c50','#b99b83','#e0c4a7','#5e514b']
  };
  const p = palettes[kind] || palettes.rock;
  ctx.fillStyle = p[0]; ctx.fillRect(0,0,1024,512);

  if (['jupiter','saturn','uranus','neptune'].includes(kind)) {
    for (let y=0; y<512; y++) {
      const wave = Math.sin(y*0.045)*8 + Math.sin(y*0.12)*4;
      const band = Math.floor((y + wave) / (kind==='jupiter' ? 19 : 27)) % p.length;
      ctx.globalAlpha = 0.72 + rand()*0.25;
      ctx.fillStyle = p[band];
      ctx.fillRect(0,y,1024,1.5 + rand()*2.8);
    }
    ctx.globalAlpha = 1;
    if (kind === 'jupiter') {
      ctx.fillStyle = '#a94e36'; ctx.beginPath(); ctx.ellipse(730,315,75,27,-.12,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#e6b38a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(730,315,78,30,-.12,0,Math.PI*2); ctx.stroke();
    }
  } else {
    // Large soft mottled regions suggest continents, deserts and cratered terrain.
    for (let i=0; i<240; i++) {
      const x=rand()*1024, y=rand()*512, r=8+rand()*55;
      ctx.globalAlpha = 0.08 + rand()*0.20;
      ctx.fillStyle = p[Math.floor(rand()*p.length)];
      ctx.beginPath(); ctx.ellipse(x,y,r,r*(0.3+rand()*0.8),rand()*Math.PI,0,Math.PI*2); ctx.fill();
    }
    if (kind==='earth') {
      for (let i=0; i<75; i++) {
        const x=rand()*1024, y=rand()*512, r=7+rand()*38;
        ctx.globalAlpha=.78; ctx.fillStyle = rand()>.5 ? '#4c9658' : '#b0a46a';
        ctx.beginPath(); ctx.ellipse(x,y,r,r*(.35+rand()*.8),rand()*Math.PI,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=.65; ctx.fillStyle='#d7e9f2';
      ctx.fillRect(0,0,1024,18); ctx.fillRect(0,494,1024,18);
    }
    if (kind==='mars' || kind==='pluto' || kind==='rock') {
      for (let i=0; i<170; i++) {
        const x=rand()*1024, y=rand()*512, r=1+rand()*9;
        ctx.globalAlpha=.22; ctx.strokeStyle='#302b29'; ctx.lineWidth=1+rand()*2;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
      }
    }
  }
  // Fine grain gives the procedural surfaces a less flat, painted appearance.
  for (let i=0; i<24000; i++) {
    ctx.globalAlpha = rand()*.10;
    ctx.fillStyle = rand()>.5 ? '#fff' : '#000';
    const x=rand()*1024, y=rand()*512;
    ctx.fillRect(x,y,1+rand()*2,1+rand()*2);
  }
  ctx.globalAlpha=1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makeGlowTexture() {
  const c=document.createElement('canvas'); c.width=c.height=256;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(128,128,4,128,128,128);
  g.addColorStop(0,'rgba(255,245,205,1)');
  g.addColorStop(.12,'rgba(255,190,100,.7)');
  g.addColorStop(.35,'rgba(255,125,45,.24)');
  g.addColorStop(1,'rgba(255,90,20,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(c);
}

// Sun surface, glow and corona layers.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.15, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0xffd078 })
);
sun.name = 'Sun';
scene.add(sun);
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xffb45c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
sunGlow.scale.set(22,22,1); scene.add(sunGlow);
const corona = new THREE.Mesh(new THREE.SphereGeometry(3.45, 48, 48), new THREE.MeshBasicMaterial({ color:0xffa344, transparent:true, opacity:.12, side:THREE.BackSide }));
scene.add(corona);

// Starfield: layered point clouds at different distances.
function addStars(count, radius, size, opacity, seed) {
  const rand=seeded(seed), positions=[];
  for(let i=0;i<count;i++){
    const u=rand()*2-1, theta=rand()*Math.PI*2;
    const r=radius*(.72+rand()*.28), s=Math.sqrt(1-u*u);
    positions.push(r*s*Math.cos(theta), r*u, r*s*Math.sin(theta));
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({ color:0xcbd8ff, size, sizeAttenuation:true, transparent:true, opacity, depthWrite:false });
  scene.add(new THREE.Points(geo,mat));
}
addStars(5000,420,.48,.82,42);
addStars(1300,300,.9,.55,77);
addStars(250,180,1.5,.7,108);

// A few distant soft nebula-like clouds, deliberately subtle.
function nebula(color, x,y,z, scale) {
  const material=new THREE.SpriteMaterial({ map:makeGlowTexture(), color, transparent:true, opacity:.10, depthWrite:false, blending:THREE.AdditiveBlending });
  const sprite=new THREE.Sprite(material); sprite.position.set(x,y,z); sprite.scale.set(scale,scale*.55,1); scene.add(sprite);
}
nebula(0x5365c9,-90,42,-130,100);
nebula(0x7b3c91,120,-30,-170,130);
nebula(0x2e8d9d,35,80,160,90);

const planetObjects = [];
const clickable = [];
const labelObjects = [];
const orbitLines = [];

function makeOrbit(data, index) {
  const a=AU_TO_SCENE(data.au);
  const e=data.e;
  const points=[];
  for(let i=0;i<=256;i++){
    const E=(i/256)*Math.PI*2;
    const x=a*(Math.cos(E)-e);
    const z=a*Math.sqrt(1-e*e)*Math.sin(E);
    points.push(new THREE.Vector3(x,0,z));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(points);
  const mat=new THREE.LineBasicMaterial({ color: index===2 ? 0x6b91e9 : 0x8290b5, transparent:true, opacity:index===2?.38:.19 });
  const line=new THREE.LineLoop(geo,mat);
  line.rotation.y=THREE.MathUtils.degToRad(data.node);
  line.rotation.x=THREE.MathUtils.degToRad(data.inc);
  scene.add(line); orbitLines.push(line);
}

function solveKepler(M,e) {
  let E=M;
  for(let i=0;i<7;i++) E -= (E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  return E;
}

PLANETS.forEach((data,index)=>{
  makeOrbit(data,index);
  const orbitGroup=new THREE.Group();
  orbitGroup.rotation.y=THREE.MathUtils.degToRad(data.node);
  orbitGroup.rotation.x=THREE.MathUtils.degToRad(data.inc);
  scene.add(orbitGroup);

  const tiltGroup=new THREE.Group();
  orbitGroup.add(tiltGroup);
  const axialTilt=new THREE.Group();
  axialTilt.rotation.z=THREE.MathUtils.degToRad(data.tilt);
  tiltGroup.add(axialTilt);

  const material=new THREE.MeshStandardMaterial({
    map:makePlanetTexture(data.texture, 100+index*13),
    roughness:.92, metalness:.01
  });
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(data.radius,48,48),material);
  mesh.name=data.name;
  axialTilt.add(mesh);
  clickable.push(mesh);

  // Saturn's broad icy rings and Uranus' narrow, dark rings.
  if(data.rings){
    const ringGeo=new THREE.RingGeometry(data.radius*1.35,data.radius*(data.name==='Saturn'?2.25:1.75),96);
    const ringMat=new THREE.MeshStandardMaterial({
      color:data.name==='Saturn'?0xcdbb91:0x78969a,
      side:THREE.DoubleSide, transparent:true, opacity:data.name==='Saturn'?.78:.38,
      roughness:1, metalness:0
    });
    const ring=new THREE.Mesh(ringGeo,ringMat);
    ring.rotation.x=Math.PI/2;
    axialTilt.add(ring);
  }

  const labelEl=document.createElement('div');
  labelEl.className='planet-label';
  labelEl.textContent=data.name.toUpperCase();
  const label=new CSS2DObject(labelEl);
  label.position.set(0,data.radius+0.45,0);
  tiltGroup.add(label);
  labelObjects.push(labelEl);

  let moon=null, moonOrbit=null;
  if(data.name==='Earth'){
    moonOrbit=new THREE.Group();
    tiltGroup.add(moonOrbit);
    const moonPath=new THREE.Mesh(
      new THREE.TorusGeometry(1.05,.006,4,96),
      new THREE.MeshBasicMaterial({color:0x9eabc5,transparent:true,opacity:.34})
    );
    moonPath.rotation.x=Math.PI/2;
    moonOrbit.add(moonPath);
    moon=new THREE.Mesh(
      new THREE.SphereGeometry(.13,24,24),
      new THREE.MeshStandardMaterial({map:makePlanetTexture('rock',777),roughness:1})
    );
    moon.position.set(1.05,0,0);
    moonOrbit.add(moon);
  }

  planetObjects.push({data,index,orbitGroup,tiltGroup,axialTilt,mesh,moonOrbit,moon,phase:data.phase});
});

function setPlanetPosition(obj, elapsedSeconds) {
  const {data}=obj;
  const years=elapsedSeconds/YEAR_SECONDS;
  const periodYears=data.period/365.256;
  const meanMotion=(Math.PI*2)/periodYears;
  const M=(obj.phase + years*meanMotion)%(Math.PI*2);
  const E=solveKepler(M,data.e);
  const a=AU_TO_SCENE(data.au);
  const x=a*(Math.cos(E)-data.e);
  const z=a*Math.sqrt(1-data.e*data.e)*Math.sin(E);
  obj.tiltGroup.position.set(x,0,z);
  // Axial spin is intentionally accelerated for visible motion.
  const spinSeconds=Math.abs(data.spin)*YEAR_SECONDS/365.256;
  const spinDirection=data.spin<0?-1:1;
  obj.mesh.rotation.y += (elapsedSeconds===0?0:0); // spin is applied in the animation loop below
  obj.spinRate=spinDirection*(Math.PI*2)/(Math.max(spinSeconds,0.02));
}

let elapsed=0;
let speed=1;
let running=true;
let last=performance.now();
let selectedIndex=2;

function selectPlanet(index, moveCamera=true) {
  const data=PLANETS[index];
  selectedIndex=index;
  const obj=planetObjects[index];
  $('planet-name').textContent=data.name;
  $('planet-subtitle').textContent=data.subtitle;
  $('fact-distance').textContent=`${data.au.toFixed(data.au<10?3:2)} AU`;
  $('fact-period').textContent=data.period<365?`${data.period.toFixed(1)} days`:`${(data.period/365.256).toFixed(data.period>10000?1:2)} years`;
  $('fact-diameter').textContent=data.diameter;
  $('fact-day').textContent=data.day;
  $('planet-description').textContent=data.description;
  $('planet-type').textContent=data.type;
  $('planet-dot').style.background=data.color;
  $('planet-card').classList.add('visible');
  document.querySelectorAll('.rail-planet').forEach((el,i)=>el.classList.toggle('selected',i===index));
  if(moveCamera){
    const worldPos=new THREE.Vector3();
    obj.mesh.getWorldPosition(worldPos);
    const offset=new THREE.Vector3(0,Math.max(3,data.radius*3.5),Math.max(7,data.radius*7));
    controls.target.copy(worldPos);
    camera.position.copy(worldPos).add(offset);
    controls.update();
  }
}

function buildPlanetRail() {
  const rail=$('planet-rail');
  PLANETS.forEach((p,i)=>{
    const button=document.createElement('button');
    button.className='rail-planet'+(i===2?' selected':'');
    button.innerHTML=`<span class="rail-swatch" style="background:${p.color}"></span><span>${p.name}</span>`;
    button.title=`Focus ${p.name}`;
    button.addEventListener('click',()=>selectPlanet(i));
    rail.appendChild(button);
  });
}
buildPlanetRail();
selectPlanet(2,false);

$('pause-button').addEventListener('click',()=>{
  running=!running;
  $('pause-button').textContent=running?'Ⅱ':'▶';
  $('pause-button').title=running?'Pause simulation':'Resume simulation';
  $('state-text').textContent=running?'RUNNING':'PAUSED';
  $('state-dot').classList.toggle('paused',!running);
});
$('speed-presets').addEventListener('click',e=>{
  const button=e.target.closest('[data-speed]');
  if(!button)return;
  speed=Number(button.dataset.speed);
  $('speed-value').textContent=`${speed}×`;
  document.querySelectorAll('.speed-button').forEach(b=>b.classList.toggle('active',b===button));
});
$('orbits-toggle').addEventListener('change',e=>orbitLines.forEach(line=>line.visible=e.target.checked));
$('labels-toggle').addEventListener('change',e=>labelObjects.forEach(label=>label.style.display=e.target.checked?'':'none'));
$('close-card').addEventListener('click',()=>$('planet-card').classList.remove('visible'));
$('reset-view').addEventListener('click',()=>{
  controls.target.set(0,0,0);
  camera.position.set(0,48,76);
  controls.update();
  $('planet-card').classList.remove('visible');
});

// Select planets by clicking their 3D meshes.
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(clickable,false);
  if(hits.length){
    const index=clickable.indexOf(hits[0].object);
    if(index>=0)selectPlanet(index);
  }
});

function updateClock() {
  const totalDays=Math.floor((elapsed/YEAR_SECONDS)*365.256);
  const year=Math.floor(totalDays/365.256)+1;
  const day=(totalDays%365.256)+1;
  $('sim-date').textContent=`DAY ${String(Math.floor(day)).padStart(3,'0')} · YEAR ${String(year).padStart(4,'0')}`;
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.05);
  last=now;
  if(running){
    elapsed+=dt*speed;
    planetObjects.forEach(obj=>{
      setPlanetPosition(obj,elapsed);
      obj.mesh.rotation.y += obj.spinRate*dt*speed*.025;
      if(obj.moonOrbit)obj.moonOrbit.rotation.y+=dt*speed*0.9;
    });
    sun.rotation.y+=dt*.035;
    corona.rotation.y-=dt*.012;
    updateClock();
  }
  controls.update();
  renderer.render(scene,camera);
  labelRenderer.render(scene,camera);
  $('loading-screen').classList.add('done');
}
requestAnimationFrame(animate);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  labelRenderer.setSize(innerWidth,innerHeight);
});
