import React, { useState } from "react";
import { ChartComponent } from "./ChartComponent";
import { LabeledInput, Label } from "@itwin/itwinui-react";
import { currDataArray } from "./DeviceTwin";

export function SineComponent(props) {
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

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const phase = 0;
    const deviceMean = props.signalArray !== "" ? JSON.parse(props.signalArray)["Mean"] : mean !==""? mean: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Mean"]: mean;
    const deviceAmplitude = props.signalArray !== "" ? JSON.parse(props.signalArray)["Amplitude"] : amplitude !=="" ? amplitude: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = props.signalArray !== "" ? JSON.parse(props.signalArray)["Wave Period"] : wave_period !=="" ? wave_period: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Wave Period"]: wave_period;
    if (deviceMean !== "" && deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let currData = parseFloat(deviceMean) + Math.sin((i * (parseFloat(props.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(deviceWavePeriod) / 1000) + phase) * parseFloat(deviceAmplitude);
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const sineObj = `{"Behaviour":"Sine","Mean":${deviceMean},"Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod},"Phase":"0"}`;
            props.setCurrDataArray(ar, sineObj);
        }

        console.log("After Modification " + currDataArray);
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Mean' name='mean' value={deviceMean} onChange={changeMean} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={props.signalArray !== "" ? true : false} />
                </div >
            
                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" rowSpan={2} ><Label>Sine</Label></td>
                    <td style={{width:"50%"}} className="behaviourLabelStyle"><Label>Mean</Label></td>
                    <td style={{width:"50%"}} className="behaviourLabelStyle"><Label>Amplitude</Label></td>
                    <td style={{width:"50%"}} className="behaviourLabelStyle"><Label>Wave Period(ms)</Label></td>
                </tr>
                <tr >
                    <td className="behaviourValueStyle"><Label>{deviceMean}</Label></td>
                    <td className="behaviourValueStyle"><Label>{deviceAmplitude}</Label></td>
                    <td className="behaviourValueStyle"><Label>{deviceWavePeriod}</Label></td>
                </tr>
            </>
            }
        </>
    );
}

export function ConstantComponent(props) {
    const [mean, setMean] = useState("");
    const changeMean = (event) => {
        setMean(event.target.value);
    }
    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }
    const deviceMean = props.signalArray !== "" ? JSON.parse(props.signalArray)["Mean"]: mean !==""? mean: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Mean"] : mean;
    if (deviceMean !== "") {
        for (let i = 0; i < props.arrayLength; i++) {
            let currData = parseFloat(deviceMean);
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const constObj = `{"Behaviour":"Constant","Mean":${deviceMean}}`;
            props.setCurrDataArray(ar, constObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Mean' name='mean' value={deviceMean} onChange={changeMean} disabled={props.signalArray !== "" ? true : false} />
                </div>
            
                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
                : 
            <> 
                <tr style={{width:"100%"}}>
                    <td className="behaviourComponentStyle" style={{borderTopStyle:"hidden"}} rowSpan={2}><Label>Constant</Label></td>
                    <td style={{width: "27.6rem",borderTopStyle:"hidden"}} className="behaviourLabelStyle"><Label>Mean</Label></td>
                </tr>
                <tr>
                    <td className="behaviourValueStyle"><Label>{deviceMean}</Label></td>
                </tr>
            </>
            }
        </>
    );
}

export function LinearComponent(props) {
    const [slope, setSlope] = useState("");
    const changeSlope = (event) => {
        setSlope(event.target.value);
    }
    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const deviceSlope = props.signalArray !== "" ? JSON.parse(props.signalArray)["Slope"]: slope !==""? slope: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Slope"] : slope;
    if (deviceSlope !== "") {
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let currData = parseFloat(deviceSlope) * ((i * (parseFloat(props.telemetrySendInterval) / 1000)));
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const linearObj = `{"Behaviour":"Linear","Slope":${deviceSlope}}`;
            props.setCurrDataArray(ar, linearObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Slope' name='slope' value={deviceSlope} onChange={changeSlope} disabled={props.signalArray !== "" ? true : false} />
                </div>

                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" rowSpan={2}><Label>Linear</Label></td>
                    <td style={{width: "27.6rem"}} className="behaviourLabelStyle"><Label>Slope</Label></td>
                    
                </tr>
                <tr>
                    <td className="behaviourValueStyle"><Label>{deviceSlope}</Label></td>
                </tr>
            </>
            }
        </>

    );
}

