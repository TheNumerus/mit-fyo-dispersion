import {BufferGeometry, Matrix3, Vector2} from "three";
import * as THREE from "three";
import {wavelengthToColor, sign} from "./math.js"

interface Edge {
    a: Vector2
    b: Vector2
}

export interface SimObject {
    geometry: BufferGeometry
    edges: Edge[]
    ior: number
}

export class TrianglePrism implements SimObject {
    position: Vector2;
    edgeLength: number;
    geometry: BufferGeometry;
    edges: Edge[];
    ior: number;

    constructor(position: Vector2, edgeLength: number = 1.0, ior: number = 1.333) {
        this.position = position
        this.edgeLength = edgeLength
        this.edges = this.computeEdges()
        this.geometry = this.computeGeometry()
        this.ior = ior
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

    private computeEdges(): Edge[] {
        let a = this.edgeLength
        let a2 = this.edgeLength * this.edgeLength
        let c = Math.sqrt(a2 - (a2 / 4.0))

        let x1 = this.position.x
        let x2 = this.position.x + a / 2
        let x3 = this.position.x - a / 2

        let y1 = this.position.y + 2 / 3 * c
        let y2 = this.position.y - 1 / 3 * c
        let y3 = y2

        return [
            {a: new Vector2(x1, y1), b: new Vector2(x2, y2)},
            {a: new Vector2(x2, y2), b: new Vector2(x3, y3)},
            {a: new Vector2(x3, y3), b: new Vector2(x1, y1)}
        ]
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
            let geo = new BufferGeometry()

            let spatialJitter = 0.001
            let noise = [(Math.random() - 0.5) * spatialJitter, (Math.random() - 0.5) * spatialJitter]

            let jitter = Math.random() * 0.01
            let phase = (this.time + i * (1.0 / this.photonsPerTick) + jitter) - Math.floor(this.time + i * (1.0 / this.photonsPerTick) + jitter)

            let points = [src.position.clone()]
            let last = src.position.clone()
            let forward = src.forward().clone()
            for (const x of [...Array(8).keys()]) {
                let dstMin = 10000.0
                let point = last
                let found = false
                let newForward = forward.clone()
                for (const edge of this.allEdges()) {
                    let res = rayEdgeIntersect(last, forward, edge)
                    if (res !== null) {
                        let dst = res.point.distanceTo(last)
                        if (dstMin > dst && dst > 0.0001) {
                            dstMin = dst
                            point = res.point
                            found = true
                            // TODO compute ior
                            newForward = forward.clone().rotateAround(new Vector2(), (phase - 0.5) * 0.1)
                        }
                    }
                }
                if (found) {
                    last = point.clone()
                    points.push(point)
                    forward = newForward
                } else {
                    points.push(last.add(forward.multiplyScalar(20.0)))
                    break
                }
            }

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

    private allEdges(): Edge[] {
        return this.objects.flatMap(o => o.edges)
    }
}

type IntersectResult = {point: Vector2, isFrontSide: boolean} | null

function rayEdgeIntersect(origin: Vector2, direction: Vector2, edge: Edge): IntersectResult {
    let a = edge.a.clone().sub(origin)
    let b = edge.b.clone().sub(origin)

    let theta = direction.angle()
    let rot = new Matrix3().makeRotation(-theta)

    a = a.applyMatrix3(rot)
    b = b.applyMatrix3(rot)

    if (sign(a.y) == sign(b.y)) {
        return null
    }

    let isFrontSide = a.y > b.y

    let dir = b.clone().sub(a)

    let t = - (a.y) / (dir.y)

    if (t <= 0.001) {
        return null
    }

    let point = new Vector2(a.x + dir.x * t, 0.0)
    if (point.x < 0.0) {
        return null
    }
    point.applyMatrix3(new Matrix3().makeRotation(theta))
    point.add(origin)

    return {point, isFrontSide}
}
