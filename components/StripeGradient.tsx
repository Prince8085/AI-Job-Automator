import React, { useEffect, useRef } from 'react';

/*
 * Stripe WebGL Gradient Animation — faithful port of stripe.com's hero gradient.
 * Credits: Stripe.com (original) · Kevin Hufnagl (deobfuscation) · jordienr (gist).
 * A minimal WebGL implementation ("minigl") renders a tilted plane whose vertices
 * are displaced by 3D simplex noise; wave layers blend colors over the base.
 * Falls back silently (CSS mesh stays visible) when WebGL is unavailable.
 */

type RGB = [number, number, number];

const normalizeColor = (hexCode: number): RGB => [
  ((hexCode >> 16) & 255) / 255,
  ((hexCode >> 8) & 255) / 255,
  (255 & hexCode) / 255,
];

/* GLSL: normal blending (from glsl-blend) */
const BLEND_SHADER = `
vec3 blendNormal(vec3 base, vec3 blend) {
  return blend;
}
vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}`;

/* GLSL: Ashima Arts 3D simplex noise (MIT) */
const NOISE_SHADER = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`;

/* GLSL: vertex — tilts the plane, displaces with noise, blends wave-layer colors */
const VERTEX_SHADER = `
varying vec3 v_color;

void main() {
  float time = u_time * u_global.noiseSpeed;

  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;

  vec2 st = 1.0 - uvNorm.xy;

  //
  // Tilting the plane
  //

  // Front-to-back tilt
  float tilt = resolution.y / 2.0 * uvNorm.y;

  // Left-to-right angle
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;

  // Up-down shift to offset incline
  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  //
  // Vertex noise
  //

  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;

  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);

  // Clamp to 0
  noise = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y + tilt + incline + noise - offset,
    position.z
  );

  //
  // Vertex color, to be passed to fragment shader
  //

  if (u_active_colors[0] == 1.0) {
    v_color = u_baseColor;
  }

  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.0) {
      WaveLayers layer = u_waveLayers[i];

      float noise = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );

      v_color = blendNormal(v_color, layer.color, pow(noise, 4.0));
    }
  }

  //
  // Finish
  //

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

/* GLSL: fragment — optional top darkening */
const FRAGMENT_SHADER = `
varying vec3 v_color;

void main() {
  vec3 color = v_color;

  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    float g = pow(1.0 - st.y, 2.0);
    color -= g * 0.15;
  }

  gl_FragColor = vec4(color, 1.0);
}`;

/* ------------------------------------------------------------------ */
/* minigl — minimalistic WebGL engine (port of Stripe's internal lib)  */
/* ------------------------------------------------------------------ */

