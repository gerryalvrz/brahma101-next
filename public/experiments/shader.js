// Vertex Shader: Passes vertex positions to the fragment shader
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;

// Fragment Shader: Handles the rendering of colors and effects
const fragmentShaderSource = `
  precision highp float;

  // Uniforms (inputs from JavaScript)
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uIterations;
  uniform float uColorShift;
  uniform float uZoom;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform float uMirrors;

  // Generates a color palette
  vec3 palette(float t) {
    vec3 a = uColor1;
    vec3 b = uColor2;
    vec3 c = uColor3;
    vec3 d = uColor4;
    return a + b * cos(6.28318 * (c * t + d));
  }

  // Computes fluid-like motion
  float fluid(vec2 p) {
    float t = uTime * 0.4;
    vec2 pos = p * 3.0;
    float v = 0.0;
    float tm = t * 0.2;

    v += sin(pos.x * 1.1 + tm + sin(pos.y * 0.5 + t * 0.8) * 2.0);
    v += sin(pos.y * 1.2 + tm + sin(pos.x * 0.6 + t * 0.7) * 2.0);
    v += sin(pos.x * 0.9 + pos.y * 0.8 + tm + sin(t * 0.5) * 2.0);

    float tx = pos.x * 3.0 + v * 0.5 + t;
    float ty = pos.y * 3.0 + t * 0.4;
    float vx = sin(tx + ty);
    float vy = sin(tx - ty);

    return v + vx * vy;
  }

  // Main rendering logic
  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
    uv *= uZoom;

    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float sector = 6.28318 / uMirrors;
    angle = mod(angle, sector);
    if (mod(floor(atan(uv.y, uv.x) / sector), 2.0) == 1.0) {
      angle = sector - angle;
    }
    uv = vec2(cos(angle), sin(angle)) * radius;

    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 10.0; i++) {
      if (i >= uIterations) break;

      vec2 fluidUv = uv;
      float f = fluid(fluidUv);
      uv = fract(uv * 1.5 + f * 0.1) - 0.5;

      float d = length(uv) * exp(-length(uv0));
      vec3 col = palette(length(uv0) + i * uColorShift + f * 0.2);

      d = sin(d * 8.0 + f * 2.0) / 8.0;
      d = abs(d);

      d = pow(0.01 / d, 1.2);
      finalColor += col * d;
    }

    float glow = fluid(uv0 * 0.5) * 0.1;
    finalColor += palette(glow) * glow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// WebGL Context Setup
const canvas = document.getElementById('shaderCanvas');
const gl = canvas.getContext('webgl');

// Error Handling for WebGL Support
if (!gl) {
  console.error('WebGL not supported');
  document.body.innerHTML = 'WebGL is not supported in your browser.';
}

// Shader Compilation Helper Function
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed');
  }
  return shader;
}

// Shader Program Creation
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Shader program linking failed');
  }
  return program;
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// Canvas Resize Utility
function resizeCanvasToDisplaySize(canvas) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

// Shader Uniform Setup
function setUniforms(gl, program) {
  gl.useProgram(program);

  // Set resolution uniform
  const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Set default colors
  const randomColor = () => [Math.random(), Math.random(), Math.random()];
  gl.uniform3fv(gl.getUniformLocation(program, 'uColor1'), randomColor());
  gl.uniform3fv(gl.getUniformLocation(program, 'uColor2'), randomColor());
  gl.uniform3fv(gl.getUniformLocation(program, 'uColor3'), randomColor());
  gl.uniform3fv(gl.getUniformLocation(program, 'uColor4'), randomColor());

  // Set other uniforms
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), 0.0);
  gl.uniform1f(gl.getUniformLocation(program, 'uIterations'), 10.0);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), 0.5);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), 1.0);
  gl.uniform1f(gl.getUniformLocation(program, 'uMirrors'), 6.0);
}

// Animation Loop
function animate() {
  resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const timeLocation = gl.getUniformLocation(program, 'uTime');
  gl.uniform1f(timeLocation, performance.now() / 1000);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(animate);
}

// Start Rendering
setUniforms(gl, program);
animate();

// UI Event Listeners for Customization
const closeMenuButton = document.getElementById('closeMenu');
const customizeMenu = document.getElementById('customizeMenu');
closeMenuButton.addEventListener('click', () => {
  customizeMenu.style.display = 'none';
});
const toggleMenuButton = document.getElementById('toggleMenu');
toggleMenuButton.addEventListener('click', () => {
  customizeMenu.style.display = customizeMenu.style.display === 'block' ? 'none' : 'block';
});
