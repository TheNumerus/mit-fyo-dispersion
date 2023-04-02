import {Simulation, TrianglePrism, PhotonSource, Square, Movable} from "./simulation.js"
import {Renderer} from "./renderer.js";
import {CauchyDispersion} from "./dispersion.js"
import * as THREE from "three"
import {Object3D, Raycaster, Vector2} from "three"

export class Application {
    private sim: Simulation
    private raycaster: Raycaster
    private renderer: Renderer
    private canvas: HTMLCanvasElement
    private photonCountInput: HTMLInputElement
    private photonCount: HTMLSpanElement
    private maxSegmentsInput: HTMLInputElement
    private maxSegments: HTMLSpanElement
    private last: DOMHighResTimeStamp
    private selected: {obj: Movable, mesh: Object3D} | null

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
        this.photonCountInput = document.getElementById("photonCount") as HTMLInputElement
        this.photonCount = document.getElementById("photonCountSpan") as HTMLSpanElement
        this.maxSegmentsInput = document.getElementById("maxSegments") as HTMLInputElement
        this.maxSegments = document.getElementById("maxSegmentsSpan") as HTMLSpanElement

        this.photonCountInput.value = this.sim.photonsPerTick.toString()
        this.photonCount.innerText = this.sim.photonsPerTick.toString()

        this.maxSegmentsInput.value = this.sim.maxSegments.toString()
        this.maxSegments.innerText = this.sim.maxSegments.toString()

        this.photonCountInput.addEventListener("input", (e) => this.photonInputChange.call(this, e))
        this.maxSegmentsInput.addEventListener("input", (e) => this.segmentInputChange.call(this, e))
        this.canvas.addEventListener("mousemove", (e) => this.mouseMove.call(this, e))
        this.canvas.addEventListener("mousedown", (e) => this.mouseDown.call(this, e))
        this.canvas.addEventListener("mouseup", (e) => this.mouseUp.call(this, e))
        this.canvas.addEventListener("wheel", (e) => this.mouseScroll.call(this, e))
        this.canvas.width = document.body.clientWidth
        this.canvas.height = document.body.clientHeight

        this.renderer = new Renderer(this.canvas)
        this.resize()

        this.raycaster = new Raycaster()
        this.raycaster.params.Line = {threshold: 0.1}

        this.selected = null

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
        if (this.selected != null) {
            let deltaX = e.movementX / this.canvas.height * (this.renderer.camera.scale.x * 2.0)
            let deltaY = e.movementY / this.canvas.height * (this.renderer.camera.scale.y * 2.0)

            this.selected.mesh.position.x += deltaX
            this.selected.mesh.position.y -= deltaY
            this.selected.obj.position = new Vector2(deltaX, -deltaY).add(this.selected.obj.position)
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

    mouseDown (e: MouseEvent) {
        if ((e.buttons & 1) !== 0) {
            this.raycaster.setFromCamera(
                new Vector2(
                    (e.clientX / this.canvas.width) * 2 - 1,
                    -(e.clientY / this.canvas.height) * 2 + 1
                ),
                this.renderer.camera
            )
            const intersects = this.raycaster.intersectObjects(this.renderer.scene.children)

            let moved = false

            for (let i = 0; i < intersects.length; i ++ ) {
                for (const [simObj, d] of this.renderer.objects.entries()) {
                    if (intersects[i].object == d) {
                        this.selected = {obj:simObj, mesh:d}
                        moved = true
                    }
                }
            }

            if (moved) {
                this.renderer.clear()
            }
        }
    }

    mouseUp (e: MouseEvent){
        this.selected = null;
    }

    photonInputChange(e: Event) {
        this.sim.photonsPerTick = Number.parseInt(this.photonCountInput.value)
        this.photonCount.innerText = this.photonCountInput.value
        this.sim.time = 0
        this.renderer.clear()
    }

    segmentInputChange(e: Event) {
        this.sim.maxSegments = Number.parseInt(this.maxSegmentsInput.value)
        this.maxSegments.innerText = this.maxSegmentsInput.value
        this.sim.time = 0
        this.renderer.clear()
    }
}
