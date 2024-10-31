import * as THREE from 'three';
import { MathUtils } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from "./Experience.js";
import gsap from 'gsap';

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;

    this.setInstance();
    this.setOrbitControls();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height,0.1, 100);
    this.instance.position.set(16, 4, 4);
    this.scene.add(this.instance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enabled = false;
    this.controls.target.set(0, 0, 0); // Добавлено
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  onMoveCamera() {
    gsap.to(this.instance.position, {
      y: MathUtils.clamp(this.experience.mouse.y * 1 + 4, 0, 5),
      z: MathUtils.clamp(this.experience.mouse.x * 1.5 + 4, 1, 4),
      duration: 2.2,
      ease: "power.out",
    });
  }
  

  update() {
    this.controls.update();
    this.onMoveCamera();
  }
}