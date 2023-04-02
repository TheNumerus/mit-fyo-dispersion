import {LineBasicMaterial, OrthographicCamera, Scene, WebGLRenderer, Line, Object3D} from "three"
import * as THREE from "three";
import {Movable, Simulation} from "./simulation"

export class Renderer {
    scene: Scene
    public objects: Map<Movable, Object3D>
    private renderer: WebGLRenderer
    public camera: OrthographicCamera
    private objectMat: LineBasicMaterial
    private photonMat: LineBasicMaterial
    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new WebGLRenderer({
            antialias: true,
            canvas: canvas,
            preserveDrawingBuffer: true,
        })

        this.renderer.outputEncoding = THREE.LinearEncoding
        this.renderer.autoClear = false
        this.renderer.setSize(canvas.width, canvas.height)

        this.scene = new Scene()

        this.objectMat = new LineBasicMaterial({color: "white"})
        this.photonMat = new LineBasicMaterial({
            vertexColors: true,
            blending: THREE.CustomBlending,
            blendEquation: THREE.MaxEquation
        })

        let aspect_ratio = canvas.width / canvas.height
        this.camera = new OrthographicCamera(
            -aspect_ratio,
            aspect_ratio,
            1.0,
            -1.0
        )
        this.camera.scale.x = 3.0
        this.camera.scale.y = 3.0
        this.camera.position.z = 1.0

        this.objects = new Map()
    }

    public render(sim: Simulation) {
        let photons = sim.photonGeometries()

        let photonObjs = [];

        for (const photon of photons) {
            let obj = new Line(photon, this.photonMat)
            this.scene.add(obj)
            photonObjs.push(obj)
        }

        for (const simObj of sim.objects) {
            let obj = this.objects.get(simObj)
            if (obj === undefined) {
                obj = new Line(simObj.geometry, this.objectMat)
                this.objects.set(simObj, obj)
                this.scene.add(obj)
            }
        }

        for (const simObj of sim.sources) {
            let obj = this.objects.get(simObj)
            if (obj === undefined) {
                obj = new Line(simObj.geometry, this.objectMat)
                this.objects.set(simObj, obj)
                this.scene.add(obj)
            }
        }

        this.renderer.render(this.scene, this.camera)

        this.scene.remove(...photonObjs)

        for (const simObj of sim.objects) {
            simObj.geometry.dispose()
        }

        for (const simObj of sim.sources) {
            simObj.geometry.dispose()
        }

        for (let p of photons) {
            p.dispose()
        }
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height)
        let aspect_ratio = width / height
        this.camera.left = -aspect_ratio
        this.camera.right = aspect_ratio
        this.camera.updateProjectionMatrix()
    }

    public clear() {
        this.renderer.clear()
    }
}