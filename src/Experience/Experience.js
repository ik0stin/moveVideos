import * as THREE from 'three';

import Sizes from "./Utils/Sizes.js";
import Time from "./Utils/Time.js";
import Camera from "./Camera.js";
import Renderer from './Renderer.js';
import World from './World/World.js';
import Resources from './Utils/Resources.js';
import Debug from './Utils/Debug.js';
import sources from './sources.js';
import Controls from './Controls.js';
import Preloader from './Utils/Preloader.js';

let instance = null;

export default class Experience {
  constructor(canvas) {
    if (instance) {
      return instance
    };

    instance = this;

    this.shared = {};

    // Options
    this.canvas = canvas;

    // Setup
    this.debug = new Debug();
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Resources(sources);
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(2, 2);
    this.isMouseOver = false;
    this.controls = null;
    this.preloader = new Preloader();

    // Sizes resize event
    this.sizes.on('resize', () => {
      this.resize(); //чтобы не терять контекст, используй error function () => {}
    });

    // Time tick event
    // this.time.on('tick', () => {
    //   this.update();
    // });
    this.time.on('tick', (elapsedTime) => {
      this.update(elapsedTime);
    });

    this.addEventListeners();

    this.resources.on('ready', () => {
      this.controls = new Controls();
    });

  }

  // Добавьте статический метод для получения текущего экземпляра
  // static getInstance() {
  //   return instance;
  // }

  /**
   * Listeners
   */
  addEventListeners() {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    // window.addEventListener('wheel', this.onWheel.bind(this))
    // window.addEventListener('mousedown', this.onMouseDown.bind(this))
    // window.addEventListener('mouseup', this.onMouseUp.bind(this))

    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this))
    // window.addEventListener('resize', this.onResize.bind(this))

    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // this.mouse.x = -(event.clientX / window.innerWidth) * 2 + 1;
    // this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  }

  onMouseLeave(event) {
    this.isMouseOver = false;
    // console.log('Mouse left canvas');
    // Устанавливаем координаты мыши вне диапазона, чтобы Raycaster не пересекал меши
    this.mouse.x = 2;
    this.mouse.y = 2;
  }

  onMouseEnter(event) {
    this.isMouseOver = true;
    // console.log('Mouse entered canvas');
  }


  onClick(event) {
    const meshIndex = this.world.shape.getCurrentHoveredIndex();
  
    if (meshIndex !== null && meshIndex !== undefined) {
      this.controls.showInformation(meshIndex);
    }
  }

  onTouchStart(event) {
    this.world.shape.onTouchStart(event);
  }
  
  onTouchMove(event) {
    this.world.shape.onTouchMove(event);
  }
  
  onTouchEnd(event) {
    this.world.shape.onTouchEnd(event);
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.raycaster.setFromCamera(this.mouse, this.camera.instance);
    this.world.update();
    this.renderer.update();
  }


  destroy() {
    this.sizes.off('resize')
    this.time.off('tick')

    // Traverse the whole scene
    this.scene.traverse((child) => {
      // Test if it's a mesh
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()

        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key]

          // Test if there is a dispose function
          if (value && typeof value.dispose === 'function') {
            value.dispose()
          }
        }
      }
    })

    this.camera.controls.dispose();
    this.renderer.instance.dispose();
    // postprocessing тоже нужно отключить, если есть

    if (this.debug.active) {
      this.debug.ui.destroy();
    }
  }
}