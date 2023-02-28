import { fill } from "./renderer.js"
import { Simulation } from "./simulation.js";

window.onload = (e) => init()
window.onresize = (e) => resize()

function init() {
    repaint()

    let sim = new Simulation()
}

function resize() {
    repaint()
}

function repaint() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const context = canvas.getContext("2d")

    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight

    if (context === null) {
        throw new Error("Error getting context")
    }

    fill(canvas, context, "black")
    context.font = "20px Iosevka"
    context.textBaseline = "top"
    context.fillStyle = "white"
    context.fillText("Dispersion canvas", 10, 10)
}
