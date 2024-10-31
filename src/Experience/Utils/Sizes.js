import EventEmitter from "./EventEmitter.js";

export default class Sizes extends EventEmitter {
  constructor() {
    super();

    // Setup
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    if (this.width < 991) {
        this.device = "mobile";
    } else {
        this.device = "desktop";
    }

    // Resize events
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);

      this.trigger('resize')

      if (this.width < 991 && this.device !== "mobile") {
        this.device = "mobile";
        this.trigger("switchdevice", this.device);
      } else if (this.width >= 991 && this.device !== "desktop") {
          this.device = "desktop";
          this.trigger("switchdevice", this.device);
      }
    });
  }
}