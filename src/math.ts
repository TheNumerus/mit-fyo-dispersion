export class Vec2 {
    x: number;
    y: number;

    constructor(x: number = 0.0, y: number = 0.0) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other: Vec2): number {
        return Math.sqrt(Math.pow(other.x - this.x, 2.0) + Math.pow(other.y - this.y, 2.0))
    }
}