class MiniGl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  meshes: any[] = [];
  commonUniforms: Record<string, any>;
  width = 640;
  height = 480;

  constructor(canvas: HTMLCanvasElement, width?: number, height?: number) {
    this.canvas = canvas;
    const maybeGl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!maybeGl) throw new Error('WebGL not supported');
    const context: WebGLRenderingContext = maybeGl;
    this.gl = context;

    const self = this;

    class Material {
      uniforms: Record<string, any>;
      uniformInstances: Array<{ uniform: any; location: WebGLUniformLocation | null }> = [];
      vertexShader: WebGLShader;
      fragmentShader: WebGLShader;
      program: WebGLProgram;

      constructor(vertexShaders: string, fragments: string, uniforms: Record<string, any> = {}) {
        const getShaderByType = (type: number, source: string) => {
          const shader = context.createShader(type)!;
          context.shaderSource(shader, source);
          context.compileShader(shader);
          if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.error(context.getShaderInfoLog(shader));
          }
          return shader;
        };
        const getUniformVariableDeclarations = (uniforms: Record<string, any>, type: string) =>
          Object.entries(uniforms)
            .map(([name, uniform]) => uniform.getDeclaration(name, type))
            .join('\n');

        this.uniforms = uniforms;
        this.uniformInstances = [];

        const prefix = '\nprecision highp float;\n';
        this.vertexSource = `${prefix}
attribute vec4 position;
attribute vec2 uv;
attribute vec2 uvNorm;
${getUniformVariableDeclarations(self.commonUniforms, 'vertex')}
${getUniformVariableDeclarations(uniforms, 'vertex')}
${vertexShaders}`;

        this.fragmentSource = `${prefix}
${getUniformVariableDeclarations(self.commonUniforms, 'fragment')}
${getUniformVariableDeclarations(uniforms, 'fragment')}
${fragments}`;

        this.vertexShader = getShaderByType(context.VERTEX_SHADER, this.vertexSource);
        this.fragmentShader = getShaderByType(context.FRAGMENT_SHADER, this.fragmentSource);
        this.program = context.createProgram()!;
        context.attachShader(this.program, this.vertexShader);
        context.attachShader(this.program, this.fragmentShader);
        context.linkProgram(this.program);
        if (!context.getProgramParameter(this.program, context.LINK_STATUS)) {
          console.error(context.getProgramInfoLog(this.program));
        }
        context.useProgram(this.program);
        this.attachUniforms(undefined, self.commonUniforms);
        this.attachUniforms(undefined, this.uniforms);
      }

      vertexSource = '';
      fragmentSource = '';

      attachUniforms(name: string | undefined, uniforms: Record<string, any>) {
        if (name === undefined) {
          Object.entries(uniforms).forEach(([entryName, uniform]) => {
            this.attachUniforms(entryName, uniform);
          });
        } else if (uniforms.type === 'array') {
          (uniforms.value as any[]).forEach((uniform, i) =>
            this.attachUniforms(`${name}[${i}]`, uniform)
          );
        } else if (uniforms.type === 'struct') {
          Object.entries(uniforms.value as Record<string, any>).forEach(([structName, uniform]) =>
            this.attachUniforms(`${name}.${structName}`, uniform)
          );
        } else {
          this.uniformInstances.push({
            uniform: uniforms,
            location: context.getUniformLocation(this.program, name),
          });
        }
      }
    }

    class Uniform {
      type = 'float';
      typeFn: string;
      value: any;
      transpose: boolean = false;
      excludeFrom?: string;

      constructor(opts: any) {
        this.type = typeof opts.type === 'string' ? opts.type : 'float';
        Object.assign(this, opts);
        this.typeFn =
          ({ float: '1f', int: '1i', vec2: '2fv', vec3: '3fv', vec4: '4fv', mat4: 'Matrix4fv' } as Record<string, string>)[
            this.type
          ] || '1f';
        // No location yet — mirror Stripe's original behavior (location treated as null → no-op)
        this.update(undefined);
      }

      update(location?: WebGLUniformLocation | null) {
        if (this.value === undefined) return;
        const isMatrix = this.typeFn.indexOf('Matrix') === 0;
        if (isMatrix) {
          context.uniformMatrix4fv(location ?? null, this.transpose ?? false, this.value);
        } else {
          (context as any)[`uniform${this.typeFn}`](location ?? null, this.value);
        }
      }

      getDeclaration(name: string, type: string, length = 0): string | undefined {
        if (this.excludeFrom === type) return undefined;
        if (this.type === 'array') {
          return (
            (this.value[0] as Uniform).getDeclaration(name, type, (this.value as any[]).length) +
            `\nconst int ${name}_length = ${(this.value as any[]).length};`
          );
        }
        if (this.type === 'struct') {
          let nameNoPrefix = name.replace('u_', '');
          nameNoPrefix = nameNoPrefix.charAt(0).toUpperCase() + nameNoPrefix.slice(1);
          return (
            `uniform struct ${nameNoPrefix}\n{\n` +
            Object.entries(this.value as Record<string, any>)
              .map(([structName, structUniform]) =>
                (structUniform as Uniform).getDeclaration(structName, type)!.replace(/^uniform/, '')
              )
              .join('') +
            `\n} ${name}${length > 0 ? `[${length}]` : ''};`
          );
        }
        return `uniform ${this.type} ${name}${length > 0 ? `[${length}]` : ''};`;
      }
    }

    class PlaneGeometry {
      attributes: Record<string, InstanceType<typeof Attribute>>;
      xSegCount = 0;
      ySegCount = 0;
      vertexCount = 0;
      quadCount = 0;
      width = 0;
      height = 0;

      constructor(width = 1, height = 1, n = 1, i = 1, orientation = 'xz') {
        this.attributes = {
          position: new Attribute({ target: context.ARRAY_BUFFER, size: 3 }),
          uv: new Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          uvNorm: new Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
          index: new Attribute({ target: context.ELEMENT_ARRAY_BUFFER, size: 3, type: context.UNSIGNED_SHORT }),
        };
        this.setTopology(n, i);
        this.setSize(width, height, orientation);
      }

      setTopology(e = 1, t = 1) {
        this.xSegCount = e;
        this.ySegCount = t;
        this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
        this.quadCount = this.xSegCount * this.ySegCount * 2;
        this.attributes.uv.values = new Float32Array(2 * this.vertexCount);
        this.attributes.uvNorm.values = new Float32Array(2 * this.vertexCount);
        this.attributes.index.values = new Uint16Array(3 * this.quadCount);
        for (let y = 0; y <= this.ySegCount; y++) {
          for (let x = 0; x <= this.xSegCount; x++) {
            const i = y * (this.xSegCount + 1) + x;
            this.attributes.uv.values![2 * i] = x / this.xSegCount;
            this.attributes.uv.values![2 * i + 1] = 1 - y / this.ySegCount;
            this.attributes.uvNorm.values![2 * i] = (x / this.xSegCount) * 2 - 1;
            this.attributes.uvNorm.values![2 * i + 1] = 1 - (y / this.ySegCount) * 2;
            if (x < this.xSegCount && y < this.ySegCount) {
              const s = y * this.xSegCount + x;
              this.attributes.index.values![6 * s] = i;
              this.attributes.index.values![6 * s + 1] = i + 1 + this.xSegCount;
              this.attributes.index.values![6 * s + 2] = i + 1;
              this.attributes.index.values![6 * s + 3] = i + 1;
              this.attributes.index.values![6 * s + 4] = i + 1 + this.xSegCount;
              this.attributes.index.values![6 * s + 5] = i + 2 + this.xSegCount;
            }
          }
        }
        this.attributes.uv.update();
        this.attributes.uvNorm.update();
        this.attributes.index.update();
      }

      setSize(width = 1, height = 1, orientation = 'xz') {
        this.width = width;
        this.height = height;
        if (
          !this.attributes.position.values ||
          this.attributes.position.values.length !== 3 * this.vertexCount
        ) {
          this.attributes.position.values = new Float32Array(3 * this.vertexCount);
        }
        const o = width / -2;
        const r = height / -2;
        const segmentWidth = width / this.xSegCount;
        const segmentHeight = height / this.ySegCount;
        for (let yIndex = 0; yIndex <= this.ySegCount; yIndex++) {
          const t = r + yIndex * segmentHeight;
          for (let xIndex = 0; xIndex <= this.xSegCount; xIndex++) {
            const x = o + xIndex * segmentWidth;
            const l = yIndex * (this.xSegCount + 1) + xIndex;
            this.attributes.position.values![3 * l + 'xyz'.indexOf(orientation[0])] = x;
            this.attributes.position.values![3 * l + 'xyz'.indexOf(orientation[1])] = -t;
          }
        }
        this.attributes.position.update();
      }
    }

    class Mesh {
      wireframe = false;
      attributeInstances: Array<{ attribute: InstanceType<typeof Attribute>; location: number }> = [];

      constructor(geometry: PlaneGeometry, material: Material) {
        Object.entries(geometry.attributes).forEach(([name, attribute]) => {
          this.attributeInstances.push({
            attribute,
            location: attribute.attach(name, material.program),
          });
        });
        self.meshes.push(this);
      }

      draw() {
        context.useProgram(this.material!.program);
        this.material!.uniformInstances.forEach(({ uniform, location }) => uniform.update(location));
        this.attributeInstances.forEach(({ attribute, location }) => attribute.use(location));
        context.drawElements(
          this.wireframe ? context.LINES : context.TRIANGLES,
          this.geometry!.attributes.index.values!.length,
          context.UNSIGNED_SHORT,
          0
        );
      }

      material?: Material;
      geometry?: PlaneGeometry;

      remove() {
        self.meshes = self.meshes.filter((m) => m !== this);
      }
    }

    class Attribute {
      target: number = context.ARRAY_BUFFER;
      size: number = 0;
      type: number;
      normalized = false;
      buffer: WebGLBuffer;
      values?: Float32Array | Uint16Array;

      constructor(opts: { target: number; size: number; type?: number }) {
        this.type = context.FLOAT;
        this.normalized = false;
        this.buffer = context.createBuffer()!;
        Object.assign(this, opts);
        this.update();
      }

      update() {
        if (this.values === undefined) return;
        context.bindBuffer(this.target, this.buffer);
        context.bufferData(this.target, this.values, context.STATIC_DRAW);
      }

      attach(name: string, program: WebGLProgram) {
        const loc = context.getAttribLocation(program, name);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(loc);
          context.vertexAttribPointer(loc, this.size, this.type, this.normalized, 0, 0);
        }
        return loc;
      }

      use(loc: number) {
        context.bindBuffer(this.target, this.buffer);
        if (this.target === context.ARRAY_BUFFER) {
          context.enableVertexAttribArray(loc);
          context.vertexAttribPointer(loc, this.size, this.type, this.normalized, 0, 0);
        }
      }
    }

    (this as any).Material = Material;
    (this as any).Uniform = Uniform;
    (this as any).PlaneGeometry = PlaneGeometry;
    (this as any).Mesh = Mesh;
    (this as any).Attribute = Attribute;

    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.commonUniforms = {
      projectionMatrix: new Uniform({ type: 'mat4', value: identity }),
      modelViewMatrix: new Uniform({ type: 'mat4', value: identity }),
      resolution: new Uniform({ type: 'vec2', value: [1, 1] }),
      aspectRatio: new Uniform({ type: 'float', value: 1 }),
    };

    if (width && height) this.setSize(width, height);
  }

  setSize(width = 640, height = 480) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.commonUniforms.resolution.value = [width, height];
    this.commonUniforms.aspectRatio.value = width / height;
  }

  setOrthographicCamera(e = 0, t = 0, n = 0, i = -2000, s = 2000) {
    this.commonUniforms.projectionMatrix.value = [
      2 / this.width, 0, 0, 0,
      0, 2 / this.height, 0, 0,
      0, 0, 2 / (i - s), 0,
      e, t, n, 1,
    ];
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((m) => m.draw());
  }
}

