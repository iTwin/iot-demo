import React, { useState } from "react";
import { ChartComponent } from "./ChartComponent";
import { LabeledInput} from "@itwin/itwinui-react";
import { currDataArray } from "./DeviceTwin";

export function SineComponent(props) {
    const { arrayLength, telemetrySendInterval, signalArray, setCurrDataArray, newBehaviour } = props;
    const [mean, setMean] = useState("");
    const [amplitude, setAmplitude] = useState("");
    const [wave_period, setWave_period] = useState("");
    const changeMean = (event) => {
        setMean(event.target.value);
    }

    const changeAmplitude = (event) => {
        setAmplitude(event.target.value);
    }

    const changeWave_period = (event) => {
        setWave_period(event.target.value);
    }
    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const phase = 0;
    const deviceMean = signalArray !== "" ? JSON.parse(signalArray)["Mean"] : mean !==""? mean: newBehaviour !=="" ? JSON.parse(newBehaviour)["Mean"]: mean;
    const deviceAmplitude = signalArray !== "" ? JSON.parse(signalArray)["Amplitude"] : amplitude !=="" ? amplitude: newBehaviour !=="" ? JSON.parse(newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = signalArray !== "" ? JSON.parse(signalArray)["Wave Period"] : wave_period !=="" ? wave_period: newBehaviour !=="" ? JSON.parse(newBehaviour)["Wave Period"]: wave_period;
    if (deviceMean !== "" && deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let currData = parseFloat(deviceMean) + Math.sin((i * (parseFloat(telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(deviceWavePeriod) / 1000) + phase) * parseFloat(deviceAmplitude);
            ar.push(currData);
        }
        if (signalArray === "") {
            const sineObj = `{"Behaviour":"Sine","Mean":${deviceMean},"Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod},"Phase":"0"}`;
            setCurrDataArray(ar, sineObj);
        }

        console.log("After Modification " + currDataArray);
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Mean' name='mean' value={deviceMean} onChange={changeMean} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={signalArray !== "" ? true : false} />
            </div >
        
            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );
}

export function ConstantComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [mean, setMean] = useState("");
    const changeMean = (event) => {
        setMean(event.target.value);
    }
    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }
    const deviceMean = signalArray !== "" ? JSON.parse(signalArray)["Mean"]: mean !==""? mean: newBehaviour !=="" ? JSON.parse(newBehaviour)["Mean"] : mean;
    if (deviceMean !== "") {
        for (let i = 0; i < arrayLength; i++) {
            let currData = parseFloat(deviceMean);
            ar.push(currData);
        }
        if (signalArray === "") {
            const constObj = `{"Behaviour":"Constant","Mean":${deviceMean}}`;
            setCurrDataArray(ar, constObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Mean' name='mean' value={deviceMean} onChange={changeMean} disabled={signalArray !== "" ? true : false} />
            </div>
        
            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );
}

export function LinearComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [slope, setSlope] = useState("");
    const changeSlope = (event) => {
        setSlope(event.target.value);
    }
    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const deviceSlope = signalArray !== "" ? JSON.parse(signalArray)["Slope"]: slope !==""? slope: newBehaviour !=="" ? JSON.parse(newBehaviour)["Slope"] : slope;
    if (deviceSlope !== "") {
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let currData = parseFloat(deviceSlope) * ((i * (parseFloat(telemetrySendInterval) / 1000)));
            ar.push(currData);
        }
        if (signalArray === "") {
            const linearObj = `{"Behaviour":"Linear","Slope":${deviceSlope}}`;
            setCurrDataArray(ar, linearObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Slope' name='slope' value={deviceSlope} onChange={changeSlope} disabled={signalArray !== "" ? true : false} />
            </div>

            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );
}

export function NoiseComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [noise_magnitude, setNoise_magnitude] = useState("");
    const changeNoise_magnitude = (event) => {
        setNoise_magnitude(event.target.value);
    }

    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const deviceNoiseMagnitude = signalArray !== "" ? JSON.parse(signalArray)["Noise Magnitude"]: noise_magnitude !==""? noise_magnitude: newBehaviour !=="" ? JSON.parse(newBehaviour)["Noise Magnitude"] : noise_magnitude;
    if (deviceNoiseMagnitude !== "") {
        let mean = 0;
        let standard_deviation = 0.45;
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let x = (Math.random() - 0.5) * 2;
            let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
            let noise_mag = deviceNoiseMagnitude * Math.sign((Math.random() - 0.5) * 2);
            let currData = noise * noise_mag;
            ar.push(currData);
        }
        if (signalArray === "") {
            const noiseObj = `{"Behaviour":"Noise","Noise Magnitude":${deviceNoiseMagnitude},"Noise Standard-deviation":0.45}`;
            setCurrDataArray(ar, noiseObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Magnitude' name='noise_magnitude' value={deviceNoiseMagnitude} onChange={changeNoise_magnitude} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Deviation' name='noiseSd' value={0.45} disabled={true} />
            </div>

            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );

}

export function TriangularComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [amplitude, setAmplitude] = useState("");
    const [wave_period, setWave_period] = useState("");

    const changeAmplitude = (event) => {
        setAmplitude(event.target.value);
    }

    const changeWave_period = (event) => {
        setWave_period(event.target.value);
    }

    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = signalArray !== "" ? JSON.parse(signalArray)["Amplitude"] : amplitude !==""? amplitude: newBehaviour !=="" ? JSON.parse(newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = signalArray !== "" ? JSON.parse(signalArray)["Wave Period"] : wave_period !==""? wave_period: newBehaviour !=="" ? JSON.parse(newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let currData = (2 * parseFloat(deviceAmplitude) * Math.asin(Math.sin((2 * Math.PI * (i * (parseFloat(telemetrySendInterval) / 1000))) / (parseFloat(deviceWavePeriod) / 1000)))) / Math.PI;
            ar.push(currData);
        }
        if (signalArray === "") {
            const triangularObj = `{"Behaviour":"Triangular","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            setCurrDataArray(ar, triangularObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={signalArray !== "" ? true : false} />
            </div>

            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );

}

export function SawToothComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [amplitude, setAmplitude] = useState("");
    const [wave_period, setWave_period] = useState("");

    const changeAmplitude = (event) => {
        setAmplitude(event.target.value);
    }

    const changeWave_period = (event) => {
        setWave_period(event.target.value);
    }

    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = signalArray !== "" ? JSON.parse(signalArray)["Amplitude"] : amplitude !==""? amplitude: newBehaviour !=="" ? JSON.parse(newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = signalArray !== "" ? JSON.parse(signalArray)["Wave Period"] : wave_period !==""? wave_period: newBehaviour !=="" ? JSON.parse(newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let currData = 2 * parseFloat(deviceAmplitude) * ((i * (parseFloat(telemetrySendInterval) / 1000)) / (parseFloat(deviceWavePeriod) / 1000) - Math.floor(1 / 2 + (i * (parseFloat(telemetrySendInterval) / 1000)) / (parseFloat(deviceWavePeriod) / 1000)));
            ar.push(currData);
        }
        if (signalArray === "") {
            const sawtoothObj = `{"Behaviour":"Sawtooth","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            setCurrDataArray(ar, sawtoothObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={signalArray !== "" ? true : false} />
            </div>

            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );

}

export function SquareComponent(props) {
    const {arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    const [amplitude, setAmplitude] = useState("");
    const [wave_period, setWave_period] = useState("");

    const changeAmplitude = (event) => {
        setAmplitude(event.target.value);
    }

    const changeWave_period = (event) => {
        setWave_period(event.target.value);
    }

    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(arrayLength); i++) {
        arr.push(i * (parseFloat(telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = signalArray !== "" ? JSON.parse(signalArray)["Amplitude"]: amplitude !==""? amplitude: newBehaviour !=="" ? JSON.parse(newBehaviour)["Amplitude"] : amplitude;
    const deviceWavePeriod = signalArray !== "" ? JSON.parse(signalArray)["Wave Period"] : wave_period !==""? wave_period: newBehaviour !=="" ? JSON.parse(newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(arrayLength); i++) {
            let currData = parseFloat(deviceAmplitude) * Math.sign(Math.sin((2 * Math.PI * (i * (parseFloat(telemetrySendInterval) / 1000))) / (parseFloat(deviceWavePeriod) / 1000)));
            ar.push(currData);
        }
        if (signalArray === "") {
            const squareObj = `{"Behaviour":"Square","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            setCurrDataArray(ar, squareObj);
        }
    }
    return (
        <>
            <div className="behaviour-value">
                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={signalArray !== "" ? true : false} />
                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={signalArray !== "" ? true : false} />
            </div>
            
            <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
        </>
    );

}

export function BehaviourComponent(props) {
    const {behaviour, arrayLength,telemetrySendInterval,signalArray,setCurrDataArray,newBehaviour} = props;
    let behaviourObject; 
    switch(behaviour){
        case "Sine":
            behaviourObject = <SineComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Constant":
            behaviourObject = <ConstantComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Linear":
            behaviourObject =  <LinearComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Noise":
            behaviourObject = <NoiseComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Triangular":
            behaviourObject = <TriangularComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Sawtooth":
            behaviourObject = <SawToothComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        case "Square":
            behaviourObject =  <SquareComponent arrayLength={arrayLength} telemetrySendInterval={telemetrySendInterval} signalArray={signalArray} setCurrDataArray={setCurrDataArray} newBehaviour = {newBehaviour} />
            break;
        default:
            behaviourObject = null;
    }
            
    return (
        <div className= "behaviour-prop">
            {behaviourObject}  
        </div>
    );
}