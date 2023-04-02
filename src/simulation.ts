import {BufferGeometry, Matrix3, Vector2, BufferAttribute} from "three";
import {wavelengthToColor, sign, refract} from "./math.js"
import {DispersionModel} from "./dispersion.js"

class Edge {
    a: Vector2
    b: Vector2

    constructor(a: Vector2, b: Vector2) {
        this.a = a
        this.b = b
    }

    normal() {
        let x = this.b.x - this.a.x
        let y = this.b.y - this.a.y

        return new Vector2(-y, x).normalize()
    }
}

export interface SimObject extends Movable {
    geometry: BufferGeometry
    edges: Edge[]
    dispersion: DispersionModel
}

export interface Movable {
    position: Vector2;
}

export class TrianglePrism implements SimObject, Movable {
    _position: Vector2;

    get position() {
        return this._position
    }

    set position(newPos: Vector2) {
        this._position = newPos
        this.edges = this.computeEdges()
        this.geometry = this.computeGeometry()
    }

    edgeLength: number;
    geometry: BufferGeometry;
    edges: Edge[];
    dispersion: DispersionModel

    constructor(position: Vector2, edgeLength: number = 1.0, dispersion: DispersionModel) {
        this._position = position
        this.edgeLength = edgeLength
        this.edges = this.computeEdges()
        this.geometry = this.computeGeometry()
        this.dispersion = dispersion
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

        let geometry = new BufferGeometry()
        geometry.setAttribute(
            'position',
            new BufferAttribute(arr, 3)
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
            new Edge(new Vector2(x1, y1), new Vector2(x2, y2)),
            new Edge(new Vector2(x2, y2), new Vector2(x3, y3)),
            new Edge(new Vector2(x3, y3), new Vector2(x1, y1))
        ]
    }
}

export class Square implements SimObject, Movable {
    _position: Vector2;

    get position() {
        return this._position
    }

    set position(newPos: Vector2) {
        this._position = newPos
        this.edges = this.computeEdges()
        this.geometry = this.computeGeometry()
    }

    edgeLength: number;
    geometry: BufferGeometry;
    edges: Edge[];
    dispersion: DispersionModel

    constructor(position: Vector2, edgeLength: number = 1.0, dispersion: DispersionModel) {
        this._position = position
        this.edgeLength = edgeLength
        this.edges = this.computeEdges()
        this.geometry = this.computeGeometry()
        this.dispersion = dispersion
    }

    private computeGeometry(): BufferGeometry {
        let a = this.edgeLength

        let arr = new Float32Array([
            this.position.x + a / 2, this.position.y + a / 2, 0.0,
            this.position.x + a / 2, this.position.y - a / 2, 0.0,
            this.position.x - a / 2, this.position.y - a / 2, 0.0,
            this.position.x - a / 2, this.position.y + a / 2, 0.0,
            this.position.x + a / 2, this.position.y + a / 2, 0.0,
        ])

        let geometry = new BufferGeometry()
        geometry.setAttribute(
            'position',
            new BufferAttribute(arr, 3)
        )

        return geometry
    }

    private computeEdges(): Edge[] {
        let a = this.edgeLength

        let x1 = this.position.x + a / 2
        let x2 = this.position.x - a / 2

        let y1 = this.position.y + a / 2
        let y2 = this.position.y - a / 2

        return [
            new Edge(new Vector2(x1, y1), new Vector2(x1, y2)),
            new Edge(new Vector2(x1, y2), new Vector2(x2, y2)),
            new Edge(new Vector2(x2, y2), new Vector2(x2, y1)),
            new Edge(new Vector2(x2, y1), new Vector2(x1, y1))
        ]
    }
}

export class PhotonSource implements Movable{
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

        let geometry = new BufferGeometry()
        geometry.setAttribute(
            'position',
            new BufferAttribute(arr, 3)
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
    maxSegments: number

    constructor() {
        this.objects = []
        this.sources = []
        this.time = 0.0
        this.photonsPerTick = 4
        this.maxSegments = 8
    }

    public tick(delta: number) {
        this.time += delta / 1000.0
    }

    public photonGeometries(): BufferGeometry[] {
        return Array<PhotonSource[]>(this.photonsPerTick).fill(this.sources).flat().map((src, i) => {
            i = Math.floor(i / this.sources.length)
            let geo = new BufferGeometry()

            let jitter = Math.random() * 0.01
            let phase = (this.time + i * (1.0 / this.photonsPerTick) + jitter) - Math.floor(this.time + i * (1.0 / this.photonsPerTick) + jitter)
            let nanometers = 350 + phase * 400

            let points = [src.position.clone()]
            let last = src.position.clone()
            let forward = src.forward().clone()
            for (const x of [...Array(this.maxSegments).keys()]) {
                let dstMin = 10000.0
                let point = last
                let found = false
                let newForward = forward.clone()
                for (const {edge, obj} of this.allEdges()) {
                    let normal = edge.normal()
                    let dot = Math.abs(normal.dot(forward))
                    let res = rayEdgeIntersect(last, forward, edge)
                    if (res !== null) {
                        let dst = res.point.distanceTo(last)
                        // floating point arithmetics
                        if (dstMin > dst && dst > 0.00000000000001) {
                            dstMin = dst
                            point = res.point
                            found = true

                            let ior = obj.dispersion.wavelengthToIor(nanometers)
                            if (!res.isFrontSide) {
                                ior = 1.0 / ior
                                normal = normal.multiplyScalar(-1.0)
                            }

                            newForward = refract(forward.clone(), normal, ior, dot)
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

            let arr = new Float32Array(points.flatMap((a) => [a.x, a.y, 0.0]))
            geo.setAttribute(
                'position',
                new BufferAttribute(arr, 3)
            )

            let color = wavelengthToColor(nanometers).toArray()

            let intensity = 1.0

            let colors = new Float32Array(points.flatMap(_ => color.map(i => i * intensity)))

            geo.setAttribute(
                'color',
                new BufferAttribute(colors, 3)
            )

            return geo
        })
    }

    private allEdges(): {edge: Edge, obj: SimObject}[] {
        return this.objects.map(o => o.edges.map(e => { return {edge: e, obj: o} })).flat()
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

    let isFrontSide = a.y < b.y

    let dir = b.clone().sub(a)

    let t = - (a.y) / (dir.y)

    if (t <= 0.0001) {
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
