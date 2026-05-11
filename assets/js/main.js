import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

const timer = new THREE.Timer();
timer.connect(document);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccee);
scene.fog = new THREE.Fog(0x88ccee, 0, 50);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);
camera.rotation.order = "YXZ";

const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const container = document.getElementById("container");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.top = "0px";
container.appendChild(stats.domElement);

const GRAVITY = 30;
const NUM_PROJECTILES = 100;
const COLLIDER_RADIUS = 0.2; // Radio base de colisión para las físicas
const STEPS_PER_FRAME = 5;

// Geometrías predefinidas
const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
// Una pirámide de base cuadrada es un cono con 4 segmentos radiales
const pyramidGeometry = new THREE.ConeGeometry(0.25, 0.4, 4); 

const projectiles = [];
let projectileIdx = 0;

// Inicializamos el "pool" de proyectiles
for (let i = 0; i < NUM_PROJECTILES; i++) {
    // Instanciamos un material único por proyectil para poder cambiar su color individualmente
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(cubeGeometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    projectiles.push({
        mesh: mesh,
        collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), COLLIDER_RADIUS),
        velocity: new THREE.Vector3(),
    });
}

const worldOctree = new Octree();

const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35,
);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener("keydown", (event) => {
    keyStates[event.code] = true;
});

document.addEventListener("keyup", (event) => {
    keyStates[event.code] = false;
});

container.addEventListener("mousedown", () => {
    document.body.requestPointerLock();
    mouseTime = performance.now();
});

// Evento modificado para detectar clics izquierdos y derechos
document.addEventListener("mouseup", (event) => {
    if (document.pointerLockElement !== null) {
        if (event.button === 0) {
            // Clic izquierdo
            throwProjectile('cube');
        } else if (event.button === 2) {
            // Clic derecho
            throwProjectile('pyramid');
        }
    }
});

// Evitar que aparezca el menú contextual del navegador al dar clic derecho
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

document.body.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
    }
});

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Lógica de lanzamiento actualizada con escala y colores aleatorios
function throwProjectile(type) {
    const projectile = projectiles[projectileIdx];

    // Cambiar geometría según el clic
    projectile.mesh.geometry = type === 'cube' ? cubeGeometry : pyramidGeometry;
    
    // Asignar color aleatorio
    projectile.mesh.material.color.setHex(Math.random() * 0xffffff);

    // Generar un factor de escala aleatorio (entre 0.5x y 1.5x)
    const randomScale = 0.5 + Math.random(); 
    
    // Aplicar la escala al modelo 3D visual
    projectile.mesh.scale.set(randomScale, randomScale, randomScale);

    // Escalar también el radio de la esfera delimitadora (bounding sphere) 
    // para que las físicas de rebote y colisión sigan siendo precisas.
    projectile.collider.radius = COLLIDER_RADIUS * randomScale;

    camera.getWorldDirection(playerDirection);

    projectile.collider.center
        .copy(playerCollider.end)
        .addScaledVector(playerDirection, playerCollider.radius * 1.5);

    const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

    projectile.velocity.copy(playerDirection).multiplyScalar(impulse);
    projectile.velocity.addScaledVector(playerVelocity, 2);

    // Avanzamos al siguiente proyectil en el pool (y volvemos a 0 si llegamos al final)
    projectileIdx = (projectileIdx + 1) % projectiles.length;
}

function playerCollisions() {
    const result = worldOctree.capsuleIntersect(playerCollider);
    playerOnFloor = false;

    if (result) {
        playerOnFloor = result.normal.y >= 0.15;
        if (!playerOnFloor) {
            playerVelocity.addScaledVector(
                result.normal,
                -result.normal.dot(playerVelocity),
            );
        }
        if (result.depth >= 1e-10) {
            playerCollider.translate(result.normal.multiplyScalar(result.depth));
        }
    }
}

function updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!playerOnFloor) {
        playerVelocity.y -= GRAVITY * deltaTime;
        damping *= 0.1;
    }

    playerVelocity.addScaledVector(playerVelocity, damping);
    const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
    playerCollider.translate(deltaPosition);
    playerCollisions();
    camera.position.copy(playerCollider.end);
}

