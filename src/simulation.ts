import {BufferGeometry, Vector2, Vector3} from "three";
import * as THREE from "three";

export class Photon {
    wavelength: number;
    position: Vector2;
    intensity: number;

    constructor(wavelength: number, position: Vector2 = new Vector2(), intensity: number = 1.0) {
        this.wavelength = wavelength
        this.position = position
        this.intensity = intensity
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
            0.1, -0.1, 0.0,
            -0.1, -0.1, 0.0,
            -0.1,  0.1, 0.0,
            0.1,  0.1, 0.0,
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
    photons: Photon[]
    time: number

    constructor() {
        this.objects = []
        this.sources = []
        this.photons = [new Photon(480.0, new Vector2(0.0, 0.0), 0.05)]
        this.time = 0.0
    }

    public tick(delta: number) {
        this.time += delta / 1000.0
        for (const obj of this.sources) {
        }
    }

    private phaseMap = (x: number) => Math.max(0.0, Math.min(Math.min(6.0 * x, -6.0 * x + 4.0), 1.0))
    private phaseToColor(phase: number): Vector3 {
        let r = this.phaseMap(phase - Math.floor(phase))
        let g = this.phaseMap((phase + 0.33333) - Math.floor(phase + 0.33333))
        let b = this.phaseMap((phase + 0.66666) - Math.floor(phase + 0.66666))
        return new Vector3(g, b, r)
    }

    public photonGeometries(): BufferGeometry[] {
        return Array<PhotonSource[]>(1).fill(this.sources).flat().map((src, i) => {
            let geo = new THREE.BufferGeometry()

            let noise = [(Math.random() - 0.5) * 0.0001, (Math.random() - 0.5) * 0.0001]

            let jitter = Math.random() * 0.01
            let phase = (this.time + i *.1 + jitter) - Math.floor(this.time + i * 0.1 + jitter)

            let points = [
                src.position.clone(),
                src.position.clone().add(src.forward()),
                src.position.clone().add(new Vector2(3.65 - phase * 0.85, (-0.5 + phase) * 1.5)),
                src.position.clone().add(new Vector2(20.0, (-0.5 + phase) * 40.3))
            ]
            let arr = new Float32Array(points.flatMap((a) => [a.x + noise[0], a.y + noise[1], 0.0]))

            geo.setAttribute(
                'position',
                new THREE.BufferAttribute(arr, 3)
            )

            let color = this.phaseToColor(this.time + i *.1 + jitter).toArray()

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
