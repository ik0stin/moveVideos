import * as THREE from 'three';
import Experience from "../Experience.js";

export default class TextOnPlane {
  constructor(curve, options = {}) {
    this.experience = new Experience();
    this.resources = this.experience.resources;
    this.scene = this.experience.scene;
    this.raycaster = this.experience.raycaster;
    this.curve = curve;
    this.height = options.height || 3;
    this.segments = options.segments || 100;
    this.meshCount = options.meshCount || 6;
    this.uvOffset = 0.1;
    this.onMeshIntersect = options.onMeshIntersect || function(index) {};
    this.texture = this.resources.items['text'];
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.needsUpdate = true;

    this.sizes = this.experience.sizes;
    this.device = this.sizes.device;

    this.sizes.on("switchdevice", (device) => {
        this.device = device;
    });

    this.segmentOpacities = new Array(this.meshCount).fill(0.0);
    this.segmentGlitchIntensity = new Array(this.meshCount).fill(0.0);
    this.previousMeshIndex = -1;

    this.createPlane();
  }

  createPlane() {
    const curvePoints = this.curve.getSpacedPoints(this.segments);
    const positions = new Float32Array(curvePoints.length * 6);
    const uvs = new Float32Array(curvePoints.length * 4);

    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const offsetDistance = 0.0;
      const direction = point.clone().sub(this.curve.getPointAt(0)).normalize().multiplyScalar(offsetDistance);

      positions[i * 6] = point.x + direction.x;
      positions[i * 6 + 1] = point.y + this.height / 2 + direction.y;
      positions[i * 6 + 2] = point.z + direction.z;

      positions[i * 6 + 3] = point.x + direction.x;
      positions[i * 6 + 4] = point.y - this.height / 2 + direction.y;
      positions[i * 6 + 5] = point.z + direction.z;

      uvs[i * 4] = i / (curvePoints.length - 1);
      uvs[i * 4 + 1] = 1;
      uvs[i * 4 + 2] = i / (curvePoints.length - 1);
      uvs[i * 4 + 3] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const indices = [];
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const top1 = i * 2;
      const bottom1 = i * 2 + 1;
      const top2 = (i + 1) * 2;
      const bottom2 = (i + 1) * 2 + 1;

      indices.push(top1, bottom1, top2);
      indices.push(bottom1, bottom2, top2);
    }

    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();

    let fragmentShaderCode;

