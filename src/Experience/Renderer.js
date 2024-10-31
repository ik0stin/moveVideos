import * as THREE from 'three';
import Experience from "./Experience.js";

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default class Renderer {
  constructor() {
    this.experience = new Experience();
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.postprocessing = {};

    this.debug = this.experience.debug;
    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('environment');
    }
    this.setInstance();
    this.initPostprocessing();

  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });

    this.instance.physicallyCorrectLights = true;
    this.instance.outputEncoding = THREE.sRGBEncoding;
    this.instance.toneMapping = THREE.CineonToneMapping;
    this.instance.toneMappingExposure = 1.75;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.setClearColor('#211d20');
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
  }

  initPostprocessing() {
    this.renderPass = new RenderPass( this.scene, this.camera.instance );
    this.bokehPass = new BokehPass( this.scene, this.camera.instance, {
      focus: 10.0,
      aperture: 0.0003,
      maxblur: 0.01
    });

    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('BokehPass');
    
      this.debugFolder.add(this.bokehPass.uniforms.focus, 'value')
        .min(0)
        .max(3000)
        .step(1)
        .name('Focus');
    
      this.debugFolder.add(this.bokehPass.uniforms.aperture, 'value')
        .min(0)
        .max(0.1)
        .step(0.00001)
        .name('Aperture');
    
      this.debugFolder.add(this.bokehPass.uniforms.maxblur, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('Max Blur');
    }

    this.outputPass = new OutputPass();

    this.composer = new EffectComposer(this.instance);

    this.composer.addPass( this.renderPass );
    this.composer.addPass( this.bokehPass );
    // this.composer.addPass( this.outputPass );

    this.postprocessing.composer = this.composer;
    this.postprocessing.bokeh = this.bokehPass;

  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    // this.instance.render(this.scene, this.camera.instance)
    this.postprocessing.composer.render();
  }
}