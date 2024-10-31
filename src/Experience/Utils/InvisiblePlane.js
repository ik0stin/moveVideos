// InvisiblePlane.js
import * as THREE from 'three';
import Experience from "../Experience.js";

export default class InvisiblePlane {
  constructor(curve, options = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.raycaster = this.experience.raycaster;
    this.curve = curve;
    this.height = options.height || 3;
    this.segments = options.segments || 100;
    this.meshCount = options.meshCount || 6;
    this.uvOffset = 0.1;
    this.onMeshIntersect = options.onMeshIntersect || function(index) {};

    this.raycasterEnabled = true;

    this.createPlane();
  }

  createPlane() {
    // Получаем точки вдоль кривой
    const curvePoints = this.curve.getSpacedPoints(this.segments);

    // Создаём массив позиций и UV-координат
    const positions = new Float32Array(curvePoints.length * 6); // 2 вершины на каждую точку
    const uvs = new Float32Array(curvePoints.length * 4); // UV для каждой вершины

    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];

      // Верхняя вершина
      positions[i * 6] = point.x;
      positions[i * 6 + 1] = point.y + this.height / 2;
      positions[i * 6 + 2] = point.z;

      // Нижняя вершина
      positions[i * 6 + 3] = point.x;
      positions[i * 6 + 4] = point.y - this.height / 2;
      positions[i * 6 + 5] = point.z;

      // UV-координаты
      uvs[i * 4] = i / (curvePoints.length - 1);
      uvs[i * 4 + 1] = 1;
      uvs[i * 4 + 2] = i / (curvePoints.length - 1);
      uvs[i * 4 + 3] = 0;
    }

    // Создаём BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Создаём индексы для треугольников
    const indices = [];
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const top1 = i * 2;
      const bottom1 = i * 2 + 1;
      const top2 = (i + 1) * 2;
      const bottom2 = (i + 1) * 2 + 1;

      // Первый треугольник
      indices.push(top1, bottom1, top2);

      // Второй треугольник
      indices.push(bottom1, bottom2, top2);
    }

    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();

    // Создаём материал (полностью прозрачный)
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0, // Для отладки можно установить 0.0
      depthWrite: false,
      wireframe: true // Для визуализации можно временно оставить
    });

    // Создаём ShaderMaterial вместо MeshBasicMaterial
    // this.material = new THREE.ShaderMaterial({
    //   uniforms: {
    //     uUvOffset: { value: this.uvOffset }
    //   },
    //   vertexShader: `
    //       varying vec2 vUv;

    //       void main() {
    //         vUv = uv;
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //       }
    //     `,
    //   fragmentShader: `
    //           uniform float uUvOffset;
    //           varying vec2 vUv;

    //           void main() {
    //             // Применяем смещение UV
    //             float shiftedU = fract(vUv.x + uUvOffset);

    //             // Разделяем shiftedU на 6 сегментов
    //             float segment = floor(shiftedU * 6.0);
    //             vec3 color;

    //             if (segment == 0.0) {
    //               color = vec3(1.0, 0.0, 0.0); // Красный
    //             } else if (segment == 1.0) {
    //               color = vec3(0.0, 1.0, 0.0); // Зелёный
    //             } else if (segment == 2.0) {
    //               color = vec3(0.0, 0.0, 1.0); // Синий
    //             } else if (segment == 3.0) {
    //               color = vec3(1.0, 1.0, 0.0); // Жёлтый
    //             } else if (segment == 4.0) {
    //               color = vec3(1.0, 0.0, 1.0); // Магента
    //             } else {
    //               color = vec3(0.0, 1.0, 1.0); // Циан
    //             }

    //             gl_FragColor = vec4(color, 1.0);
    //           }
    //     `,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    //   opacity: 0.5, // При необходимости
    //   depthWrite: false,
    //   // wireframe: false, // Отключите, если не требуется
    // });

    // Создаём mesh
    this.invisiblePlane = new THREE.Mesh(this.geometry, this.material);
    this.invisiblePlane.name = "InvisiblePlane";

    // Добавляем на сцену
    this.scene.add(this.invisiblePlane);
  }


  update() {
    // Смещаем UV на основе скорости
    this.uvOffset -= this.experience.shared.speed;
    this.uvOffset = this.uvOffset % 1; // Обеспечиваем цикличность
    // this.uvOffset = (this.uvOffset % 1 + 1) % 1; 

    // Обновляем uniform в шейдере
    // this.material.uniforms.uUvOffset.value = this.uvOffset;

    if (!this.raycasterEnabled) return;


    // Настраиваем Raycaster и проверяем пересечения
    this.raycaster.setFromCamera(this.experience.mouse, this.experience.camera.instance);
    const intersects = this.raycaster.intersectObject(this.invisiblePlane, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const intersectUv = intersect.uv;

      // Смещаем UV с учетом текущего смещения
      const adjustedUvX = (intersectUv.x + this.uvOffset) % 1;

      // Вычисляем индекс меша
      let meshIndex = Math.floor(adjustedUvX * this.meshCount) - 1;
      // let meshIndex = Math.floor(adjustedUvX * this.meshCount);
      // meshIndex = meshIndex % this.meshCount;
      // Условие для корректировки meshIndex
      if (meshIndex < 0) {
        if (meshIndex === -1) {
          meshIndex = 5;
        } else if (meshIndex === -2) {
          meshIndex = 4;
        } else if (meshIndex === -3) {
          meshIndex = 3;
        } else if (meshIndex === -4) {
          meshIndex = 2;
        } else if (meshIndex === -5) {
          meshIndex = 1;
        }
      } else if (meshIndex > 5) {
        meshIndex = 0;
      }
      
      // console.log('Индекс меша:', meshIndex);
      // Здесь можно добавить дальнейшую обработку meshIndex


      this.onMeshIntersect(meshIndex);
    }
  }
}
