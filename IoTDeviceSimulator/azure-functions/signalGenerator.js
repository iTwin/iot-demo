class generator {
    constructor() {
        if (this.constructor === generator) {
            const error = new Error("Can't instantiate abstract class!");
            console.log(error);
        }
    }

    generateValues(t) {
        const error = new Error("This method can't be called!");
        console.log(error);
    }
}

class sineGenerator extends generator {
    constructor(mean, amplitude, wave_period, phase) {
        super();
        this.mean = mean;
        this.amplitude = amplitude;
        this.wave_period = wave_period;
        this.phase = phase;
    }

    generateValues(t) {
        let tempData = parseFloat(this.mean) + Math.sin(t * (2 * Math.PI) / (parseFloat(this.wave_period) / 1000) + parseFloat(this.phase)) * parseFloat(this.amplitude);
        return tempData;
    }
}

class constantGenerator extends generator {
    constructor(mean) {
        super();
        this.mean = mean;
    }

    generateValues(t) {
        let tempData = parseFloat(this.mean);
        return tempData;
    }
}

class increasingGenerator extends generator {
    constructor(slope) {
        super();
        this.slope = slope;
    }

    generateValues(t) {
        let tempData = parseFloat(this.slope) * t;
        return tempData;
    }
}

class randomGenerator extends generator {
    constructor(min, max) {
        super();
        this.min = min;
        this.max = max;
    }

    generateValues(t) {
        const mean = (parseFloat(this.min) + parseFloat(this.max)) / 2;
        const constObj = new constantGenerator(mean);
        let tempData = constObj.generateValues(t);
        const noise_magnitude = (Math.random() * (parseFloat(this.max) - parseFloat(this.min))) / 2;
        const noiseSd = 0.45;
        const noiseObj = new noiseGenerator(noise_magnitude, noiseSd);
        tempData += noiseObj.generateValues(t);
        return tempData;
    }
}

class booleanGenerator extends generator {
    constructor() {
        super();
    }

    generateValues(t) {
        let tempData = (Math.random() >= 0.5 ? 0 : 1);
        return tempData;
    }
}

class noiseGenerator extends generator {
    constructor(noise_magnitude, noiseSd) {
        super();
        this.noise_magnitude = noise_magnitude;
        this.noiseSd = noiseSd;
    }

    generateValues(t) {
        if (this.noise_magnitude !== undefined && this.noiseSd !== undefined) {
            let mean = 0;
            let standard_deviation = parseFloat(this.noiseSd);
            // Taken reference from this link for range of x->https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Normal_Distribution_PDF.svg
            let x = (Math.random() - 0.5) * 2;
            // Taken reference from this link for noise value->https://en.wikipedia.org/wiki/Normal_distribution
            let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
            let noise_magnitude = parseFloat(this.noise_magnitude) * Math.sign((Math.random() - 0.5) * 2);
            return noise * noise_magnitude;
        }
        return 0;
    }
}

class triangularGenerator extends generator {
    constructor(amplitude, wave_period) {
        super();
        this.amplitude = amplitude;
        this.wave_period = wave_period;
    }

    generateValues(t) {
        let tempData = 4 * parseFloat(this.amplitude) / (parseFloat(this.wave_period) / 1000) * Math.abs((((t - (parseFloat(this.wave_period) / 1000) / 4) % (parseFloat(this.wave_period) / 1000)) + (parseFloat(this.wave_period) / 1000)) % (parseFloat(this.wave_period) / 1000) - (parseFloat(this.wave_period) / 1000) / 2) - parseFloat(this.amplitude);
        return tempData;
    }
}

class sawtoothGenerator extends generator {
    constructor(amplitude, wave_period) {
        super();
        this.amplitude = amplitude;
        this.wave_period = wave_period;
    }

    generateValues(t) {
        let tempData = 2 * parseFloat(this.amplitude) * (t / (parseFloat(this.wave_period) / 1000) - Math.floor(1 / 2 + t / (parseFloat(this.wave_period) / 1000)));
        return tempData;
    }
}

class squareGenerator extends generator {
    constructor(amplitude, wave_period) {
        super();
        this.amplitude = amplitude;
        this.wave_period = wave_period;
    }

    generateValues(t) {
        let tempData = parseFloat(this.amplitude) * Math.sign(Math.sin((2 * Math.PI * t) / (parseFloat(this.wave_period) / 1000)));
        return tempData;
    }
}

module.exports = { sineGenerator, constantGenerator, increasingGenerator, noiseGenerator, triangularGenerator, sawtoothGenerator, squareGenerator, randomGenerator, booleanGenerator }