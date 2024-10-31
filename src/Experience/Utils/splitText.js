// export default function (element) {
//   // element.style.overflow ="hidden";
//   element.innerHTML = element.innerText
//     .split("")
//     .map((letter) => {
//       if (letter === " ") {
//         return `<span>&nbsp;</span>`
//       }
//       return `<span class="animatedis">${letter}</span>`;
//     })
//     .join("");

//   return element;
// }

export default function splitTex(element) {
  element.innerHTML = element.innerText
    .split(" ")
    .map((word) => {
      return `<span class="animated-word">${word}</span>`;
    })
    .join(" ");

  return element;
}