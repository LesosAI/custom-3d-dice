class DiceFactory {
    constructor() {
        this.materials = new Map();
        this.geometries = new Map();
        this.setupMaterials();
        this.setupGeometries();
    }

    setupMaterials() {
        // Default material
        const defaultMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x111111,
            shininess: 100
        });
        this.materials.set('default', defaultMaterial);
    }

    setupGeometries() {
        this.geometries.set('d4', this.createD4Geometry());
        this.geometries.set('d6', this.createD6Geometry());
        this.geometries.set('d8', this.createD8Geometry());
        this.geometries.set('d10', this.createD10Geometry());
        this.geometries.set('d12', this.createD12Geometry());
        this.geometries.set('d20', this.createD20Geometry());
    }

    createD4Geometry() {
        const geometry = new THREE.TetrahedronGeometry(1);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    createD6Geometry() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    createD8Geometry() {
        const geometry = new THREE.OctahedronGeometry(1);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    createD10Geometry() {
        const geometry = new THREE.ConeGeometry(1, 2, 10);
        geometry.rotateX(Math.PI / 2);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    createD12Geometry() {
        const geometry = new THREE.DodecahedronGeometry(1);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    createD20Geometry() {
        const geometry = new THREE.IcosahedronGeometry(1);
        this.addTextureCoordinates(geometry);
        return geometry;
    }

    addTextureCoordinates(geometry) {
        if (!geometry.attributes.uv) {
            const positions = geometry.attributes.position.array;
            const uvs = new Float32Array(positions.length * 2/3);
            
            for (let i = 0; i < positions.length; i += 3) {
                const u = (positions[i] + 1) / 2;
                const v = (positions[i + 1] + 1) / 2;
                const index = (i / 3) * 2;
                uvs[index] = u;
                uvs[index + 1] = v;
            }
            
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        }
    }

    createDice(type, options = {}) {
        const geometry = this.geometries.get(type);
        if (!geometry) {
            throw new Error(`Invalid dice type: ${type}`);
        }

        const material = this.createMaterial(options);
        const dice = new THREE.Mesh(geometry, material);
        
        // Add physics properties
        dice.userData.velocity = new THREE.Vector3();
        dice.userData.angularVelocity = new THREE.Vector3();
        dice.userData.type = type;

        return dice;
    }

    createMaterial(options) {
        const color = options.color || 0xffffff;
        const material = this.materials.get('default').clone();
        material.color.setHex(color);
        
        if (options.texture) {
            const textureLoader = new THREE.TextureLoader();
            material.map = textureLoader.load(options.texture);
        }

        return material;
    }

    updateDiceColor(dice, color) {
        if (dice.material) {
            dice.material.color.setHex(color);
        }
    }
}

// Export for module use
export default DiceFactory; 