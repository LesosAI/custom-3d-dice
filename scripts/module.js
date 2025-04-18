// Constants for version compatibility
const MIN_CORE_VERSION = 11;
const MAX_CORE_VERSION = 12;

class Custom3DDice {
    static ID = 'custom-3d-dice';

    static initialize() {
        try {
            this.checkCompatibility();
            this.checkWebGLSupport();
            this.checkDependencies();
            this.registerSettings();
            this.setupHooks();
            console.log(`${this.ID} | Initialized successfully`);
        } catch (error) {
            console.error(`${this.ID} | Initialization failed:`, error);
            ui.notifications.error(game.i18n.localize('CUSTOM3DDICE.Errors.InitializationFailed'));
        }
    }

    static checkCompatibility() {
        const currentVersion = parseInt(game.version);
        if (currentVersion < MIN_CORE_VERSION) {
            throw new Error(game.i18n.format('CUSTOM3DDICE.Errors.VersionTooOld', {
                min: MIN_CORE_VERSION,
                current: currentVersion
            }));
        }
        if (currentVersion > MAX_CORE_VERSION) {
            console.warn(game.i18n.format('CUSTOM3DDICE.Errors.VersionNotVerified', {
                current: currentVersion,
                max: MAX_CORE_VERSION
            }));
        }
    }

    static checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            throw new Error(game.i18n.localize('CUSTOM3DDICE.Errors.WebGLNotSupported'));
        }
    }

    static checkDependencies() {
        if (typeof THREE === 'undefined') {
            throw new Error(game.i18n.localize('CUSTOM3DDICE.Errors.ThreeJSNotLoaded'));
        }
        if (!game.socket) {
            throw new Error(game.i18n.localize('CUSTOM3DDICE.Errors.SocketNotAvailable'));
        }
    }

    static registerSettings() {
        game.settings.register(this.ID, 'enableAnimations', {
            name: game.i18n.localize('CUSTOM3DDICE.Settings.EnableAnimations.Name'),
            hint: game.i18n.localize('CUSTOM3DDICE.Settings.EnableAnimations.Hint'),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.ID, 'diceColor', {
            name: game.i18n.localize('CUSTOM3DDICE.Settings.DiceColor.Name'),
            hint: game.i18n.localize('CUSTOM3DDICE.Settings.DiceColor.Hint'),
            scope: 'client',
            config: true,
            type: String,
            default: '#FFFFFF'
        });
    }

    static setupHooks() {
        Hooks.on('ready', this.onReady.bind(this));
        game.socket.on(`module.${this.ID}`, this.onSocketMessage.bind(this));
    }

    static onReady() {
        this.setupDiceRenderer();
        this.registerDiceTypes();
    }

    static onSocketMessage(data) {
        try {
            if (!data || !data.type) return;
            
            switch (data.type) {
                case 'rollRequest':
                    this.handleRollRequest(data);
                    break;
                case 'rollResult':
                    this.handleRollResult(data);
                    break;
                default:
                    console.warn(`${this.ID} | Unknown socket message type:`, data.type);
            }
        } catch (error) {
            console.error(`${this.ID} | Socket message handling error:`, error);
        }
    }

    static setupDiceRenderer() {
        // Initialize Three.js scene and renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);
        
        // Set up camera position
        this.camera.position.z = 5;
    }

    static registerDiceTypes() {
        this.diceTypes = {
            d4: { faces: 4, geometry: this.createD4Geometry() },
            d6: { faces: 6, geometry: this.createD6Geometry() },
            d8: { faces: 8, geometry: this.createD8Geometry() },
            d10: { faces: 10, geometry: this.createD10Geometry() },
            d12: { faces: 12, geometry: this.createD12Geometry() },
            d20: { faces: 20, geometry: this.createD20Geometry() }
        };
    }

    static createD4Geometry() {
        return new THREE.TetrahedronGeometry(1);
    }

    static createD6Geometry() {
        return new THREE.BoxGeometry(1, 1, 1);
    }

    static createD8Geometry() {
        return new THREE.OctahedronGeometry(1);
    }

    static createD10Geometry() {
        // Simplified d10 using custom geometry
        const geometry = new THREE.ConeGeometry(1, 2, 10);
        geometry.rotateX(Math.PI / 2);
        return geometry;
    }

    static createD12Geometry() {
        return new THREE.DodecahedronGeometry(1);
    }

    static createD20Geometry() {
        return new THREE.IcosahedronGeometry(1);
    }

    static async rollDice(diceType, quantity = 1, options = {}) {
        try {
            if (!this.diceTypes[diceType]) {
                throw new Error(game.i18n.format('CUSTOM3DDICE.Errors.InvalidDiceType', { type: diceType }));
            }

            const rollData = {
                type: 'rollRequest',
                diceType,
                quantity,
                options,
                userId: game.user.id,
                timestamp: Date.now()
            };

            await this.safeSocketEmit(rollData);
            return this.performRoll(rollData);
        } catch (error) {
            console.error(`${this.ID} | Roll error:`, error);
            ui.notifications.error(error.message);
            return null;
        }
    }

    static async safeSocketEmit(data) {
        if (!game.socket?.emit) {
            throw new Error(game.i18n.localize('CUSTOM3DDICE.Errors.SocketNotAvailable'));
        }
        return game.socket.emit(`module.${this.ID}`, data);
    }

    static async performRoll(rollData) {
        const results = [];
        const { diceType, quantity } = rollData;
        const diceConfig = this.diceTypes[diceType];

        for (let i = 0; i < quantity; i++) {
            const result = Math.floor(Math.random() * diceConfig.faces) + 1;
            results.push(result);
        }

        if (game.settings.get(this.ID, 'enableAnimations')) {
            await this.animateRoll(diceType, results);
        }

        return {
            results,
            total: results.reduce((sum, val) => sum + val, 0),
            diceType,
            quantity
        };
    }

    static async animateRoll(diceType, results) {
        // Animation implementation
        return new Promise(resolve => {
            // Add animation logic here
            setTimeout(resolve, 1000); // Temporary animation duration
        });
    }
}

Hooks.once('init', () => {
    Custom3DDice.initialize();
}); 