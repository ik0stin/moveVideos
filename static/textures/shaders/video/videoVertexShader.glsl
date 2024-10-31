
precision mediump float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition; // Добавлено для тумана

void main() {
  vUv = uv;
  vNormal = normal;

  // Применяем трансформации Flow
  #include <beginnormal_vertex>
  #include <begin_vertex>

  // Вычисляем позицию вершины в мировом пространстве
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
  vWorldPosition = worldPosition.xyz;

  // Преобразование позиции вершины
  gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
}