    if (this.device === "desktop") {
      fragmentShaderCode = `
        uniform float uUvOffset;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uSegmentOpacities[6];
        uniform float uSegmentGlitchIntensity[6];
        uniform float uShakePower;
        uniform float uShakeRate;
        uniform float uShakeSpeed;
        uniform float uShakeBlockSize;
        uniform float uShakeColorRate;
        uniform vec3 uCameraPosition; // Добавлено
        uniform vec3 uFogColor;       // Добавлено
        uniform float uFogNear;       // Добавлено
        uniform float uFogFar;        // Добавлено

        varying vec2 vUv;
        varying vec3 vWorldPosition;  // Добавлено

        float random(float seed) {
          return fract(543.2543 * sin(dot(vec2(seed, seed), vec2(3525.46, -54.3415))));
        }

        void main() {
          float shiftedU = fract(vUv.x + uUvOffset);
          float segment = floor(shiftedU * 6.0);

          float opacity = uSegmentOpacities[int(segment)];
          float glitchIntensity = uSegmentGlitchIntensity[int(segment)];

          if (opacity < 0.01) {
            discard;
          }

          float segmentWidth = 1.0 / 6.0;
          float segmentUStart = segment * segmentWidth;
          float segmentU = segmentUStart + fract(shiftedU * 6.0) * segmentWidth;

          vec2 uv = vec2(segmentU, vUv.y);

          float enable_shift = glitchIntensity;

          vec2 fixed_uv = uv;
          fixed_uv.x += (random(floor(fixed_uv.y * uShakeBlockSize) / uShakeBlockSize + uTime) - 0.5) * uShakePower * enable_shift;

          vec4 pixel_color = texture2D(uTexture, fixed_uv);
          pixel_color.r = mix(pixel_color.r, texture2D(uTexture, fixed_uv + vec2(uShakeColorRate, 0.0)).r, enable_shift);
          pixel_color.b = mix(pixel_color.b, texture2D(uTexture, fixed_uv + vec2(-uShakeColorRate, 0.0)).b, enable_shift);

          pixel_color.a *= opacity;

          if (pixel_color.a < 0.1) {
            discard;
          }

          // Добавляем эффект тумана
          float fogDistance = length(uCameraPosition - vWorldPosition);
          float fogFactor = smoothstep(uFogNear, uFogFar, fogDistance);
          pixel_color.rgb = mix(pixel_color.rgb, uFogColor, fogFactor);

          gl_FragColor = pixel_color;
        }
      `
    } else {
      fragmentShaderCode = `
        uniform float uUvOffset;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec3 uCameraPosition; // Добавлено
        uniform vec3 uFogColor;       // Добавлено
        uniform float uFogNear;       // Добавлено
        uniform float uFogFar;        // Добавлено

        varying vec2 vUv;
        varying vec3 vWorldPosition;  // Добавлено

        void main() {
          float shiftedU = fract(vUv.x + uUvOffset);
          float segment = floor(shiftedU * 6.0);

          float segmentWidth = 1.0 / 6.0;
          float segmentUStart = segment * segmentWidth;
          float segmentU = segmentUStart + fract(shiftedU * 6.0) * segmentWidth;

          vec2 uv = vec2(segmentU, vUv.y);

          vec4 pixel_color = texture2D(uTexture, uv);

          // Добавляем эффект тумана
          float fogDistance = length(uCameraPosition - vWorldPosition);
          float fogFactor = smoothstep(uFogNear, uFogFar, fogDistance);
          pixel_color.rgb = mix(pixel_color.rgb, uFogColor, fogFactor);

          gl_FragColor = pixel_color;
        }
      `
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uUvOffset: { value: this.uvOffset },
        uDisplayedSegment: { value: -1 },
        uTexture: { value: this.texture },
        uTime: { value: 0.0 },
        uSegmentOpacities: { value: this.segmentOpacities },
        uSegmentGlitchIntensity: { value: this.segmentGlitchIntensity },
        uShakePower: { value: 0.03 },
        uShakeRate: { value: 0.2 },
        uShakeSpeed: { value: 40.0 },
        uShakeBlockSize: { value: 150.5 },
        uShakeColorRate: { value: 0.0001 },
        uCameraPosition: { value: new THREE.Vector3() }, // Добавлено
        uFogColor: { value: new THREE.Color(0x000000) }, // Добавлено
        uFogNear: { value: 18.0 },                      // Добавлено
        uFogFar: { value: 21.0 },                       // Добавлено
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition; // Добавлено

        void main() {
          vUv = uv;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz; // Вычисляем мировую позицию вершины
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
        }
      `,
      fragmentShader: fragmentShaderCode,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.textOnPlane = new THREE.Mesh(this.geometry, this.material);
    this.textOnPlane.name = "TextOnPlane";
    this.scene.add(this.textOnPlane);
  }

  update() {
    this.uvOffset -= this.experience.shared.speed;
    this.uvOffset = this.uvOffset % 1;

    this.material.uniforms.uUvOffset.value = this.uvOffset;
    this.material.uniforms.uTime.value += this.experience.time.delta / 1000;

    // Обновляем позицию камеры в uniforms
    this.material.uniforms.uCameraPosition.value.copy(this.experience.camera.instance.position);

    this.raycaster.setFromCamera(this.experience.mouse, this.experience.camera.instance);
    const intersects = this.raycaster.intersectObject(this.textOnPlane, false);

    let meshIndex = -1;

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const intersectUv = intersect.uv;

      const adjustedUvX = (intersectUv.x + this.uvOffset) % 1;

      meshIndex = Math.floor(adjustedUvX * this.meshCount);
      meshIndex = meshIndex % this.meshCount;

      if (meshIndex < 0) {
        meshIndex += this.meshCount;
      }

      const displayedSegment = (meshIndex + this.meshCount) % this.meshCount;
      // console.log(displayedSegment)

      this.material.uniforms.uDisplayedSegment.value = displayedSegment;
      this.onMeshIntersect(meshIndex);

      if (meshIndex !== this.previousMeshIndex) {
        if (this.previousMeshIndex !== -1) {
          this.segmentGlitchIntensity[this.previousMeshIndex] = 1.0;
        }
        this.segmentGlitchIntensity[meshIndex] = 1.0;
      }
    } else {
      if (this.previousMeshIndex !== -1) {
        this.segmentGlitchIntensity[this.previousMeshIndex] = 1.0;
      }
      this.material.uniforms.uDisplayedSegment.value = -1;
    }

    for (let i = 0; i < this.meshCount; i++) {
      const targetOpacity = (i === meshIndex) ? 1.0 : 0.0;
      this.segmentOpacities[i] += (targetOpacity - this.segmentOpacities[i]) * 0.1;

      this.segmentGlitchIntensity[i] += (-this.segmentGlitchIntensity[i]) * 0.05;
    }

    this.material.uniforms.uSegmentOpacities.value = this.segmentOpacities;
    this.material.uniforms.uSegmentGlitchIntensity.value = this.segmentGlitchIntensity;

    this.previousMeshIndex = meshIndex;
  }
}
