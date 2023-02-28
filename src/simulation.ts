import { Vec2 } from "./math.js";

export class Photon {
    wavelength: number;
    position: Vec2;

    constructor(wavelength: number, position: Vec2 = new Vec2()) {
        this.wavelength = wavelength
        this.position = position
    }
}

export interface SimObject { }

export class TrianglePrism implements SimObject { 
    position: Vec2;
    edgeLength: number;

    constructor(position: Vec2, edgeLength: number = 1.0) {
        this.position = position;
        this.edgeLength = edgeLength;
    }
}

export class Simulation {
    objects: SimObject[]

    constructor() {
        this.objects = [
            new TrianglePrism( new Vec2(1.0, 1.0), 2.0)
        ]
    }
}