function playerProjectileCollision(projectile) {
    const center = vector1
        .addVectors(playerCollider.start, playerCollider.end)
        .multiplyScalar(0.5);

    const sphere_center = projectile.collider.center;
    const r = playerCollider.radius + projectile.collider.radius;
    const r2 = r * r;

    for (const point of [playerCollider.start, playerCollider.end, center]) {
        const d2 = point.distanceToSquared(sphere_center);

        if (d2 < r2) {
            const normal = vector1.subVectors(point, sphere_center).normalize();
            const v1 = vector2
                .copy(normal)
                .multiplyScalar(normal.dot(playerVelocity));
            const v2 = vector3
                .copy(normal)
                .multiplyScalar(normal.dot(projectile.velocity));

            playerVelocity.add(v2).sub(v1);
            projectile.velocity.add(v1).sub(v2);

            const d = (r - Math.sqrt(d2)) / 2;
            sphere_center.addScaledVector(normal, -d);
        }
    }
}

function projectilesCollisions() {
    for (let i = 0, length = projectiles.length; i < length; i++) {
        const s1 = projectiles[i];

        for (let j = i + 1; j < length; j++) {
            const s2 = projectiles[j];

            const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;

            if (d2 < r2) {
                const normal = vector1
                    .subVectors(s1.collider.center, s2.collider.center)
                    .normalize();
                const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
                const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

                s1.velocity.add(v2).sub(v1);
                s2.velocity.add(v1).sub(v2);

                const d = (r - Math.sqrt(d2)) / 2;

                s1.collider.center.addScaledVector(normal, d);
                s2.collider.center.addScaledVector(normal, -d);
            }
        }
    }
}

function updateProjectiles(deltaTime) {
    projectiles.forEach((projectile) => {
        projectile.collider.center.addScaledVector(projectile.velocity, deltaTime);

        const result = worldOctree.sphereIntersect(projectile.collider);

        if (result) {
            projectile.velocity.addScaledVector(
                result.normal,
                -result.normal.dot(projectile.velocity) * 1.5,
            );
            projectile.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
            projectile.velocity.y -= GRAVITY * deltaTime;
        }

        const damping = Math.exp(-1.5 * deltaTime) - 1;
        projectile.velocity.addScaledVector(projectile.velocity, damping);

        playerProjectileCollision(projectile);
    });

    projectilesCollisions();

    for (const projectile of projectiles) {
        projectile.mesh.position.copy(projectile.collider.center);
        
        // Rotar ligeramente los objetos mientras vuelan para mayor dinamismo
        if(projectile.velocity.lengthSq() > 0.1) {
             projectile.mesh.rotation.x += deltaTime * projectile.velocity.y;
             projectile.mesh.rotation.y += deltaTime * projectile.velocity.x;
        }
    }
}

function getForwardVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    return playerDirection;
}

function getSideVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross(camera.up);
    return playerDirection;
}

function controls(deltaTime) {
    const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

    if (keyStates["KeyW"]) {
        playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
    }
    if (keyStates["KeyS"]) {
        playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
    }
    if (keyStates["KeyA"]) {
        playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
    }
    if (keyStates["KeyD"]) {
        playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
    }
    if (playerOnFloor) {
        if (keyStates["Space"]) {
            playerVelocity.y = 15;
        }
    }
}

const loader = new GLTFLoader().setPath("./assets/models/gltf/");

loader.load("collision-world.glb", (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material.map) {
                child.material.map.anisotropy = 4;
            }
        }
    });

    const helper = new OctreeHelper(worldOctree);
    helper.visible = false;
    scene.add(helper);

    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, "debug").onChange(function (value) {
        helper.visible = value;
    });
});

function teleportPlayerIfOob() {
    if (camera.position.y <= -25) {
        playerCollider.start.set(0, 0.35, 0);
        playerCollider.end.set(0, 1, 0);
        playerCollider.radius = 0.35;
        camera.position.copy(playerCollider.end);
        camera.rotation.set(0, 0, 0);
    }
}

function animate() {
    timer.update();
    const deltaTime = Math.min(0.05, timer.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        controls(deltaTime);
        updatePlayer(deltaTime);
        updateProjectiles(deltaTime);
        teleportPlayerIfOob();
    }

    renderer.render(scene, camera);
    stats.update();
}