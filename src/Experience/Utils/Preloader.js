import EventEmitter from "./EventEmitter";
import Experience from "../Experience.js";
import gsap from "gsap";

export default class Preloader extends EventEmitter {

  originalCameraPosition = null;

  constructor() {
    super();
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.sizes = this.experience.sizes;
    this.resources = this.experience.resources;
    this.camera = this.experience.camera.instance;
    this.originalCameraPosition = this.camera.position.clone();
    this.world = this.experience.world;
    this.device = this.sizes.device;

    this.sizes.on("switchdevice", (device) => {
        this.device = device;
    });


    this.world.on("worldready", () => {
      this.setAssets();
      this.playIntro().then(() => {
      
      });
    })
  }

  setAssets() {
    this.navigation = document.querySelector(".navigation");
    this.footer = document.querySelector(".frooter")

    gsap.set(this.navigation, { opacity: 0, y: -100 })
    gsap.set(this.footer, {opacity: 0, y: 100 })
    gsap.set(this.camera.position, { x: 25 })
  }

  // if (this.device === "desktop") {}

  playIntro() {
    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        defaults: {
          duration: 1.8,
          ease: 'hop'
        },
        onComplete: resolve,
      });

      timeline
        .addLabel('start', 0)
        .to(".preloader", {
          opacity: 0,
          display: 'none',
          // onComplete: () => {
          //   document.querySelector(".preloader").classList.add("hidden");
          // },
        }, 'start')
        .to(this.camera.position, {
          x: this.originalCameraPosition.x,
        }, 'start+=0.9')
        .to(this.navigation, {
          opacity: 1,
          y: 0,
          duration: 1
        }, "start+=1.0")
        .to(this.footer, {
          opacity: 1,
          y: 0,
          duration: 1
        }, "start+=1.0");
    });
  }
}