function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.img = this.container.querySelector("img");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    var frustumSize = 1;
    var aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      frustumSize / -2,
      frustumSize / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 2);

    this.time = 0;

    this.mouse = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vX: 0,
      vY: 0
    };

    this.isPlaying = true;
    this.settings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();

    this.mouseEvents();
  }

  getValue(val) {
    return parseFloat(this.container.getAttribute("data-" + val));
  }

  mouseEvents() {
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX / this.width;
      this.mouse.y = e.clientY / this.height;

      // console.log(this.mouse.x,this.mouse.y)

      this.mouse.vX = this.mouse.x - this.mouse.prevX;
      this.mouse.vY = this.mouse.y - this.mouse.prevY;

      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;

      // console.log(this.mouse.vX,'vx')
    });
  }

  settings() {
    let that = this;
    this.settings = {
      grid: this.getValue("grid") || 34, //generate how many grid
      mouse: this.getValue("mouse") || 0.25, //mouse radius affecting the distortion
      strength: this.getValue("strength") || 1, //higher = more parallax and distorted.
      relaxation: this.getValue("relaxation") || 0.9, //lower = faster pixel re-sorting
      aspectRatio: this.getValue("aspectRatio") || 1.77 //change aspectRatio according to your image size.
    };
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    
    // image cover
    //image Aspect depends on your image, change accordingly
    this.imageAspect = 1 / this.settings.aspectRatio;
    
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix();
    this.regenerateGrid();
  }

  regenerateGrid() {
    this.size = this.settings.grid;

    const width = this.size;
    const height = this.size;

    const size = width * height;
    const data = new Float32Array(3 * size);
    const color = new THREE.Color(0xffffff);

    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    for (let i = 0; i < size; i++) {
      let r = Math.random() * 255 - 125;
      let r1 = Math.random() * 255 - 125;

      const stride = i * 3;

      data[stride] = r;
      data[stride + 1] = r1;
      data[stride + 2] = r;
    }

    // used the buffer to create a DataTexture

    this.texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RGBFormat,
      THREE.FloatType
    );

    this.texture.magFilter = this.texture.minFilter = THREE.NearestFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.texture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  addObjects() {
    this.regenerateGrid();
    
    // 测试图片路径是否正确
    console.log("Image path:", this.img.src);
    console.log("Image exists:", this.img.complete);
    
    // 创建临时调试内容
    this.container.style.position = 'relative';
    let debugText = document.createElement('div');
    debugText.style.position = 'absolute';
    debugText.style.color = 'white';
    debugText.style.zIndex = '100';
    debugText.style.top = '10px';
    debugText.style.left = '10px';
    debugText.textContent = 'Three.js Effect Active';
    this.container.appendChild(debugText);
    
    // 确保图片已加载
    if (!this.img.complete) {
      debugText.textContent = 'Loading image...';
      console.log("Image not yet loaded, waiting...");
      this.img.onload = () => {
        debugText.textContent = 'Image loaded, initializing Three.js';
        console.log("Image loaded, initializing Three.js");
        this.initializeAfterImageLoad();
      };
      // 加载出错处理
      this.img.onerror = (e) => {
        debugText.textContent = 'Error loading image';
        console.error("Error loading image:", e);
      };
    } else {
      debugText.textContent = 'Image ready, initializing directly';
      console.log("Image ready, initializing directly");
      this.initializeAfterImageLoad();
    }
  }

  initializeAfterImageLoad() {
    // 创建备用纹理 - 以防图片加载失败
    let fallbackTexture = new THREE.TextureLoader().load(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    );
    
    // 加载图片纹理
    let texture = new THREE.TextureLoader().load(
      this.img.src, 
      (loadedTexture) => {
        console.log("Texture loaded successfully");
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        if (this.material) {
          this.material.uniforms.uTexture.value = loadedTexture;
          this.material.uniforms.uTexture.value.needsUpdate = true;
        }
      },
      (progress) => {
        console.log("Loading texture progress:", Math.round(progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error("Error loading texture:", error);
        // 使用备用纹理
        if (this.material) {
          this.material.uniforms.uTexture.value = fallbackTexture;
          this.material.uniforms.uTexture.value.needsUpdate = true;
        }
      }
    );
    
    // 定义着色器代码（与原来相同）
    let vertex = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform vec2 pixels;
    float PI = 3.141592653589793238;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;

    let fragment = `
    uniform float progress;
    uniform sampler2D uDataTexture;
    uniform sampler2D uTexture;
    
    uniform vec4 resolution;
    varying vec2 vUv;
    varying vec3 vPosition;
    float PI = 3.141592653589793238;
    void main()	{
    	vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    	vec4 color = texture2D(uTexture,newUV);
    	vec4 offset = texture2D(uDataTexture,vUv);
    	gl_FragColor = vec4(vUv,0.0,1.);
    	gl_FragColor = vec4(offset.r,0.,0.,1.);
    	gl_FragColor = color;
    	gl_FragColor = texture2D(uTexture,newUV - 0.01*offset.rg);
    	// gl_FragColor = offset;
    }`;
        
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          value: 0
        },
        resolution: {
          value: new THREE.Vector4()
        },
        uTexture: {
          value: texture
        },
        uDataTexture: {
          value: this.texture
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
    
    this.resize();
  }

  updateDataTexture() {
    let data = this.texture.image.data;
    for (let i = 0; i < data.length; i += 3) {
      data[i] *= this.settings.relaxation;
      data[i + 1] *= this.settings.relaxation;
    }

    let gridMouseX = this.size * this.mouse.x;
    let gridMouseY = this.size * (1 - this.mouse.y);
    let maxDist = this.size * this.settings.mouse;
    let aspect = this.height / this.width;

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
        let maxDistSq = maxDist ** 2;

        if (distance < maxDistSq) {
          let index = 3 * (i + this.size * j);

          let power = maxDist / Math.sqrt(distance);
          power = clamp(power, 0, 10);
          // if(distance <this.size/32) power = 1;
          // power = 1;

          data[index] += this.settings.strength * 100 * this.mouse.vX * power;
          data[index + 1] -=
            this.settings.strength * 100 * this.mouse.vY * power;
        }
      }
    }

    this.mouse.vX *= 0.9;
    this.mouse.vY *= 0.9;
    this.texture.needsUpdate = true;
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    try {
      this.updateDataTexture();
      this.material.uniforms.time.value = this.time;
    } catch (e) {
      console.error("Rendering error:", e);
    }
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the effect when document is loaded
window.addEventListener('DOMContentLoaded', () => {
  new Sketch({
    dom: document.getElementById("canvasContainer")
  });
});