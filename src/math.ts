import {Matrix3, Vector3} from "three"

const xyzToRgb = new Matrix3()
xyzToRgb.set(
    3.2406, -1.5372, -0.4986,
    -0.9689, 1.8758, 0.0415,
    0.0557, -0.204, 1.0570,
)

function g(x: number, center: number, spreadLeft: number, spreadRight: number) {
    if (x < center) {
        return Math.pow(Math.E, -0.5 * Math.pow( (x - center) * spreadLeft, 2.0));
    } else {
        return Math.pow(Math.E, -0.5 * Math.pow((x - center) * spreadRight, 2.0));
    }
}

function gammaCompression(c: number): number {
    if (c <= .0031308) {
        return 12.92 * c
    } else {
        return 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    }
}

export function wavelengthToColor(wl: number): Vector3 {
    let x = 1.056 * g(wl, 599.8, 0.0264, 0.0323)
          + 0.362 * g(wl, 442.0, 0.0624, 0.0374)
          - 0.065 * g(wl, 501.1, 0.0490, 0.0382)
    let y = 0.821 * g(wl, 568.8, 0.0213, 0.0247)
          + 0.286 * g(wl, 530.9, 0.0613, 0.0322)
    let z = 1.217 * g(wl, 437.0, 0.0845, 0.0278)
          + 0.681 * g(wl, 459.0, 0.0385, 0.0725)

    let rgb = new Vector3(x, y, z).applyMatrix3(xyzToRgb)

    return new Vector3(
        gammaCompression(rgb.x),
        gammaCompression(rgb.y),
        gammaCompression(rgb.z)
    )
}

export function sign(n: number) {
    if (n > 0.0) {
        return 1
    } else if (n < 0.0) {
        return -1
    } else {
        return 0;
    }
}