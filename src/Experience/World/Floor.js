import * as THREE from 'three';
import Experience from "../Experience.js";
import MeshReflectorMaterial from '../Utils/MeshReflectorMaterial.js';

export default class Floor {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera.instance;
    this.resources = this.experience.resources;
    this.speedDirection = 1;

    this.debug = this.experience.debug;
    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('environment');
    }
  
    this.setMesh();
  }

  setMesh() {
    
    // Загружаем текстуру ряби
    const noiseTexture = this.resources.items['floorFront'];
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
    noiseTexture.repeat.set(2, 2); 
    noiseTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); // Улучшение качества текстуры
    // noiseTexture.minFilter = THREE.LinearFilter;
    // noiseTexture.magFilter = THREE.LinearFilter;
    // noiseTexture.generateMipmaps = false;

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 1, 1));
    this.floor.rotation.x = - Math.PI * 0.5;
    this.floor.position.y = -1.7;

    this.scene.add(this.floor);
    this.floor.updateMatrixWorld(true);

    // Инициализируем MeshReflectorMaterial
    this.material = new MeshReflectorMaterial(this.renderer, this.camera, this.scene, this.floor, { 
      uTime: 10,
      speedFactor: 0,
      mixBlur: 10.0,              // Интенсивность размытия
      // mixStrength: 0.08,   
      mixStrength: 0.5,          // Сила смешивания отражения
      resolution: 1024,           // Разрешение текстуры отражения
      blur: [2056, 2056],           // Размытость по горизонтали и вертикали
      minDepthThreshold: 0.7,    // Минимальный порог глубины
      maxDepthThreshold: 1.1,      // Максимальный порог глубины
      depthScale: 1.0,             // Масштаб глубины
      depthToBlurRatioBias: 0.1,// Смещение соотношения глубины к размытиям
      mirror: 1,               // Зеркальность
      distortion: 0.5,             // Искажение
      mixContrast: 1.57,            // Контраст смешивания
      distortionMap: noiseTexture,       // Карта искажения (можно задать)
      reflectorOffset: 0,        // Смещение отражателя
      bufferSamples: 0,          // Количество буферных выборок
      planeNormal: new THREE.Vector3(0, 0, 1) // Нормаль плоскости
    });

    this.material.setValues({
      roughnessMap: this.resources.items['roughness'],
      normalMap: this.resources.items['normal'],
      normalScale: new THREE.Vector2(0.2, 0.2)
    })


    // Debug
    if (this.debug.active) {
      // Интенсивность размытия
      this.debugFolder.add(this.material.reflectorProps, 'mixBlur')
        .name('Mix Blur')
        .min(0)
        .max(2)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.mixBlur = value;
          this.material.needsUpdate = true; // Обновляем материал
      });

      // Сила смешивания отражения
      this.debugFolder.add(this.material.reflectorProps, 'mixStrength')
        .name('Mix Strength')
        .min(0)
        .max(10)
        .step(0.1)
        .onChange(value => {
          this.material.reflectorProps.mixStrength = value;
          this.material.needsUpdate = true;
      });

      // Минимальный порог глубины
      this.debugFolder.add(this.material.reflectorProps, 'minDepthThreshold')
        .name('minDepthThreshold')
        .min(0)
        .max(10)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.minDepthThreshold = value;
          this.material.needsUpdate = true;
      });

      // Максимальный порог глубины
      this.debugFolder.add(this.material.reflectorProps, 'maxDepthThreshold')
        .name('maxDepthThreshold')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.maxDepthThreshold = value;
          this.material.needsUpdate = true;
      });

      // Масштаб глубины
      this.debugFolder.add(this.material.reflectorProps, 'depthScale')
        .name('depthScale')
        .min(0)
        .max(10)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.depthScale = value;
          this.material.needsUpdate = true;
      });

      // Смещение соотношения глубины к размытиям
      this.debugFolder.add(this.material.reflectorProps, 'depthToBlurRatioBias')
        .name('depthToBlurRatioBias')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.depthToBlurRatioBias = value;
          this.material.needsUpdate = true;
      });

      // Зеркальность
      this.debugFolder.add(this.material.reflectorProps, 'mirror')
        .name('mirror')
        .min(0)
        .max(1)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.mirror = value;
          this.material.needsUpdate = true;
      });

      // Искажение
      this.debugFolder.add(this.material.reflectorProps, 'distortion')
        .name('distortion')
        .min(0)
        .max(10)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.distortion = value;
          this.material.needsUpdate = true;
      });

      // Контраст смешивания
      this.debugFolder.add(this.material.reflectorProps, 'mixContrast')
        .name('mixContrast')
        .min(0)
        .max(10)
        .step(0.01)
        .onChange(value => {
          this.material.reflectorProps.mixContrast = value;
          this.material.needsUpdate = true;
      });
    }

    this.floor.material = this.material;
    this.floor.material.needsUpdate = true;

  }


  update() {
    if (this.material && typeof this.material.update === 'function') {
      this.material.update(); // new: Обновляем материал отражений
    }

  this.material.reflectorProps.speedFactor += this.speedDirection * this.experience.time.delta * 0.001;

  if (this.material.reflectorProps.speedFactor <= 20.0) {
    this.material.reflectorProps.speedFactor = 20.0
    this.speedDirection = 1;

  } else if( this.material.reflectorProps.speedFactor >= 30.0) {
    this.material.reflectorProps.speedFactor = 30.0

    this.speedDirection = -1;
  }
  // this.material.reflectorProps.distortionMap.needsUpdate = true;

  }
}