export function NoiseComponent(props) {
    const [noise_magnitude, setNoise_magnitude] = useState("");
    const changeNoise_magnitude = (event) => {
        setNoise_magnitude(event.target.value);
    }

    const ar = [];
    const arr = [];

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const deviceNoiseMagnitude = props.signalArray !== "" ? JSON.parse(props.signalArray)["Noise Magnitude"]: noise_magnitude !==""? noise_magnitude: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Noise Magnitude"] : noise_magnitude;
    if (deviceNoiseMagnitude !== "") {
        let mean = 0;
        let standard_deviation = 0.45;
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let x = (Math.random() - 0.5) * 2;
            let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
            let noise_mag = deviceNoiseMagnitude * Math.sign((Math.random() - 0.5) * 2);
            let currData = noise * noise_mag;
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const noiseObj = `{"Behaviour":"Noise","Noise Magnitude":${deviceNoiseMagnitude},"Noise Standard-deviation":0.45}`;
            props.setCurrDataArray(ar, noiseObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Magnitude' name='noise_magnitude' value={deviceNoiseMagnitude} onChange={changeNoise_magnitude} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Deviation' name='noiseSd' value={0.45} disabled={true} />
                </div>

                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" rowSpan={2}><Label>Noise</Label></td>
                    <td style={{width:"50%"}} className="behaviourLabelStyle"><Label>Magnitude</Label></td>
                    <td style={{width:"50%"}} className="behaviourLabelStyle"><Label>Deviation</Label></td>
                    
                </tr>
                <tr>
                    <td className="behaviourValueStyle"><Label>{deviceNoiseMagnitude}</Label></td>
                    <td className="behaviourValueStyle"><Label>{0.45}</Label></td>
                </tr>
            </>
            }
        </>
    );

}

export function TriangularComponent(props) {
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

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = props.signalArray !== "" ? JSON.parse(props.signalArray)["Amplitude"] : amplitude !==""? amplitude: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = props.signalArray !== "" ? JSON.parse(props.signalArray)["Wave Period"] : wave_period !==""? wave_period: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let currData = (2 * parseFloat(deviceAmplitude) * Math.asin(Math.sin((2 * Math.PI * (i * (parseFloat(props.telemetrySendInterval) / 1000))) / (parseFloat(deviceWavePeriod) / 1000)))) / Math.PI;
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const triangularObj = `{"Behaviour":"Triangular","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            props.setCurrDataArray(ar, triangularObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={props.signalArray !== "" ? true : false} />
                </div>

                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" rowSpan={2}><Label>Triangular</Label></td>
                    <td style={{width:"50%", paddingRight: "49px"}} className="behaviourLabelStyle"><Label>Amplitude</Label></td>
                    <td style={{width:"50%", paddingLeft: "0px"}} className="behaviourLabelStyle"><Label>Wave Period(ms)</Label></td>
                </tr>
                <tr>
                    <td className="behaviourValueStyle"><Label>{deviceAmplitude}</Label></td>
                    <td className="behaviourValueStyle"><Label>{deviceWavePeriod}</Label></td>
                </tr>
            </>
            }
        </>
    );

}


export function SawToothComponent(props) {
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

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = props.signalArray !== "" ? JSON.parse(props.signalArray)["Amplitude"] : amplitude !==""? amplitude: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Amplitude"]: amplitude;
    const deviceWavePeriod = props.signalArray !== "" ? JSON.parse(props.signalArray)["Wave Period"] : wave_period !==""? wave_period: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let currData = 2 * parseFloat(deviceAmplitude) * ((i * (parseFloat(props.telemetrySendInterval) / 1000)) / (parseFloat(deviceWavePeriod) / 1000) - Math.floor(1 / 2 + (i * (parseFloat(props.telemetrySendInterval) / 1000)) / (parseFloat(deviceWavePeriod) / 1000)));
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const sawtoothObj = `{"Behaviour":"Sawtooth","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            props.setCurrDataArray(ar, sawtoothObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={props.signalArray !== "" ? true : false} />
                </div>

                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" rowSpan={2}><Label>SawTooth</Label></td>
                    <td style={{width:"50%",paddingRight: "49px"}} className="behaviourLabelStyle"><Label>Amplitude</Label></td>
                    <td style={{width:"50%",paddingLeft: "0px"}} className="behaviourLabelStyle"><Label>Wave Period(ms)</Label></td>
                    
                </tr>
                <tr>
                    <td className="behaviourValueStyle"><Label>{deviceAmplitude}</Label></td>
                    <td className="behaviourValueStyle"><Label>{deviceWavePeriod}</Label></td>
                </tr>
            </>
            }
        </>
    );

}

