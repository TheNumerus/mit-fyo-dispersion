import {BufferGeometry, Vector2} from "three";
import * as THREE from "three";

export class Photon {
    wavelength: number;
    position: Vector2;

    constructor(wavelength: number, position: Vector2 = new Vector2()) {
        this.wavelength = wavelength
        this.position = position
    }
}

export interface SimObject {
    geometry: BufferGeometry
}

export class TrianglePrism implements SimObject {
    position: Vector2;
    edgeLength: number;
    geometry: BufferGeometry

    constructor(position: Vector2, edgeLength: number = 1.0) {
        this.position = position;
        this.edgeLength = edgeLength;
        this.geometry = this.computeGeometry()
    }

    private computeGeometry(): BufferGeometry {
        let a = this.edgeLength
        let a2 = this.edgeLength * this.edgeLength
        let c = Math.sqrt(a2 - (a2 / 4.0))

        let arr = new Float32Array([
            this.position.x, this.position.y + 2 / 3 * c, 0.0,
            this.position.x + a / 2, this.position.y - 1 / 3 * c, 0.0,
            this.position.x - a / 2, this.position.y - 1 / 3 * c, 0.0,
            this.position.x, this.position.y + 2 / 3 * c, 0.0,
        ])

        let geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(arr, 3)
        )

        return geometry
    }
}

export class Simulation {
    objects: SimObject[]

    constructor() {
        this.objects = []
    }

    public tick(delta: number) {

    }
}
