// GeometryOnPath.js
import * as THREE from 'three';
import Experience from "../Experience.js";
import PathLine from './PathLine.js';
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier.js';
import gsap from 'gsap';
import videoFragmentShader from '../../../static/textures/shaders/video/videoFragmentShader.glsl';
import videoVertexShader from '../../../static/textures/shaders/video/videoVertexShader.glsl';

import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class GeometryOnPath {
  constructor(color, curve, options = {}) {
    this.experience = new Experience();
    this.resources = this.experience.resources;
    this.camera = this.experience.camera.instance;
    this.initialCameraPositionX = this.camera.position.x;
    this.raycaster = this.experience.raycaster;
    this.scene = this.experience.scene;
    this.curve = curve || new PathLine().curve;
    this.currentHoveredIndex = null; // Добавлено

    // Mesh settings
    this.color = options.color || 0xE70000;
    this.width = options.width || 1;
    this.height = options.height || 2;
    this.depth = options.depth || 0.5;
    this.segments = options.segments || 200;

    // Setup
    this.videoTexture = this.resources.items[`video-1`];
    this.noiseTexture = this.resources.items['floorFront'];

    // Texture wrapping modes
    this.videoTexture.wrapS = THREE.MirroredRepeatWrapping;
    this.videoTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.videoTexture.needsUpdate = true;

    // Speed along curve
    this.defaultSpeed = options.speed || 0.00015;
    this.speed = this.defaultSpeed;

    // Инициализация общей скорости в Experience
    this.experience.shared.speed = this.speed;

    // Number of meshes
    this.meshCount = options.meshCount || 5;

    // Arrays to store meshes and their Flow
    this.flows = [];

    this.touch = {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    };

    this.onWheel();
    this.setGeometry();
    this.setMaterial();
    this.createMeshes();
  }

  setGeometry() {
    this.geometry = new THREE.BoxGeometry(
      this.width,
      this.height,
      this.depth,
      this.segments,
    );
    this.updateUVs();
    this.geometry.translate(0.5, 0, 0);
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
  }

  updateUVs() {
    const positionAttribute = this.geometry.attributes.position;
    const normalAttribute = this.geometry.attributes.normal;
    const uvAttribute = this.geometry.attributes.uv;
    const vertexCount = positionAttribute.count;

    for (let i = 0; i < vertexCount; i++) {
      const nz = normalAttribute.getZ(i);
      if (Math.abs(nz - 1.0) < 0.0001) {
        continue;
      } else {
        uvAttribute.setXY(i, 0, 0);
      }
    }

    uvAttribute.needsUpdate = true;
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.videoTexture },
        uColor: { value: new THREE.Color(this.color) },
        uBorderVertical: { value: 0.01 },
        uBorderHorizontal: { value: 0.02 },
        uParallaxOffset: { value: 0.1 },
        uNoiseTexture: { value: this.noiseTexture },
        uDispersion: { value: 0.003 },
        uDistortion: { value: 0.01 },
        uNoiseStrength: { value: 0.1 },
        uTime: { value: 0 },
        uStripeFrequency: { value: 500.0 },
        uHoverUv: { value: new THREE.Vector2(0.5, 0.5) },
        uStartTime: { value: -1.0 },
        uEffectDuration: { value: 1.0 },
        uRingCount: { value: 1.0 },
        uDivisor: { value: 0.5 },
        uWaveSpeed: { value: 1.0 },
        uEffectStrength: { value: 0.9 },
        uCameraPosition: { value: new THREE.Vector3() },
        uOpacity: { value: 1.0 },

        uCameraPosition: { value: new THREE.Vector3() },
        uFogColor: { value: new THREE.Color(0x000000) }, // Цвет тумана
        uFogNear: { value: 18.0 }, // Начало тумана
        uFogFar: { value: 21.0 }, // Конец тумана
      },
      vertexShader: videoVertexShader,
      fragmentShader: videoFragmentShader,
      side: THREE.DoubleSide,
      transparent: false

    });
  }

  createMeshes() {
    if (!this.material) {
      console.error('Base material not defined.');
      return;
    }

    for (let i = 0; i < this.meshCount; i++) {
      const material = this.material.clone();
      // Обновляем индекс видео-текстуры
      this.videoTexture = this.resources.items[`video-${i + 1}`];
      if (!this.videoTexture) {
        console.warn(`Видео текстура video-${i + 1} не найдена.`);
        continue;
      }
      this.videoTexture.wrapS = THREE.MirroredRepeatWrapping;
      this.videoTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.videoTexture.needsUpdate = true;
      material.uniforms.uTexture.value = this.videoTexture;
      material.uniforms.uParallaxOffset.value = 0.1;

      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.name = `mesh_${i}`;

      const flow = new Flow(mesh);
      flow.updateCurve(0, this.curve);
      const initialOffset = (i / this.meshCount) % 1;
      flow.moveAlongCurve(initialOffset);
      flow.object3D.updateMatrixWorld(true);
      flow.object3D.updateMatrix();
      flow.object3D.geometry.computeBoundingBox();
      flow.object3D.geometry.computeBoundingSphere();

      // Создаем BVH для геометрии
      flow.object3D.geometry.boundsTree = new MeshBVH(flow.object3D.geometry);

      flow.object3D.userData.index = i;
      this.scene.add(flow.object3D);

      this.flows.push(flow);
    }
  }

  moveAlongCurve() {
    this.flows.forEach((flow) => {
      flow.moveAlongCurve(this.speed);
      if (flow.amount > 1) {
        flow.amount -= 1;
      } else if (flow.amount < 0) {
        flow.amount += 1;
      }
      flow.object3D.updateMatrixWorld(true);
    });
    // Обновляем общую скорость
    this.experience.shared.speed = this.speed;
  }

  onWheel() {
    window.addEventListener('wheel', (event) => {
      const delta = event.deltaY;

      const cameraMoveAmount = 0.5; // Вы можете настроить это значение по своему усмотрению

      // Вычисляем новую позицию камеры по оси Z, приближая камеру
      const newCameraX = this.camera.position.x - cameraMoveAmount;

      // Анимируем позицию камеры к новой позиции, затем возвращаем обратно
      gsap.to(this.camera.position, {
        x: newCameraX,
        duration: 0.7,
        ease: "power.out",
        onComplete: () => {
          gsap.to(this.camera.position, {
            x: this.initialCameraPositionX,
            duration: 1,
            ease: "power.out"
          });
        }
      });

      if (delta > 0) {
        gsap.to(this, {
          speed: 0.002,
          duration: 0.7,
          ease: "power.out",
          onUpdate: () => {
            this.speed = this.speed;
            this.experience.shared.speed = this.speed;
          },
          onComplete: () => {
            gsap.to(this, {
              speed: this.defaultSpeed,
              duration: 1,
              ease: "power.out",
              onUpdate: () => {
                this.experience.shared.speed = this.speed;
              }
            });
          }
        })
      } else if (delta < 0) {
        gsap.to(this, {
          speed: -0.002,
          duration: 0.7,
          ease: "power.out",
          onUpdate: () => {
            this.experience.shared.speed = this.speed;
          },
          onComplete: () => {
            gsap.to(this, {
              speed: this.defaultSpeed,
              duration: 1,
              ease: "power.out",
              onUpdate: () => {
                this.experience.shared.speed = this.speed;
              }
            });
          }
        });
      }
    });
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.touch.startX = event.touches[0].clientX;
      this.touch.startY = event.touches[0].clientY;
    }
  }

  onTouchMove(event) {
    if (event.touches.length === 1) {
      this.touch.endX = event.touches[0].clientX;
      this.touch.endY = event.touches[0].clientY;
    }
  }

  onTouchEnd(event) {
    const deltaX = this.touch.endX - this.touch.startX;
    const deltaY = this.touch.endY - this.touch.startY;

    // Порог для определения свайпа (в пикселях)
    const swipeThreshold = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        this.handleSwipeRight();
      } else {
        this.handleSwipeLeft();
      }
    }
    // Сброс координат касания
    this.touch.startX = 0;
    this.touch.startY = 0;
    this.touch.endX = 0;
    this.touch.endY = 0;
  }

  handleSwipeLeft() {
    this.speedUp();
  }

  handleSwipeRight() {
    this.speedDown();
  }

  speedUp() {
    const cameraMoveAmount = 0.5;
    const newCameraX = this.camera.position.x - cameraMoveAmount;

    gsap.to(this.camera.position, {
      x: newCameraX,
      duration: 0.7,
      ease: "power.out",
      onComplete: () => {
        gsap.to(this.camera.position, {
          x: this.initialCameraPositionX,
          duration: 1,
          ease: "power.out"
        });
      }
    });

    gsap.to(this, {
      speed: 0.002,
      duration: 0.7,
      ease: "power.out",
      onUpdate: () => {
        this.experience.shared.speed = this.speed;
      },
      onComplete: () => {
        gsap.to(this, {
          speed: this.defaultSpeed,
          duration: 1,
          ease: "power.out",
          onUpdate: () => {
            this.experience.shared.speed = this.speed;
          }
        });
      }
    });
  }

  speedDown() {
    const cameraMoveAmount = 0.5;
    const newCameraX = this.camera.position.x - cameraMoveAmount;

    gsap.to(this.camera.position, {
      x: newCameraX,
      duration: 0.7,
      ease: "power.out",
      onComplete: () => {
        gsap.to(this.camera.position, {
          x: this.initialCameraPositionX,
          duration: 1,
          ease: "power.out"
        });
      }
    });

    gsap.to(this, {
      speed: -0.002,
      duration: 0.7,
      ease: "power.out",
      onUpdate: () => {
        this.experience.shared.speed = this.speed;
      },
      onComplete: () => {
        gsap.to(this, {
          speed: this.defaultSpeed,
          duration: 1,
          ease: "power.out",
          onUpdate: () => {
            this.experience.shared.speed = this.speed;
          }
        });
      }
    });
  }

  handleMeshIntersect(index) {
    // Если наведён уже текущий меш, ничего не делаем
    if (this.currentHoveredIndex === index) return;
  
    // Сброс наведения предыдущего меша, если он есть
    if (this.currentHoveredIndex !== null) {
      const prevMesh = this.flows[this.currentHoveredIndex]?.object3D;
      if (prevMesh) {
        prevMesh.userData.isHovering = false;
        const prevMaterial = prevMesh.material;
        // Здесь можно добавить логику сброса эффектов, например:
        prevMaterial.uniforms.uHoverUv.value.set(0.5, 0.5);
        // Дополнительные сбросы по необходимости
      }
    }
  
    // Установка наведения на новый меш
    const mesh = this.flows[index]?.object3D;
    if (mesh) {
      mesh.userData.isHovering = true;
      const material = mesh.material;
  
      // Запускаем эффект волн, устанавливая uStartTime в текущий момент времени в секундах
      material.uniforms.uStartTime.value = this.experience.time.elapsed / 1000;
  
      // Устанавливаем uHoverUv в центр меша, учитывая uParallaxOffset
      const centerUv = new THREE.Vector2(0.5 + material.uniforms.uParallaxOffset.value, 0.5);
      material.uniforms.uHoverUv.value.copy(centerUv);
  
      // Обновляем текущий наведённый индекс
      this.currentHoveredIndex = index;
    }
  }

  getCurrentHoveredIndex() {
    return this.currentHoveredIndex;
  }

  update() {
    // Обновляем движение вдоль кривой
    this.moveAlongCurve();

    // Обновляем материалы и другие параметры
    this.flows.forEach((flow) => {
      const mesh = flow.object3D;
      // Обновляем материал
      const material = mesh.material;
      material.uniforms.uParallaxOffset.value += this.speed;
      material.uniforms.uParallaxOffset.value = THREE.MathUtils.euclideanModulo(material.uniforms.uParallaxOffset.value, 1.0);
      material.uniforms.uTime.value = this.experience.time.elapsed / 1000;
      material.uniforms.uCameraPosition.value.copy(this.experience.camera.instance.position);
      mesh.updateMatrixWorld();
    });
  }
}
