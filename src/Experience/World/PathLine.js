import * as THREE from 'three';
import Experience from "../Experience.js";

export default class PathLine {
  constructor(options = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    // Устанавливаем переданные параметры или значения по умолчанию
    this.rotationX = options.rotationX || - Math.PI * 0.5;
    this.rotationZ = options.rotationZ || - Math.PI * 0.5;;
    this.positionY = options.positionY || 2;

    // Принимаем массив точек или используем по умолчанию
    this.points = options.points || [
      new THREE.Vector3(-2, 0, -10),
      new THREE.Vector3(1, 0, -10), //z, y, x
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(0, 0, -7),
      new THREE.Vector3(0.5, 0, -6),
      new THREE.Vector3(4, 0, -3),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(4, 0, 3),
      new THREE.Vector3(0.5, 0, 6),
      new THREE.Vector3(0, 0, 7),
      new THREE.Vector3(0, 0, 8),
      new THREE.Vector3(1, 0, 10),
      new THREE.Vector3(-2, 0, 10),
    ];

    this.color = options.color || 0xff0000;
    this.curve = this.setLinePath();  // Создание пути
    this.curve.closed = true;
    // this.visualizeCurve();  // Метод для визуализации кривой
  }

  setLinePath() {
    // Создаем кривую на основе переданных или стандартных точек
    this.curve = new THREE.CatmullRomCurve3(this.points);
    return this.curve;  // Возвращаем кривую
  }

  visualizeCurve() {
    // Получаем точки вдоль кривой для создания линии
    this.points = this.curve.getPoints(50);
    this.geometry = new THREE.BufferGeometry().setFromPoints(this.points);

    // Создаем материал для линии
    this.material = new THREE.LineBasicMaterial({ color: this.color });  // Красный цвет

    // Создаем линию из геометрии
    this.curveObject = new THREE.Line(this.geometry, this.material);

    // Применяем переданные через конструктор параметры вращения и позиции
    // this.curveObject.rotation.x = this.rotationX;
    // this.curveObject.rotation.z = this.rotationZ;
    // this.curveObject.position.y = this.positionY;

    // Добавляем линию в сцену
    this.scene.add(this.curveObject);
  }
}
