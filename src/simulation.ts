import {BufferGeometry, Vector2} from "three";
import * as THREE from "three";
import {wavelengthToColor} from "./math.js"

export interface SimObject {
    geometry: BufferGeometry
    edges: {a: Vector2, b: Vector2}[]
}

export class TrianglePrism implements SimObject {
    position: Vector2;
    edgeLength: number;
    geometry: BufferGeometry;
    edges: {a: Vector2, b: Vector2}[];

    constructor(position: Vector2, edgeLength: number = 1.0) {
        this.position = position;
        this.edgeLength = edgeLength;
        this.edges = this.computeEdges()
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

    private computeEdges(): {a: Vector2, b: Vector2}[] {
        return []
    }
}

export class PhotonSource{
    position: Vector2;
    _rotation: number;

    get rotation() {
        return this._rotation
    }
    set rotation(newRot: number) {
        this._rotation = newRot
        this.geometry = this.computeGeometry()
    }
    geometry: BufferGeometry

    constructor(position: Vector2, rotation: number = 0.0) {
        this.position = position
        this._rotation = rotation
        this.geometry = this.computeGeometry()
    }

    public forward(): Vector2 {
        return new Vector2(Math.cos(this._rotation), Math.sin(this._rotation))
    }

    private computeGeometry(): BufferGeometry {
        let arr = new Float32Array([
            0.0, -0.05, 0.0,
            -0.1, -0.05, 0.0,
            -0.1,  0.05, 0.0,
            0.0,  0.05, 0.0,
        ])

        let geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(arr, 3)
        )
        geometry.rotateZ(this._rotation)
        geometry.translate(this.position.x, this.position.y, 0.0)

        return geometry
    }
}

export class Simulation {
    objects: SimObject[]
    sources: PhotonSource[]
    time: number
    photonsPerTick: number

    constructor() {
        this.objects = []
        this.sources = []
        this.time = 0.0
        this.photonsPerTick = 4
    }

    public tick(delta: number) {
        this.time += delta / 1000.0
    }

    public photonGeometries(): BufferGeometry[] {
        return Array<PhotonSource[]>(this.photonsPerTick).fill(this.sources).flat().map((src, i) => {
            let geo = new THREE.BufferGeometry()

            let spatialJitter = 0.001
            let noise = [(Math.random() - 0.5) * spatialJitter, (Math.random() - 0.5) * spatialJitter]

            let jitter = Math.random() * 0.01
            let phase = (this.time + i * (1.0 / this.photonsPerTick) + jitter) - Math.floor(this.time + i * (1.0 / this.photonsPerTick) + jitter)

            let points = [
                src.position.clone(),
                src.position.clone().add(src.forward().multiplyScalar(1.7)),
                src.position.clone().add(new Vector2(3.45 - phase * 0.45, (-0.5 + phase) * 0.5)),
                src.position.clone().add(new Vector2(20.0, (-0.5 + phase) * 4.3))
            ]

            let arr = new Float32Array(points.flatMap((a) => [a.x + noise[0], a.y + noise[1], 0.0]))
            geo.setAttribute(
                'position',
                new THREE.BufferAttribute(arr, 3)
            )

            let nanometers = 350 + phase * 400
            let color = wavelengthToColor(nanometers).toArray()

            let intensity = 1.0

            let colors = new Float32Array(points.flatMap(_ => color.map(i => i * intensity)))

            geo.setAttribute(
                'color',
                new THREE.BufferAttribute(colors, 3)
            )

            return geo
        })
    }
}
