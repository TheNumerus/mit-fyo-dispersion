import {SPECTRAL_LONG, SPECTRAL_MEDIUM, SPECTRAL_SHORT, SPECTRAL_SODIUM_D} from "./math.js"

export interface DispersionModel {
    /**
     * Returns index of refraction for given wavelength
     * @param wavelength in nanometers
     */
    wavelengthToIor(wavelength: number): number
}

export class CauchyDispersion implements DispersionModel {
    A: number
    B: number

    constructor(iorSodiumD: number, abbe: number) {
        let getAfromB = (B: number) => {return iorSodiumD - B / Math.pow(SPECTRAL_SODIUM_D / 1000, 2.0)}

        let d = Math.pow(SPECTRAL_LONG / 1000, 2.0) - Math.pow(SPECTRAL_SHORT / 1000, 2.0)
        let m = Math.pow(SPECTRAL_LONG / 1000, 2.0) * Math.pow(SPECTRAL_SHORT / 1000, 2.0)
        let d2 = Math.pow(SPECTRAL_MEDIUM / 1000, 2.0) - Math.pow(SPECTRAL_SODIUM_D / 1000, 2.0)

        this.B = (iorSodiumD * m - m) / (abbe * d - m * d2)

        this.A = getAfromB(this.B)
    }

    wavelengthToIor(wavelength: number): number {
        return this.A + (this.B / Math.pow(wavelength / 1000.0, 2.0))
    }
}