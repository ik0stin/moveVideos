import * as THREE from 'three';
import Experience from "../Experience.js";
import Environment from './Environment.js';
import Floor from './Floor.js';
import PathLine from './PathLine.js';
import GeometryOnPath from './GeometryOnPath.js';
import InvisiblePlane from '../Utils/InvisiblePlane.js';
import TextOnPlane from './TextOnPlane.js';
import Stars from './Stars.js';
import EventEmitter from "../Utils/EventEmitter.js";


export default class World  extends EventEmitter  {
  constructor() {
    super();
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.resources.on('ready', () => {

      // this.setAxisHelper();
      
      this.floor = new Floor();
      this.line = new PathLine({});
      this.lineText = new PathLine({
        points: [
          new THREE.Vector3(-2, 0, -10.5),
          new THREE.Vector3(1.5, 0, -10), //z, y, x
          new THREE.Vector3(0.5, 0, -8),
          new THREE.Vector3(0.5, 0, -7),
          new THREE.Vector3(1.0, 0, -6),
          new THREE.Vector3(4.5, 0, -3),
          new THREE.Vector3(5.5, 0, 0),
          new THREE.Vector3(4.5, 0, 3),
          new THREE.Vector3(1.0, 0, 6),
          new THREE.Vector3(0.5, 0, 7),
          new THREE.Vector3(0.5, 0, 8),
          new THREE.Vector3(1.5, 0, 10),
          new THREE.Vector3(-2, 0, 10.5),
        ],
        color: 0x00ff00, // Зелёный цвет
      });

      this.shape = new GeometryOnPath(0xffffff, this.line.curve, { 
        width: 8,
        height: 3,
        depth: 0.1,
        segments: 50,    // Увеличиваем количество сегментов для более плавного изгиба
        defaultSpeed: 0.0005,
        meshCount: 6,   // Расстояние между мешами для shape1
        color: 0x5A5A5A,
        borderVertical: 0.02, // NEW: Толщина вертикальных рамок
        borderHorizontal: 0.01, // NEW: Толщина горизонтальных рамок
      });

      this.invisiblePlane = new InvisiblePlane(this.line.curve, {
        height: 3, 
        segments: 100, 
        meshCount: this.shape.meshCount,
        onMeshIntersect: (index) => {
          this.shape.handleMeshIntersect(index);
        }
      });

      this.textOnPlane = new TextOnPlane(this.lineText.curve, {
        height: 3, 
        segments: 100,
        meshCount: this.shape.meshCount,
      });

      this.stars = new Stars();


      const geometry = new THREE.PlaneGeometry( 35, 5 );
      const material = new THREE.MeshBasicMaterial( {color: 0x000000 } );
      const plane = new THREE.Mesh( geometry, material );
      plane.position.x = -2;
      plane.rotation.y =  Math.PI * 0.5;
      this.scene.add( plane );

      this.environment = new Environment();
      this.trigger("worldready");
    });
  }

  setAxisHelper() {
    this.axis = new THREE.AxesHelper(10);
    this.axis.setColors ( 'red', 'green', 'blue' ) // x, y, z
    this.scene.add(this.axis);
  }

  update() {
    if (this.floor) {
      this.floor.update();
    }
    if (this.shape) {
      this.shape.update();
    }

    if (this.invisiblePlane) {
      this.invisiblePlane.update();
    }

    if (this.textOnPlane) {
      this.textOnPlane.update();
    }

    if (this.stars) {
      this.stars.update();
    }
  }
}
