import {Simulation, TrianglePrism} from "./simulation.js"
import * as THREE from "three"

export class Application {
    private sim: Simulation
    private canvas: HTMLCanvasElement
    private renderer: THREE.WebGLRenderer
    private camera: THREE.OrthographicCamera
    private last: DOMHighResTimeStamp

    constructor() {
        this.sim = new Simulation()
        this.sim.objects.push(new TrianglePrism(new THREE.Vector2(), 3.0))

        this.canvas = document.getElementById("canvas") as HTMLCanvasElement
        this.canvas.addEventListener("mousemove", (e) => this.mouseMove.call(this, e))
        this.canvas.addEventListener("wheel", (e) => this.mouseScroll.call(this, e))

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            preserveDrawingBuffer: true,
        })
        this.renderer.autoClear = false

        this.resize()

        let aspect_ratio = this.canvas.width / this.canvas.height
        this.camera = new THREE.OrthographicCamera(
            -aspect_ratio,
            aspect_ratio,
            1.0,
            -1.0
        )
        this.camera.scale.x = 3.0
        this.camera.scale.y = 3.0
        this.camera.position.z = 1.0
        this.last = 0
    }

    reset() {
        this.sim = new Simulation()
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement
    }

    resize() {
        this.renderer.setSize(document.body.clientWidth, document.body.clientHeight)
        this.canvas.width = document.body.clientWidth
        this.canvas.height = document.body.clientHeight
        let aspect_ratio = this.canvas.width / this.canvas.height

        if (this.camera != undefined) {
            this.camera.left = -aspect_ratio
            this.camera.right = aspect_ratio
            this.camera.updateProjectionMatrix()
        }
    }

    render() {
        let scene = new THREE.Scene()
        let material = new THREE.LineBasicMaterial({color: "white"})

        for (const simObj of this.sim.objects) {
            let obj = new THREE.Line(simObj.geometry, material)
            scene.add(obj)
        }
        this.renderer.render(scene, this.camera)
    }

    run() {
        requestAnimationFrame((c) => this.tick.call(this, c))
    }

    tick(timestamp: DOMHighResTimeStamp) {
        let delta = timestamp - this.last
        this.last = timestamp
        this.sim.tick(delta)
        this.render()
        requestAnimationFrame((c) => this.tick.call(this, c))
    }

    mouseMove(e: MouseEvent) {
        if ((e.buttons & 2) !== 0) {
            this.camera.position.x -= e.movementX / this.canvas.height * (this.camera.scale.x * 2.0)
            this.camera.position.y += e.movementY / this.canvas.height * (this.camera.scale.y * 2.0)
        }
    }

    mouseScroll(e: WheelEvent) {
        this.camera.scale.x += e.deltaY / 1000
        this.camera.scale.y += e.deltaY / 1000
    }
}