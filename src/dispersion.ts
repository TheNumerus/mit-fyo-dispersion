import {SPECTRAL_LONG, SPECTRAL_MEDIUM, SPECTRAL_SHORT, SPECTRAL_SODIUM_D} from "./math.js"

export interface DispersionModel {
    /**
     * Returns index of refraction for given wavelength
     * @param wavelength in nanometers
     */
    wavelengthToIor(wavelength: number): number
}

export class CauchyDispersion implements DispersionModel {
    private _iorSodiumD: number

    get iorSodiumD() {
        return this._iorSodiumD
    }

    set iorSodiumD(value: number) {
        this._iorSodiumD = value
        this.compute(value, this._abbe)
    }

    private _abbe: number

    get abbe() {
        return this._abbe
    }

    set abbe(value: number) {
        this._abbe = value
        this.compute(this._iorSodiumD, value)
    }

    private A: number = 1.0
    private B: number = 1.0

    constructor(iorSodiumD: number, abbe: number) {
        this._iorSodiumD = iorSodiumD
        this._abbe = abbe
        this.compute(iorSodiumD, abbe)
    }

    public compute(iorSodiumD: number, abbe: number) {
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