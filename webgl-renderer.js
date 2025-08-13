import { FONT_STACK } from './config.js';

// WebGL Renderer for hardware-accelerated graphics
export class WebGLRenderer {
  constructor(canvas, themeManager) {
    this.canvas = canvas;
    this.themeManager = themeManager;
    this.gl = null;
    this.programs = new Map();
    this.buffers = new Map();
    this.textures = new Map();
    this.isInitialized = false;
    
    // Shader sources
    this.shaders = {
      basic: {
        vertex: `#version 300 es
          in vec2 a_position;
          in vec2 a_texCoord;
          out vec2 v_texCoord;
          uniform mat4 u_matrix;
          
          void main() {
            gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `,
        fragment: `#version 300 es
          precision mediump float;
          in vec2 v_texCoord;
          out vec4 outColor;
          uniform sampler2D u_texture;
          uniform vec4 u_color;
          
          void main() {
            vec4 texColor = texture(u_texture, v_texCoord);
            outColor = texColor * u_color;
          }
        `
      },
      gradient: {
        vertex: `#version 300 es
          in vec2 a_position;
          out vec2 v_position;
          
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_position = a_position;
          }
        `,
        fragment: `#version 300 es
          precision mediump float;
          in vec2 v_position;
          out vec4 outColor;
          uniform vec4 u_color1;
          uniform vec4 u_color2;
          uniform float u_angle;
          
          void main() {
            vec2 pos = v_position;
            float t = (sin(pos.x * 10.0 + u_angle) + 1.0) * 0.5;
            outColor = mix(u_color1, u_color2, t);
          }
        `
      },
      particle: {
        vertex: `#version 300 es
          in vec2 a_position;
          in vec2 a_velocity;
          in float a_life;
          out float v_life;
          
          uniform float u_time;
          uniform vec2 u_resolution;
          
          void main() {
            vec2 pos = a_position + a_velocity * u_time;
            pos = pos / u_resolution * 2.0 - 1.0;
            gl_Position = vec4(pos, 0.0, 1.0);
            gl_PointSize = a_life * 10.0;
            v_life = a_life;
          }
        `,
        fragment: `#version 300 es
          precision mediump float;
          in float v_life;
          out vec4 outColor;
          uniform vec4 u_particleColor;
          
          void main() {
            float alpha = smoothstep(0.0, 1.0, v_life);
            outColor = u_particleColor * alpha;
          }
        `
      }
    };
    
    this.init();
  }
  
  // Initialize WebGL context
  init() {
    try {
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      if (!this.gl) {
        console.warn('WebGL not supported, falling back to 2D canvas');
        return false;
      }
      
      // Set viewport
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      
      // Enable blending for transparency
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      
      // Compile shaders
      this.compileShaders();
      
      // Create buffers
      this.createBuffers();
      
      this.isInitialized = true;
      console.log('WebGL renderer initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error);
      return false;
    }
  }
  
  // Compile all shader programs
  compileShaders() {
    for (const [name, shader] of Object.entries(this.shaders)) {
      try {
        const program = this.createProgram(shader.vertex, shader.fragment);
        this.programs.set(name, program);
      } catch (error) {
        console.warn(`Failed to compile ${name} shader:`, error);
      }
    }
  }
  
  // Create shader program
  createProgram(vertexSource, fragmentSource) {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + this.gl.getProgramParameter(program, this.gl.INFO_LOG_LENGTH));
    }
    