/* ------------------------------------------------------------------ */
/* Gradient — animation controller                                     */
/* ------------------------------------------------------------------ */

class StripeGradientAnimation {
  private el: HTMLCanvasElement;
  private colors: string[];
  private t = 1253106;
  private last = 0;
  private width = 0;
  private height = 600;
  private angle = 0;
  private seed = 5;
  private freqX = 14e-5;
  private freqY = 29e-5;
  private playing = false;
  private rafId = 0;
  private minigl!: MiniGl;
  private geometry!: any;
  private material!: any;
  private uniforms: Record<string, any> = {};
  private sectionColors: number[] = [];

  constructor(canvas: HTMLCanvasElement, colors: string[]) {
    this.el = canvas;
    this.colors = colors.slice(0, 4); // base + up to 3 wave layers (u_active_colors is vec4)
  }

  init() {
    this.initColors();
    this.height = Math.max(this.el.clientHeight, 320);
    this.width = this.el.clientWidth || window.innerWidth;

    this.minigl = new MiniGl(this.el);
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();

    const xSegCount = Math.ceil(this.width * 0.06);
    const ySegCount = Math.ceil(this.height * 0.16);
    this.geometry = new (this.minigl as any).PlaneGeometry();
    this.buildUniforms(xSegCount, ySegCount);
    // Vertex shader depends on the simplex-noise + blend GLSL helpers
    // (same concatenation order as Stripe's shaderFiles pipeline).
    const vertexSource = `${NOISE_SHADER}\n${BLEND_SHADER}\n${VERTEX_SHADER}`;
    this.material = new (this.minigl as any).Material(vertexSource, FRAGMENT_SHADER, this.uniforms);
    void new (this.minigl as any).Mesh(this.geometry, this.material); // registers itself in minigl.meshes
    this.resize();

    window.addEventListener('resize', this.resize);
    requestAnimationFrame(() => this.el.classList.add('isLoaded'));
    return this;
  }

