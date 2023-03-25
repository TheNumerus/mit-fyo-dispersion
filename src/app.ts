import {Simulation, TrianglePrism, PhotonSource} from "./simulation.js"
import {Renderer} from "./renderer.js";
import * as THREE from "three"

export class Application {
    private sim: Simulation
    private renderer: Renderer
    private canvas: HTMLCanvasElement
    private last: DOMHighResTimeStamp

    constructor() {
        this.sim = new Simulation()
        this.sim.objects.push(new TrianglePrism(new THREE.Vector2(), 3.0))
        this.sim.sources.push(new PhotonSource(new THREE.Vector2(-2.5, 0.5), -0.1))

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