    return program;
  }
  
  // Create individual shader
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + this.gl.getShaderParameter(shader, this.gl.INFO_LOG_LENGTH));
    }
    
    return shader;
  }
  
  // Create buffers for rendering
  createBuffers() {
    // Full-screen quad for post-processing
    const quadVertices = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
       1,  1,  1, 1
    ]);
    
    const quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);
    this.buffers.set('quad', quadBuffer);
    
    // Particle system buffer
    const particleCount = 1000;
    const particleData = new Float32Array(particleCount * 5); // pos.x, pos.y, vel.x, vel.y, life
    
    for (let i = 0; i < particleCount; i++) {
      const offset = i * 5;
      particleData[offset + 0] = (Math.random() - 0.5) * 2; // pos.x
      particleData[offset + 1] = (Math.random() - 0.5) * 2; // pos.y
      particleData[offset + 2] = (Math.random() - 0.5) * 0.01; // vel.x
      particleData[offset + 3] = (Math.random() - 0.5) * 0.01; // vel.y
      particleData[offset + 4] = Math.random(); // life
    }
    
    const particleBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particleBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, particleData, this.gl.STATIC_DRAW);
    this.buffers.set('particles', particleBuffer);
  }
  
  // Render animated background
  renderAnimatedBackground(time) {
    if (!this.isInitialized || !this.programs.has('gradient')) return;
    
    const program = this.programs.get('gradient');
    this.gl.useProgram(program);
    
    // Set uniforms
    const color1Location = this.gl.getUniformLocation(program, 'u_color1');
    const color2Location = this.gl.getUniformLocation(program, 'u_color2');
    const angleLocation = this.gl.getUniformLocation(program, 'u_angle');
    
    const theme = this.themeManager.getCurrentTheme();
    const color1 = this.hexToRgba(theme.bar, 0.8);
    const color2 = this.hexToRgba(theme.active, 0.6);
    
    this.gl.uniform4f(color1Location, ...color1);
    this.gl.uniform4f(color2Location, ...color2);
    this.gl.uniform1f(angleLocation, time * 0.001);
    
    // Draw full-screen quad
    this.drawQuad();
  }
  
  // Render particle system
  renderParticles(time, count = 100) {
    if (!this.isInitialized || !this.programs.has('particle')) return;
    
    const program = this.programs.get('particle');
    this.gl.useProgram(program);
    
    // Set uniforms
    const timeLocation = this.gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    const colorLocation = this.gl.getUniformLocation(program, 'u_particleColor');
    
    this.gl.uniform1f(timeLocation, time);
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    
    const theme = this.themeManager.getCurrentTheme();
    const particleColor = this.hexToRgba(theme.success, 0.7);
    this.gl.uniform4f(colorLocation, ...particleColor);
    
    // Bind particle buffer
    const buffer = this.buffers.get('particles');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    
    // Set attributes
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    const velocityLocation = this.gl.getAttribLocation(program, 'a_velocity');
    const lifeLocation = this.gl.getAttribLocation(program, 'a_life');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(velocityLocation);
    this.gl.enableVertexAttribArray(lifeLocation);
    
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 20, 0);
    this.gl.vertexAttribPointer(velocityLocation, 2, this.gl.FLOAT, false, 20, 8);
    this.gl.vertexAttribPointer(lifeLocation, 1, this.gl.FLOAT, false, 20, 16);
    
    // Draw particles
    this.gl.drawArrays(this.gl.POINTS, 0, count);
  }
  
  // Render smooth transitions
  renderTransition(progress, fromColor, toColor) {
    if (!this.isInitialized || !this.programs.has('basic')) return;
    
    const program = this.programs.get('basic');
    this.gl.useProgram(program);
    
    // Interpolate colors
    const currentColor = this.interpolateColors(fromColor, toColor, progress);
    
    // Set color uniform
    const colorLocation = this.gl.getUniformLocation(program, 'u_color');
    this.gl.uniform4f(colorLocation, ...currentColor);
    
    // Draw transition overlay
    this.drawQuad();
  }
  
  // Render custom UI elements with WebGL
  renderUIElement(type, x, y, width, height, options = {}) {
    if (!this.isInitialized) return;
    
    switch (type) {
      case 'button':
        this.renderButton(x, y, width, height, options);
        break;
      case 'tab':
        this.renderTab(x, y, width, height, options);
        break;
      case 'progress':
        this.renderProgress(x, y, width, height, options);
        break;
      case 'loading':
        this.renderLoadingSpinner(x, y, width, height, options);
        break;
    }
  }
  
  // Render animated button
  renderButton(x, y, width, height, options) {
    const { hovered = false, pressed = false, theme = this.themeManager.getCurrentTheme() } = options;
    
    // Calculate button colors based on state
    let baseColor = this.hexToRgba(theme.button, 1.0);
    if (hovered) {
      baseColor = this.hexToRgba(theme.active, 1.0);
    }
    if (pressed) {
      baseColor = this.hexToRgba(theme.text, 0.8);
    }
    
    // Render button background with rounded corners
    this.renderRoundedRect(x, y, width, height, 6, baseColor);
    
    // Add subtle shadow
    if (hovered) {
      this.renderShadow(x, y, width, height, 8, 0.2);
    }
  }
  
  // Render tab with smooth animations
  renderTab(x, y, width, height, options) {
    const { active = false, theme = this.themeManager.getCurrentTheme() } = options;
    
    let tabColor = this.hexToRgba(theme.button, 1.0);
    if (active) {
      tabColor = this.hexToRgba(theme.active, 1.0);
    }
    
    // Render tab background
    this.renderRoundedRect(x, y, width, height, 4, tabColor);
    
    // Render active indicator
    if (active) {
      const indicatorColor = this.hexToRgba(theme.text, 1.0);
      this.renderRect(x, y + height - 2, width, 2, indicatorColor);
    }
  }
  
  // Render progress bar
  renderProgress(x, y, width, height, options) {
    const { progress = 0, theme = this.themeManager.getCurrentTheme() } = options;
    
    // Background
    const bgColor = this.hexToRgba(theme.input, 0.5);
    this.renderRoundedRect(x, y, width, height, height / 2, bgColor);
    
    // Progress fill
    const fillWidth = width * Math.max(0, Math.min(1, progress));
    if (fillWidth > 0) {
      const fillColor = this.hexToRgba(theme.success, 1.0);
      this.renderRoundedRect(x, y, fillWidth, height, height / 2, fillColor);
    }
  }
  
  // Render loading spinner
  renderLoadingSpinner(x, y, width, height, options) {
    const { rotation = 0, theme = this.themeManager.getCurrentTheme() } = options;
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;
    
    // Render spinning circle
    const spinnerColor = this.hexToRgba(theme.text, 0.8);
    this.renderCircle(centerX, centerY, radius, spinnerColor, rotation);
  }
  
  // Helper: Render rounded rectangle
  renderRoundedRect(x, y, width, height, radius, color) {
    // For now, render as regular rectangle
    // In a full implementation, this would use a more complex shader
    this.renderRect(x, y, width, height, color);
  }
  
  // Helper: Render rectangle
  renderRect(x, y, width, height, color) {
    if (!this.programs.has('basic')) return;
    
    const program = this.programs.get('basic');
    this.gl.useProgram(program);
    
    // Convert screen coordinates to normalized device coordinates
    const ndcX = (x / this.canvas.width) * 2 - 1;
    const ndcY = (y / this.canvas.height) * 2 - 1;
    const ndcWidth = (width / this.canvas.width) * 2;
    const ndcHeight = (height / this.canvas.height) * 2;
    
    // Create transformation matrix
    const matrix = [
      ndcWidth, 0, 0, ndcX,
      0, ndcHeight, 0, ndcY,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    
    const matrixLocation = this.gl.getUniformLocation(program, 'u_matrix');
    this.gl.uniformMatrix4fv(matrixLocation, false, matrix);
    
    // Set color
    const colorLocation = this.gl.getUniformLocation(program, 'u_color');
    this.gl.uniform4f(colorLocation, ...color);
    
    // Draw
    this.drawQuad();
  }
  
  // Helper: Render circle
  renderCircle(centerX, centerY, radius, color, rotation = 0) {
    // Simplified circle rendering
    const diameter = radius * 2;
    this.renderRect(centerX - radius, centerY - radius, diameter, diameter, color);
  }
  
  // Helper: Render shadow
  renderShadow(x, y, width, height, blur, alpha) {
    const shadowColor = [0, 0, 0, alpha];
    this.renderRect(x + blur, y + blur, width, height, shadowColor);
  }
  
  // Helper: Draw full-screen quad
  drawQuad() {
    const buffer = this.buffers.get('quad');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    
    const positionLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), 'a_texCoord');
    
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(texCoordLocation);
    
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
    
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
  
  // Helper: Convert hex color to RGBA
  hexToRgba(hex, alpha = 1.0) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, alpha];
  }
  
  // Helper: Interpolate between two colors
  interpolateColors(color1, color2, t) {
    const result = [];
    for (let i = 0; i < 4; i++) {
      result[i] = color1[i] + (color2[i] - color1[i]) * t;
    }
    return result;
  }
  
  // Resize canvas and update viewport
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }
  
  // Clear the canvas
  clear(color = [0, 0, 0, 0]) {
    if (!this.gl) return;
    
    this.gl.clearColor(...color);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  
  // Clean up resources
  dispose() {
    if (!this.gl) return;
    
    // Delete programs
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program);
    }
    this.programs.clear();
    
    // Delete buffers
    for (const buffer of this.buffers.values()) {
      this.gl.deleteBuffer(buffer);
    }
    this.buffers.clear();
    
    // Delete textures
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textures.clear();
    
    this.gl = null;
    this.isInitialized = false;
  }
  
  // Check if WebGL is supported
  static isSupported() {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  }
  
  // Get WebGL context info
  getInfo() {
    if (!this.gl) return null;
    
    return {
      vendor: this.gl.getParameter(this.gl.VENDOR),
      renderer: this.gl.getParameter(this.gl.RENDERER),
      version: this.gl.getParameter(this.gl.VERSION),
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      maxViewportDims: this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS)
    };
  }
}
