import DiceFactory from './dice-factory.js';

class DiceRenderer {
    constructor(container) {
        this.container = container;
        this.diceFactory = new DiceFactory();
        this.dice = [];
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupPhysics();
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('resize', this.onWindowResize);
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 5, 15);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        this.camera.position.y = 2;
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 5, 7);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
    }

    setupPhysics() {
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.damping = 0.98;
        this.groundY = -2;
        this.bounceThreshold = 0.1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addDice(type, options = {}) {
        const dice = this.diceFactory.createDice(type, options);
        
        // Set initial position
        dice.position.set(
            Math.random() * 2 - 1,
            3,
            Math.random() * 2 - 1
        );

        // Set initial velocity
        dice.userData.velocity = new THREE.Vector3(
            Math.random() * 10 - 5,
            Math.random() * 5 + 5,
            Math.random() * 10 - 5
        );

        // Set initial rotation
        dice.userData.angularVelocity = new THREE.Vector3(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        this.dice.push(dice);
        this.scene.add(dice);
        return dice;
    }

    updatePhysics(delta) {
        for (const dice of this.dice) {
            // Update position
            dice.position.add(dice.userData.velocity.multiplyScalar(delta));
            
            // Apply gravity
            dice.userData.velocity.add(this.gravity.multiplyScalar(delta));
            
            // Apply rotation
            dice.rotation.x += dice.userData.angularVelocity.x * delta;
            dice.rotation.y += dice.userData.angularVelocity.y * delta;
            dice.rotation.z += dice.userData.angularVelocity.z * delta;

            // Ground collision
            if (dice.position.y < this.groundY) {
                dice.position.y = this.groundY;
                if (Math.abs(dice.userData.velocity.y) > this.bounceThreshold) {
                    dice.userData.velocity.y = -dice.userData.velocity.y * 0.5;
                } else {
                    dice.userData.velocity.y = 0;
                }
            }

            // Apply damping
            dice.userData.velocity.multiplyScalar(this.damping);
            dice.userData.angularVelocity.multiplyScalar(this.damping);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const delta = 1/60;
        this.updatePhysics(delta);
        
        this.renderer.render(this.scene, this.camera);
    }

    clearDice() {
        for (const dice of this.dice) {
            this.scene.remove(dice);
        }
        this.dice = [];
    }

    dispose() {
        window.removeEventListener('resize', this.onWindowResize);
        this.renderer.dispose();
        this.clearDice();
    }
}

export default DiceRenderer; 