  private initColors() {
    const defaults = ['#e6e6fa', '#533afd', '#ea2261', '#f96bee'];
    const source = this.colors.length >= 2 ? this.colors : defaults;
    this.sectionColors = source.map((hex) => parseInt(hex.replace('#', ''), 16));
  }

  private buildUniforms(xSegCount: number, ySegCount: number) {
    const U = (this.minigl as any).Uniform;

    this.uniforms = {
      u_time: new U({ value: 0 }),
      u_shadow_power: new U({ value: 6 }),
      u_darken_top: new U({ value: 0 }),
      u_active_colors: new U({ type: 'vec4', value: [1, 1, 1, 1] }),
      u_global: new U({
        type: 'struct',
        value: {
          noiseFreq: new U({ type: 'vec2', value: [this.freqX, this.freqY] }),
          noiseSpeed: new U({ value: 5e-6 }),
        },
      }),
      u_vertDeform: new U({
        type: 'struct',
        excludeFrom: 'fragment',
        value: {
          incline: new U({ value: Math.sin(this.angle) / Math.cos(this.angle) }),
          offsetTop: new U({ value: -0.6333 }),
          offsetBottom: new U({ value: -0.6333 }),
          noiseFreq: new U({ type: 'vec2', value: [3, 4] }),
          noiseAmp: new U({ value: 320 }),
          noiseSpeed: new U({ value: 700 }),
          noiseFlow: new U({ value: 6.6 }),
          noiseSeed: new U({ value: this.seed }),
        },
      }),
      u_baseColor: new U({
        type: 'vec3',
        excludeFrom: 'fragment',
        value: normalizeColor(this.sectionColors[0]),
      }),
      u_waveLayers: new U({ type: 'array', excludeFrom: 'fragment', value: [] }),
    };

    for (let i = 1; i < this.sectionColors.length; i++) {
      this.uniforms.u_waveLayers.value.push(
        new U({
          type: 'struct',
          value: {
            color: new U({ type: 'vec3', value: normalizeColor(this.sectionColors[i]) }),
            noiseFreq: new U({
              type: 'vec2',
              value: [2 + i / this.sectionColors.length, 3 + i / this.sectionColors.length],
            }),
            noiseSpeed: new U({ value: 11 + 0.3 * i }),
            noiseFlow: new U({ value: 6.5 + 0.3 * i }),
            noiseSeed: new U({ value: this.seed + 10 * i }),
            noiseFloor: new U({ value: 0.1 }),
            noiseCeil: new U({ value: 0.63 + 0.07 * i }),
          },
        })
      );
    }

    void xSegCount;
    void ySegCount;
  }

