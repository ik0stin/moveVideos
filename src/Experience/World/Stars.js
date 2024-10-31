import * as THREE from 'three';
import Experience from '../Experience.js';

export default class Stars {
  constructor() {
    this.experience = new Experience();
    this.resources = this.experience.resources;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera.instance;
    this.sizes = this.experience.sizes;

    this.materials = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.windowHalfX = this.sizes.width / 2;
    this.windowHalfY = this.sizes.height / 2;
    this.parameters = [];

    this.init();
  }

  init() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const velocities = [];

    const star1 = this.resources.items['star'];
    const star2 = this.resources.items['star'];
    const star3 = this.resources.items['star'];
    const star4 = this.resources.items['star'];
    const star5 = this.resources.items['star'];

    const numStars = 500;
    const positionRange = 100;

    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * positionRange * 2 - positionRange;
      const y = Math.random() * positionRange * 2 - positionRange;
      const z = Math.random() * positionRange * 2 - positionRange;

      vertices.push(x, y, z);

      // Генерируем случайные скорости для каждой звезды
      const velocityX = (Math.random() - 0.5) * 0.03;
      const velocityY = (Math.random() - 0.5) * 0.03;
      const velocityZ = (Math.random() - 0.5) * 0.03;

      velocities.push(velocityX, velocityY, velocityZ);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

    // this.parameters = [
    //   [[0.166, 0.8, 0.9], star2, 0.5],
    //   [[0.168, 0.75, 0.88], star3, 0.5],
    //   [[0.165, 0.7, 0.85], star1, 0.5],
    //   [[0.167, 0.65, 0.8], star5, 0.5],
    //   [[0.166, 0.6, 0.75], star4, 0.5],
    // ];

    this.parameters = [
      [[0.166, 0.8, 0.9], star2, 0.5],
      [[0.168, 0.75, 0.88], star3, 0.5],
      [[0.165, 0.7, 0.85], star1, 0.5],
      [[0.167, 0.65, 0.8], star5, 0.5],
      [[0.166, 0.6, 0.75], star4, 0.5],
    ];

    this.particlesArray = [];

    for (let i = 0; i < this.parameters.length; i++) {
      const color = this.parameters[i][0];
      const sprite = this.parameters[i][1];
      const size = this.parameters[i][2];

      this.materials[i] = new THREE.PointsMaterial({
        size: size,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      });
      this.materials[i].color.setHSL(color[0], color[1], color[2], THREE.SRGBColorSpace);

      // Клонируем геометрию для каждого набора звезд
      const particles = new THREE.Points(geometry.clone(), this.materials[i]);

      this.scene.add(particles);
      this.particlesArray.push(particles);
    }
  }

  update() {
    // Обновляем позиции звезд
    for (let i = 0; i < this.particlesArray.length; i++) {
      const particles = this.particlesArray[i];
      const positions = particles.geometry.attributes.position.array;
      const velocities = particles.geometry.attributes.velocity.array;
      const count = positions.length / 3;

      for (let j = 0; j < count; j++) {
        const index = j * 3;

        // Обновляем позиции на основе скоростей
        positions[index] += velocities[index];
        positions[index + 1] += velocities[index + 1];
        positions[index + 2] += velocities[index + 2];

        // Проверяем границы и возвращаем звезду на противоположную сторону
        const positionRange = 100;

        if (positions[index] < -positionRange) positions[index] = positionRange;
        if (positions[index] > positionRange) positions[index] = -positionRange;
        if (positions[index + 1] < -positionRange) positions[index + 1] = positionRange;
        if (positions[index + 1] > positionRange) positions[index + 1] = -positionRange;
        if (positions[index + 2] < -positionRange) positions[index + 2] = positionRange;
        if (positions[index + 2] > positionRange) positions[index + 2] = -positionRange;
      }

      // Сообщаем, что позиции были обновлены
      particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
