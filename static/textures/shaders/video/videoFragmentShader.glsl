precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uNoiseTexture;
uniform vec3 uColor;
uniform float uBorderVertical;
uniform float uBorderHorizontal;
uniform float uParallaxOffset;
uniform float uDispersion;
uniform float uDistortion;
uniform float uNoiseStrength;
uniform float uStripeFrequency;
uniform float uTime;
uniform float uOpacity;

uniform vec2 uHoverUv;          // Координаты наведения
uniform float uStartTime;       // Время начала эффекта
uniform float uEffectDuration;  // Длительность эффекта
uniform float uEffectStrength;  // Сила эффекта искажений при наведении

uniform vec3 uCameraPosition;   // Для эффекта тумана
uniform vec3 uFogColor;         // Цвет тумана
uniform float uFogNear;         // Начало тумана
uniform float uFogFar;          // Конец тумана

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;    // Позиция в мировых координатах

void main() {
  vec3 n = normalize(vNormal);

  // Вычисляем направление взгляда
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // Вычисляем косинус угла между нормалью и направлением взгляда
  float dotNV = dot(n, viewDir);

  if (abs(n.z - 1.0) < 0.0001) {
      // Применяем смещение параллакса только по оси X
      vec2 parallaxUv = vec2(vUv.x + uParallaxOffset, vUv.y);

      // Проверка на рамки с использованием оригинальных vUv
      bool isLeftBorder = vUv.x < uBorderVertical;
      bool isRightBorder = vUv.x > 1.0 - uBorderVertical;
      bool isTopBorder = vUv.y < uBorderHorizontal;
      bool isBottomBorder = vUv.y > 1.0 - uBorderHorizontal;

      if (isLeftBorder || isRightBorder || isTopBorder || isBottomBorder) {
          gl_FragColor = vec4(uColor, 1.0); // Цвет рамки
      } else {
          // Вычисляем fadeFactor для плавного усиления эффектов при наведении
          float fadeFactor = 0.0;
          if (uStartTime >= 0.0 && (uTime - uStartTime) <= uEffectDuration) {
              float elapsed = uTime - uStartTime;
              fadeFactor = smoothstep(0.0, 0.5, elapsed) * (1.0 - smoothstep(uEffectDuration - 0.5, uEffectDuration, elapsed));
          }

          // Усиливаем параметры искажений на основе fadeFactor и uEffectStrength
          float enhancedDispersion = uDispersion * (1.0 + fadeFactor * uEffectStrength);
          float enhancedDistortion = uDistortion * (1.0 + fadeFactor * uEffectStrength);
          float enhancedNoiseStrength = uNoiseStrength * (1.0 + fadeFactor * uEffectStrength);
          float enhancedStripeFrequency = uStripeFrequency * (1.0 + fadeFactor * uEffectStrength);
          float enhancedDistortionOffset = 0.005 * (1.0 + fadeFactor * uEffectStrength);

          // Эффекты хроматической аберрации и шума

          // Хроматическая дисперсия
          vec2 uvr = parallaxUv * (1.0 - enhancedDispersion) + vec2(enhancedDispersion, enhancedDispersion) / 2.0;
          vec2 uvg = parallaxUv;
          vec2 uvb = parallaxUv * (1.0 + enhancedDispersion) - vec2(enhancedDispersion, enhancedDispersion) / 2.0;

          // Семплируем шумовую текстуру
          vec3 offset = texture2D(uNoiseTexture, vec2(0.0, parallaxUv.y + uTime * 255.0)).xyz;

          // Применяем искажение на основе шума
          uvr += offset.x * enhancedDistortion;
          uvg += offset.x * enhancedDistortion;
          uvb += offset.x * enhancedDistortion;

          // Семплируем видео текстуру для каждого цветового канала
          float r = mix(texture2D(uTexture, vec2(uvr.x, uvr.y)).r, offset.r, enhancedNoiseStrength);
          float g = mix(texture2D(uTexture, vec2(uvg.x, uvg.y)).g, offset.g, enhancedNoiseStrength);
          float b = mix(texture2D(uTexture, vec2(uvb.x, uvb.y)).b, offset.b, enhancedNoiseStrength);

          vec3 col = vec3(r, g, b);

          // Эффект полос
          float stripes = sin(parallaxUv.y * enhancedStripeFrequency + uTime * 10.0);
          col = mix(col, vec3(0.8), stripes / 20.0);

          // Добавляем эффект искажения, движущегося снизу вверх
          float distortionOffset = sin(parallaxUv.y * 10.0 + uTime * 5.0) * enhancedDistortionOffset;
          parallaxUv.y += distortionOffset;

          gl_FragColor = vec4(col, 1.0);
      }
  } else {
      // Другие стороны — сплошной цвет
      gl_FragColor = vec4(uColor, 1.0);
  }

  // Добавляем эффект тумана
  float fogDistance = length(uCameraPosition - vWorldPosition);
  float fogFactor = smoothstep(uFogNear, uFogFar, fogDistance);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, fogFactor);

  // Применяем прозрачность
  gl_FragColor.a *= uOpacity;
}
