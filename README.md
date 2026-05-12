## 🎮 FPS Three.js - Laboratorio de Colisiones 3D

Este proyecto es un entorno interactivo en primera persona desarrollado con la biblioteca **Three.js**. Implementa un sistema avanzado de físicas y colisiones utilizando `Octree` y `Capsule`, permitiendo la navegación fluida por un escenario tridimensional y la interacción dinámica mediante proyectiles con propiedades aleatorias.

---

## 🚀 Características Principales

- **Sistema FPS Completo:** Cámara en primera persona con bloqueo de puntero (*Pointer Lock*), saltos y movimiento inercial.
- **Motor de Colisiones Dinámico:** Uso de `Octree` para el entorno estático y `Capsule` para el jugador, garantizando colisiones precisas y eficientes.
- **Proyectiles Procedurales:** - **Click Izquierdo:** Lanza cubos.
  - **Click Derecho:** Lanza pirámides.
  - **Variación:** Cada proyectil tiene un color hexadecimal y un tamaño (escala) generado de forma aleatoria al momento del lanzamiento.
- **Física de Rebote:** Los objetos interactúan con el entorno y entre sí, conservando momento y rebotando según las normales del terreno.

---

## 🛠️ Tecnologías Utilizadas

El proyecto prioriza el uso de estándares modernos y renderizado de alto rendimiento.

![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)

### 📊 Porcentaje de Uso
* **JavaScript (Lógica de Juego y Three.js):** 85%
* **HTML5/CSS3 (Interfaz y Estructura):** 15%

---

## 👨‍💻 Información del Desarrollador

* **Nombre:** Miguel Angel Cano Alejandro
* **Universidad:** Instituto Tecnológico de Pachuca
* **Carrera:** Ingeniería en Sistemas Computacionales
* **Semestre:** 6to Semestre
* **Correo Electrónico:** mcanoalejandro@gmail.com
* **Teléfono:** +52 772 148 6990

---

## 📂 Estructura del Proyecto

Basada en una organización modular para facilitar el mantenimiento y la escalabilidad:

```text
📦 THREEJS-3D-GAME
 ┣ 📂 assets
 ┃ ┣ 📂 build
 ┃ ┃ ┣ 📜 three.core.js
 ┃ ┃ ┗ 📜 three.module.js
 ┃ ┣ 📂 css
 ┃ ┃ ┗ 📜 style.css
 ┃ ┣ 📂 img
 ┃ ┃ ┗ 🖼️ favicon.png
 ┃ ┣ 📂 js
 ┃ ┃ ┗ 📜 main.js
 ┃ ┣ 📂 jsm
 ┃ ┃ ┣ 📂 helpers
 ┃ ┃ ┃ ┗ 📜 OctreeHelper.js
 ┃ ┃ ┣ 📂 libs
 ┃ ┃ ┃ ┣ 📜 lil-gui.module.min.js
 ┃ ┃ ┃ ┗ 📜 stats.module.js
 ┃ ┃ ┣ 📂 loaders
 ┃ ┃ ┃ ┗ 📜 GLTFLoader.js
 ┃ ┃ ┣ 📂 math
 ┃ ┃ ┃ ┣ 📜 Capsule.js
 ┃ ┃ ┃ ┗ 📜 Octree.js
 ┃ ┃ ┗ 📂 utils
 ┃ ┃   ┣ 📜 BufferGeometryUtils.js
 ┃ ┃   ┗ 📜 SkeletonUtils.js
 ┃ ┗ 📂 models
 ┃   ┗ 📂 gltf
 ┃     ┗ 📦 collision-world.glb
 ┗ 📜 index.html