  private resize = () => {
    this.width = this.el.clientWidth || window.innerWidth;
    this.height = Math.max(this.el.clientHeight, 320);
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();
    this.geometry.setTopology(Math.ceil(this.width * 0.06), Math.ceil(this.height * 0.16));
    this.geometry.setSize(this.width, this.height);
    this.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
  };

  private animate = (e: number) => {
    this.t += Math.min(e - this.last, 1000 / 15);
    this.last = e;
    this.material.uniforms.u_time.value = this.t;
    this.minigl.render();
    if (this.playing) this.rafId = requestAnimationFrame(this.animate);
  };

  renderStatic() {
    this.last = performance.now();
    this.material.uniforms.u_time.value = this.t;
    this.minigl.render();
  }

  play = () => {
    if (this.playing) return;
    this.playing = true;
    this.rafId = requestAnimationFrame(this.animate);
  };

  pause = () => {
    this.playing = false;
    cancelAnimationFrame(this.rafId);
  };

  destroy() {
    this.pause();
    window.removeEventListener('resize', this.resize);
    this.el.classList.remove('isLoaded');
    // NOTE: deliberately NOT calling WEBGL_lose_context here.
    // React StrictMode double-invokes effects on the SAME canvas node —
    // losing the context would leave the second mount with a dead context
    // (getContext returns the same lost context for a canvas). The context
    // is freed when the canvas element is garbage-collected.
  }
}

/* ------------------------------------------------------------------ */
/* React component                                                     */
/* ------------------------------------------------------------------ */

interface StripeGradientProps {
  /** 4 hex colors: base + 3 wave layers */
  colors: string[];
  className?: string;
}

const StripeGradient: React.FC<StripeGradientProps> = ({ colors, className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const gradientRef = useRef<StripeGradientAnimation | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    try {
      const gradient = new StripeGradientAnimation(canvas, colors).init();
      gradientRef.current = gradient;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        gradient.renderStatic();
        return () => gradient.destroy();
      }

      gradient.play();

      // Pause the rAF loop while the hero is off-screen (saves battery/CPU)
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) gradient.play();
          else gradient.pause();
        },
        { threshold: 0 }
      );
      io.observe(canvas);

      return () => {
        io.disconnect();
        gradient.destroy();
      };
    } catch {
      // WebGL unavailable — the CSS gradient-mesh fallback stays visible.
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={`lp-gradient-canvas ${className}`} aria-hidden="true" />;
};

export default StripeGradient;