export function SquareComponent(props) {
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

    for (let i = 0; i < parseFloat(props.arrayLength); i++) {
        arr.push(i * (parseFloat(props.telemetrySendInterval)) / 1000);
    }

    const deviceAmplitude = props.signalArray !== "" ? JSON.parse(props.signalArray)["Amplitude"]: amplitude !==""? amplitude: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Amplitude"] : amplitude;
    const deviceWavePeriod = props.signalArray !== "" ? JSON.parse(props.signalArray)["Wave Period"] : wave_period !==""? wave_period: props.newBehaviour !=="" ? JSON.parse(props.newBehaviour)["Wave Period"]: wave_period;
    if (deviceAmplitude !== "" && deviceWavePeriod !== "") {
        for (let i = 0; i < parseFloat(props.arrayLength); i++) {
            let currData = parseFloat(deviceAmplitude) * Math.sign(Math.sin((2 * Math.PI * (i * (parseFloat(props.telemetrySendInterval) / 1000))) / (parseFloat(deviceWavePeriod) / 1000)));
            ar.push(currData);
        }
        if (props.signalArray === "") {
            const squareObj = `{"Behaviour":"Square","Amplitude":${deviceAmplitude},"Wave Period":${deviceWavePeriod}}`;
            props.setCurrDataArray(ar, squareObj);
        }
    }
    return (
        <>
            {props.isAdmin === true ?
            <>
                <div className="behaviour-value">
                    <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={deviceAmplitude} onChange={changeAmplitude} disabled={props.signalArray !== "" ? true : false} />
                    <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={deviceWavePeriod} onChange={changeWave_period} disabled={props.signalArray !== "" ? true : false} />
                </div>
                
                <ChartComponent labelsArray={arr} dataArray={ar} chartName="Component Signal" />
            </>
            : 
            <>
                <tr>
                    <td className="behaviourComponentStyle" style={{borderBottomStyle:"outset"}} rowSpan={2}><Label>Square</Label></td>
                    <td style={{width:"50%",paddingRight: "49px"}} className="behaviourLabelStyle"><Label>Amplitude</Label></td>
                    <td style={{width:"50%",paddingLeft: "0px"}} className="behaviourLabelStyle"><Label>Wave Period(ms)</Label></td>
                </tr>
                <tr>
                    <td className="behaviourValueStyle" style={{borderBottomStyle:"outset"}}><Label>{deviceAmplitude}</Label></td>
                    <td className="behaviourValueStyle" style={{borderBottomStyle:"outset"}}><Label>{deviceWavePeriod}</Label></td>
                </tr>
            </>
            }
        </>
    );

}

export function BehaviourComponent(props) {
    let behaviourObject; 
    switch(props.behaviour){
        case "Sine":
            behaviourObject = <SineComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Constant":
            behaviourObject = <ConstantComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Linear":
            behaviourObject =  <LinearComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Noise":
            behaviourObject = <NoiseComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Triangular":
            behaviourObject = <TriangularComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Sawtooth":
            behaviourObject = <SawToothComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} />
            break;
        case "Square":
            behaviourObject =  <SquareComponent arrayLength={props.arrayLength} telemetrySendInterval={props.telemetrySendInterval} signalArray={props.signalArray} setCurrDataArray={props.setCurrDataArray} newBehaviour = {props.newBehaviour} isAdmin={props.isAdmin} /> 
            break;
        default:
            behaviourObject = null;
    }
            
    return (
        <div className={props.isAdmin?"behaviour-prop":"non-admin-prop"}>
            {behaviourObject}  
        </div>
    );
}