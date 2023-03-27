import {Simulation, TrianglePrism, PhotonSource, Square} from "./simulation.js"
import {Renderer} from "./renderer.js";
import {CauchyDispersion} from "./dispersion.js"
import * as THREE from "three"

export class Application {
    private sim: Simulation
    private renderer: Renderer
    private canvas: HTMLCanvasElement
    private last: DOMHighResTimeStamp

    constructor() {
        let dispersionModel = new CauchyDispersion(1.52, 20)
        let noModel = new CauchyDispersion(1.2, 8000000)

        this.sim = new Simulation()
        this.sim.objects.push(new TrianglePrism(new THREE.Vector2(), 3.0, dispersionModel))
        this.sim.objects.push(new TrianglePrism(new THREE.Vector2(0.0, 2.2), 1.3, dispersionModel))
        this.sim.objects.push(new Square(new THREE.Vector2(1.8, 0.3), 1.0, noModel))
        this.sim.sources.push(new PhotonSource(new THREE.Vector2(-2.0, -0.0), 0.4))
        this.sim.sources.push(new PhotonSource(new THREE.Vector2(-0.5, 2.5), -1.6))

        this.canvas = document.getElementById("canvas") as HTMLCanvasElement
        this.canvas.addEventListener("mousemove", (e) => this.mouseMove.call(this, e))
        this.canvas.addEventListener("wheel", (e) => this.mouseScroll.call(this, e))
        this.canvas.width = document.body.clientWidth
        this.canvas.height = document.body.clientHeight

        this.renderer = new Renderer(this.canvas)
        this.resize()

        this.last = 0
    }

    resize() {
        this.canvas.width = document.body.clientWidth
        this.canvas.height = document.body.clientHeight
        this.renderer.resize(document.body.clientWidth,  document.body.clientHeight)
    }

    render() {
        this.renderer.render(this.sim)
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
            this.renderer.camera.position.x -= e.movementX / this.canvas.height * (this.renderer.camera.scale.x * 2.0)
            this.renderer.camera.position.y += e.movementY / this.canvas.height * (this.renderer.camera.scale.y * 2.0)
            this.renderer.clear()
        }
    }

    mouseScroll(e: WheelEvent) {
        let scale = this.renderer.camera.scale.x
        scale = Math.max(0.1, scale + e.deltaY / 1000)
        this.renderer.camera.scale.x = scale
        this.renderer.camera.scale.y = scale
        this.renderer.clear()
    }
}
