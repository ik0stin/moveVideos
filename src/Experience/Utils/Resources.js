import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from "./EventEmitter";

export default class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;

    // Setup
    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;

    this.setLoaders();
    this.startLoading();
  }

  setLoaders() {
    this.loaders = {};

    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
    // No specific loader for videos; we'll handle them manually
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.loaders.gltfLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'texture') {
        this.loaders.textureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'cubeTexture') {
        this.loaders.cubeTextureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'video') {
        this.loadVideo(source);
      }
    }
  }

  loadVideo(source) {
    // Create a video element
    const video = document.createElement('video');
    video.src = source.path;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.setAttribute('playsInline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    
    // Start loading the video
    video.load();
    video.play();

    // Listen for the 'canplaythrough' event to ensure the video is ready
    const onCanPlayThrough = () => {
      // Remove the event listener
      video.removeEventListener('canplaythrough', onCanPlayThrough);

      // Create a VideoTexture
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      // Store the video texture in the items
      this.sourceLoaded(source, videoTexture);
    };

    video.addEventListener('canplaythrough', onCanPlayThrough);

    // Handle video loading errors
    video.addEventListener('error', (error) => {
      console.error(`Error loading video ${source.path}:`, error);
    });
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file;

    this.loaded++;

    if (this.loaded === this.toLoad) {
      this.trigger('ready');
    }
  }
}
