import { gsap } from 'gsap';
import { CustomEase } from 'gsap/all';
import Experience from "./Experience.js";
import { px, mob } from './Utils/functions.js';
import splitText from './Utils/splitText.js';

gsap.registerPlugin(CustomEase);
CustomEase.create(
  'hop',
  "M0,0 C0.083,0.294 0.117,0.767 0.413,0.908 0.606,1 0.752,1 1,1"
);

const bodyEl = document.body;

export default class Controls {
  DOM = {
    el: null,
    cards: null,
    close: null,
  }

  cardsArr = [];
  iscardView = true;
  isAnimating = false;
  originalCameraPosition = null;

  constructor() {
    this.DOM.el = document.getElementById('body');
    this.DOM.cards = [...this.DOM.el.querySelectorAll('.information')];
    // this.DOM.close =  [...this.DOM.cards.querySelectorAll('.close')];
    this.experience = new Experience();
    this.camera = this.experience.camera.instance;
    this.originalCameraPosition = this.camera.position.clone();
    this.sizes = this.experience.sizes;
    this.device = this.sizes.device;

    this.sizes.on("switchdevice", (device) => {
        this.device = device;
    });

    this.DOM.cards.forEach((card) => {
      const closeButton = card.querySelector('.close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideInformation(card);
        });
      }
    });
  }

  showInformation(index) {
    this.DOM.cards.forEach(card => {
      if (this.isAnimating) return;

      this.isAnimating = true;

      this.originalCameraPosition.copy(this.camera.position);

      gsap.timeline({
        defaults: {
          duration: 1.8,
          ease: 'hop'
        },
      })
      .addLabel('start', 0)
      .to(this.camera.position, { x: 25 }, 'start')
      .add(() => {
        const target = this.DOM.cards.find(card => card.classList.contains(`info-${index}`));
        if (target) {
          const titleElement = target.querySelector('.information--block__title');
          splitText(titleElement);
          const title = target.querySelectorAll('.information--block__title .animated-word');
          const blocks = target.querySelectorAll('.block');
          console.log(blocks)
      
          gsap.timeline({
            defaults: {
              duration: 1.8,
              ease: 'hop'
            },
          })
          .set([title, ...blocks], { y: 40, opacity: 0 })
          .addLabel('in-start', 0)
          // .to(target, { 
          //   top: px(120),
          // }, 'in-start')
          .to(target, { 
            top: this.device === "desktop" ? px(120) : mob(80),
          }, 'in-start')
          .to(title, {
            y: 0,
            stagger: 0.02,
            opacity: 1,
            
          }, 'in-start+=0.5')
          .to(blocks, {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            onComplete: () => {
              this.isAnimating = false;
              this.experience.world.invisiblePlane.raycasterEnabled = false;
            }
          }, 'in-start+=0.7');
        } else {
          this.isAnimating = false;
        }
      }, 'start+=0.4'); 
    });

    document.querySelector('canvas').classList.add('canvas--disabled');
  }

  hideInformation(card) {
    if (this.isAnimating) return; // Предотвращаем запуск, если анимация уже идет
  
    this.isAnimating = true;
  
    if (card) {
      gsap.timeline({
        defaults: {
          duration: 1.2,
          ease: 'hop'
        },
      })
      .addLabel('start', 0)
      .to(card, { 
        top: '100%',
        onComplete: () => {
          this.isAnimating = false; // Сбрасываем флаг после завершения анимации
  
          this.experience.world.invisiblePlane.raycasterEnabled = true;
        }
      }, 'start')
      .to(this.camera.position, {
        x: this.originalCameraPosition.x,
        onComplete: () => {
          this.isAnimating = false; // Сбрасываем флаг после завершения анимации
          this.experience.world.invisiblePlane.raycasterEnabled = true;
        }
      }, 'start');
    } else {
      this.isAnimating = false; // Сбрасываем флаг, если целевой элемент не найден
    }

    document.querySelector('canvas').classList.remove('canvas--disabled');
  }

}