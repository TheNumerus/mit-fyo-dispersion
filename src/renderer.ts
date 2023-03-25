import {LineBasicMaterial, OrthographicCamera, Scene, WebGLRenderer, Line} from "three";
import * as THREE from "three";
import {Simulation} from "./simulation";

export class Renderer {
    private scene: Scene
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
    }

    public render(sim: Simulation) {
        this.scene.clear()

        for (const photon of sim.photonGeometries()) {
            let obj = new Line(photon, this.photonMat)
            this.scene.add(obj)
        }

        for (const simObj of sim.objects) {
            let obj = new Line(simObj.geometry, this.objectMat)
            this.scene.add(obj)
        }

        for (const simObj of sim.sources) {
            let obj = new Line(simObj.geometry, this.objectMat)
            this.scene.add(obj)
        }

        this.renderer.render(this.scene, this.camera)
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