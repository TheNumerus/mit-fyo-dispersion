export function fill(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, color: string) {
    let x = canvas.clientWidth
    let y = canvas.clientHeight

    context.fillStyle = color;
    context.fillRect(0, 0, x, y)
}
