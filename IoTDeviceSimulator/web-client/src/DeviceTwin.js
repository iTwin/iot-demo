/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Modal, LabeledInput, ToggleSwitch, toaster, Button, Label, Select } from "@itwin/itwinui-react";
import { DeviceAction } from "./Utils";
import { Line } from 'react-chartjs-2'
import { editDeviceTwins } from "./AzureUtilities";
import { editAWSThings } from "./AWSUtililities";

let ar = [];
let arr = [];

export function DeviceTwin(props) {
    const [deviceTwin, setDeviceTwin] = useState({
        deviceAction: props.device.deviceAction,
        deviceId: props.device.deviceId,
        deviceName: props.device.deviceName,
        phenomenon: props.device.phenomenon,
        unit: props.device.unit,
        valueIsBool: props.device.valueIsBool,
        telemetrySendInterval: props.device.telemetrySendInterval,
        behaviour: props.device.behaviour,
        noise_magnitude: props.device.noise_magnitude,
        noiseSd: props.device.noiseSd,
        sine_period: props.device.sine_period,
        mean: props.device.mean,
        amplitude: props.device.amplitude,
        isRunning: props.device.isRunning,
        min: props.device.min,
        max: props.device.max,
        thingTypeName: props.device.thingTypeName,
        slope: props.device.slope,
        behaviourArray: props.device.behaviourArray,
        currDataArray: props.device.currDataArray,
        signalArray: props.device.signalArray,
        renderList: props.device.renderList,
    });

    const [sineConfig, setSineConfig] = useState(false);
    const [constantConfig, setConstantConfig] = useState(false);
    const [increasingConfig, setIncreasingConfig] = useState(false);
    const [noiseConfig, setNoiseConfig] = useState(false);
    const [sineInfo, setSineInfo] = useState(false);
    const [constantInfo, setConstantInfo] = useState(false);
    const [increasingInfo, setIncreasingInfo] = useState(false);
    const [noiseInfo, setNoiseInfo] = useState(false);
    const [behaviourConfig, setBehaviourConfig] = useState(false);
    const [mean, setMean] = useState("");
    const [amplitude, setAmplitude] = useState("");
    const [sine_period, setSine_period] = useState("");
    const [noise_magnitude, setNoise_magnitude] = useState("");
    const [slope, setSlope] = useState("");
    const [behaviour, setBehaviour] = useState("");
    const [renderState, setRenderState] = useState([]);
    const [dataArray, setDataArray] = useState([]);
    const url = useMemo(() => process.env.REACT_APP_FUNCTION_URL, []);

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
        constructor(mean, amplitude, sine_period, phase) {
            super();
            this.mean = mean;
            this.amplitude = amplitude;
            this.sine_period = sine_period;
            this.phase = phase;
        }

        generateValues(t) {
            let tempData = parseFloat(this.mean) + Math.sin(t * (2 * Math.PI) / (parseFloat(this.sine_period) / 1000) + parseFloat(this.phase)) * parseFloat(this.amplitude);
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
            const randomBoolean = () => Math.random() >= 0.5;
            let tempData = randomBoolean();
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

    useEffect(() => {
        setDeviceTwin({
            deviceAction: props.device.deviceAction,
            deviceId: props.device.deviceId ?? '',
            deviceName: props.device.deviceName ?? '',
            unit: props.device.unit ?? '',
            phenomenon: props.device.phenomenon ?? '',
            valueIsBool: props.device.valueIsBool ?? false,
            telemetrySendInterval: props.device.telemetrySendInterval ?? '',
            behaviour: props.device.behaviour ?? '',
            noise_magnitude: props.device.noise_magnitude ?? '',
            noiseSd: 0.45,
            sine_period: props.device.sine_period ?? '',
            mean: props.device.mean ?? '',
            amplitude: props.device.amplitude ?? '',
            isRunning: props.device.isRunning ?? false,
            min: props.device.min ?? '',
            max: props.device.max ?? '',
            thingTypeName: props.device.thingTypeName ?? '',
            slope: props.device.slope ?? '',
            behaviourArray: props.device.behaviourArray ?? [],
            currDataArray: props.device.currDataArray ?? [],
            signalArray: props.device.signalArray ?? [],
            renderList: props.device.renderList ?? [],
        });
    }, [props]);

    const handleChange = useCallback((event) => {
        event.preventDefault();
        setDeviceTwin({
            ...deviceTwin,
            [event.target.name]: event.target.value,
        });
    }, [deviceTwin]);

    const changeMean = (event) => {
        setMean(event.target.value);
    }

    const changeAmplitude = (event) => {
        setAmplitude(event.target.value);
    }

    const changeSine_period = (event) => {
        setSine_period(event.target.value);
    }

    const changeNoise_magnitude = (event) => {
        setNoise_magnitude(event.target.value);
    }

    const changeSlope = (event) => {
        setSlope(event.target.value);
    }

    const changeBehaviour = (event) => {
        setBehaviour(event);
    }

    const setSineConfigurer = () => {
        if (behaviour === 'Sine Function') {
            setConstantConfig(false);
            setIncreasingConfig(false);
            setNoiseConfig(false);
            setSineConfig(true);
        }
    }

    const setConstantConfigurer = () => {
        if (behaviour === 'Constant Function') {
            setSineConfig(false);
            setIncreasingConfig(false);
            setNoiseConfig(false);
            setConstantConfig(true);
        }
    }

    const setIncreasingConfigurer = () => {
        if (behaviour === 'Strictly Increasing Function') {
            setSineConfig(false);
            setConstantConfig(false);
            setNoiseConfig(false);
            setIncreasingConfig(true);
        }
    }

    const setNoiseConfigurer = () => {
        if (behaviour === 'Noise Function') {
            setSineConfig(false);
            setConstantConfig(false);
            setIncreasingConfig(false);
            setNoiseConfig(true);

        }
    }

    const setBehaviourConfigurer = () => {
        setBehaviourConfig(true);
    }

    const setAlert = () => {
        toaster.negative(`Behaviour property can't be empty`);
    }

    const setSineInfoDisplay = () => {
        if (behaviour === 'Sine Function') {
            setSineInfo(true);
        }
    }

    const setConstantInfoDisplay = () => {
        if (behaviour === 'Constant Function') {
            setConstantInfo(true);
        }
    }

    const setIncreasingInfoDisplay = () => {
        if (behaviour === 'Strictly Increasing Function') {
            setIncreasingInfo(true);
        }
    }

    const setNoiseInfoDisplay = () => {
        if (behaviour === 'Noise Function') {
            setNoiseInfo(true);
        }
    }

    const updateDeviceTwin = useCallback(async (event) => {
        event.preventDefault();
        let updatedDevice = false;
        if (props.connection.includes("Azure")) {
            let deviceArray = [deviceTwin];
            const response = await editDeviceTwins(deviceArray, props.connectionStringId)
            updatedDevice = response.updated;
        } else {
            updatedDevice = await editAWSThings([deviceTwin]);
        }

        if (updatedDevice) {
            toaster.informational(`Updated device twin : ${deviceTwin.deviceId}`);
            props.handleClose(deviceTwin);
        }
    }, [props, deviceTwin]);
    const addDevice = useCallback(async (event) => {
        event.preventDefault();
        const data = { deviceId: deviceTwin.deviceId, connectionStringId: props.connectionStringId }
        const response = await fetch(`${url}/create-device`, {
            method: 'POST',
            body: JSON.stringify(data),
        }).catch(error => console.log("Request failed: " + error));
        if (response && response.status === 200) {
            let deviceArray = [deviceTwin];
            const response = await editDeviceTwins(deviceArray, props.connectionStringId)
            if (response.updated) {
                toaster.positive(`Added device : ${deviceTwin.deviceId}`);
                props.handleClose(await response.response.json());
            }
        } else {
            const error = await response.text();
            toaster.negative(`${error}`);
        }
    }, [deviceTwin, props, url]);

    const onClose = useCallback(() => {
        props.handleClose();
    }, [props]);

    const options = [
        { value: 'Sine Function', label: 'Sine Function' },
        { value: 'Constant Function', label: 'Constant Function' },
        { value: 'Strictly Increasing Function', label: 'Strictly Increasing Function' },
        { value: 'Noise Function', label: 'Noise Function' },
    ]

    const handleCloseSineWave = () => {
        setSineConfig(false);
    }

    const handleCloseConstantWave = () => {
        setConstantConfig(false);
    }

    const handleCloseIncreasingWave = () => {
        setIncreasingConfig(false);
    }

    const handleCloseNoiseWave = () => {
        setNoiseConfig(false);
    }

    const handleCloseBehaviour = () => {
        setBehaviourConfig(false);
    }

    const handleCloseSineInfo = () => {
        setSineInfo(false);
    }

    const handleCloseConstantInfo = () => {
        setConstantInfo(false);
    }

    const handleCloseIncreasingInfo = () => {
        setIncreasingInfo(false);
    }

    const handleCloseNoiseInfo = () => {
        setNoiseInfo(false);
    }

    const removeBehaviour = (index) => {
        deviceTwin.behaviourArray.splice(Object.values(index)[0], 1);
        deviceTwin.signalArray.splice(Object.values(index)[0], 1);
        deviceTwin.renderList = deviceTwin.signalArray.map((item, index) =>
            <div key={index} className="funcElement">
                <Label>{deviceTwin.behaviourArray[index]}</Label>
                <Label>{JSON.stringify(item)}</Label>
                <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
            </div>
        );
        getCurrentData();
        setRenderState(deviceTwin.renderList);
    }

    const getCurrentData = () => {
        deviceTwin.currDataArray = [];
        for (let i = 0; i <= 50; i++) {
            deviceTwin.currDataArray[i] = 0;
        }
        for (let index = 0; index < deviceTwin.signalArray.length; index++) {
            if (deviceTwin.behaviourArray[index] === 'SINE:') {
                const phase = 0;
                for (let ind = 0; ind <= 50; ind++) {
                    let currData = parseFloat(deviceTwin.signalArray[index].mean) + Math.sin(ind * (2 * Math.PI) / (parseFloat(deviceTwin.signalArray[index].sine_period) / 1000) + phase) * parseFloat(deviceTwin.signalArray[index].amplitude);
                    deviceTwin.currDataArray[ind] += currData;
                }
            }
            else if (deviceTwin.behaviourArray[index] === 'CONSTANT:') {
                for (let ind = 0; ind <= 50; ind++) {
                    let currData = parseFloat(deviceTwin.signalArray[index].mean);
                    deviceTwin.currDataArray[ind] += currData;
                }
            }
            else if (deviceTwin.behaviourArray[index] === 'INCREASING:') {
                for (let ind = 0; ind <= 50; ind++) {
                    let currData = parseFloat(deviceTwin.signalArray[index].slope) * ind;
                    deviceTwin.currDataArray[ind] += currData;
                }
            }
            else {
                let mean = 0;
                let standard_deviation = parseFloat(deviceTwin.noiseSd);
                for (let ind = 0; ind <= 50; ind++) {
                    let x = (Math.random() - 0.5) * 2;
                    let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
                    let noise_mag = deviceTwin.signalArray[index].noise_magnitude * Math.sign((Math.random() - 0.5) * 2);
                    let currData = noise * noise_mag;
                    deviceTwin.currDataArray[ind] += currData;
                }
            }
        }
        setDataArray(deviceTwin.currDataArray);
    }

    const configureBehaviour = () => {
        // eslint-disable-next-line no-lone-blocks
        {
            if (behaviour === 'Sine Function') {
                toaster.informational(`Sine Wave Configured`);
                setSineConfig(false);
                const sineObj = new sineGenerator(mean, amplitude, sine_period, 0);
                deviceTwin.signalArray.push(sineObj);
                deviceTwin.behaviourArray.push("SINE:");
                deviceTwin.renderList = deviceTwin.signalArray.map((item, index) =>
                    <div key={index} className="funcElement">
                        <Label>{deviceTwin.behaviourArray[index]}</Label>
                        <Label>{JSON.stringify(item)}</Label>
                        <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                    </div>
                );
                setMean("");
                setAmplitude("");
                setSine_period("");
                setBehaviour("");
                setRenderState(deviceTwin.renderList);
            }
            else if (behaviour === 'Constant Function') {
                toaster.informational(`Constant Wave Configured`);
                setConstantConfig(false);
                const constObj = new constantGenerator(mean);
                deviceTwin.signalArray.push(constObj);
                deviceTwin.behaviourArray.push("CONSTANT:");
                deviceTwin.renderList = deviceTwin.signalArray.map((item, index) =>
                    <div key={index} className="funcElement">
                        <Label>{deviceTwin.behaviourArray[index]}</Label>
                        <Label>{JSON.stringify(item)}</Label>
                        <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                    </div>
                );
                setMean("");
                setBehaviour("");
                setRenderState(deviceTwin.renderList);
            }
            else if (behaviour === 'Strictly Increasing Function') {
                toaster.informational(`Strictly Increasing Wave Configured`);
                setIncreasingConfig(false);
                const increasingObj = new increasingGenerator(slope);
                deviceTwin.signalArray.push(increasingObj);
                deviceTwin.behaviourArray.push("INCREASING:");
                deviceTwin.renderList = deviceTwin.signalArray.map((item, index) =>
                    <div key={index} className="funcElement">
                        <Label>{deviceTwin.behaviourArray[index]}</Label>
                        <Label>{JSON.stringify(item)}</Label>
                        <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                    </div>
                );
                setSlope("");
                setBehaviour("");
                setRenderState(deviceTwin.renderList);
            }
            else {
                toaster.informational(`Noise Wave Configured`);
                setNoiseConfig(false);
                const noiseObj = new noiseGenerator(noise_magnitude, deviceTwin.noiseSd);
                deviceTwin.signalArray.push(noiseObj);
                deviceTwin.behaviourArray.push("NOISE:");
                deviceTwin.renderList = deviceTwin.signalArray.map((item, index) =>
                    <div key={index} className="funcElement">
                        <Label>{deviceTwin.behaviourArray[index]}</Label>
                        <Label>{JSON.stringify(item)}</Label>
                        <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                    </div>
                );
                setNoise_magnitude("");
                setBehaviour("");
                setRenderState(deviceTwin.renderList);
            }
            getCurrentData();
        }
    }

    ar = [];
    arr = [];

    if (behaviour === 'Sine Function') {
        const phase = 0;
        for (let index = 0; index <= 50; index++) {
            let currData = parseFloat(mean) + Math.sin(index * (2 * Math.PI) / (parseFloat(sine_period) / 1000) + phase) * parseFloat(amplitude);
            ar.push(currData);
            arr.push(index);
        }
    }
    else if (behaviour === 'Constant Function') {
        for (let index = 0; index <= 50; index++) {
            let currData = parseFloat(mean);
            ar.push(currData);
            arr.push(index);
        }
    }
    else if (behaviour === 'Strictly Increasing Function') {
        for (let index = 0; index <= 50; index++) {
            let currData = parseFloat(slope) * index;
            ar.push(currData);
            arr.push(index);
        }
    }
    else {
        let mean = 0;
        let standard_deviation = parseFloat(deviceTwin.noiseSd);
        for (let index = 0; index <= 50; index++) {
            let x = (Math.random() - 0.5) * 2;
            let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
            let noise_mag = noise_magnitude * Math.sign((Math.random() - 0.5) * 2);
            let currData = noise * noise_mag;
            ar.push(currData);
            arr.push(index);
        }
    }

    // const isDisabled = (deviceTwin.valueIsBool) ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '') ? false : true) : (deviceTwin.behaviour === 'Sine Function') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && mean !== '' && amplitude !== '' && sine_period !== '') ? false : true) : (deviceTwin.behaviour === 'Constant Function') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && mean !== '') ? false : true) : (deviceTwin.behaviour === 'Strictly Increasing Function') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && slope !== '') ? false : true) : ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && noise_magnitude !== '' && deviceTwin.noiseSd !== '') ? false : true);

    return (
        <>
            <Modal
                closeOnExternalClick={false}
                isOpen={props.isOpen}
                onClose={onClose}
                title={deviceTwin.deviceAction === DeviceAction.ADD ? 'Add Device' : props.isAdmin ? 'Update Device' : 'Device Properties'}
            >
                {props.isAdmin ?
                    <div className="mainBox">
                        <div>
                            <LabeledInput label='Device Id' name='deviceId' value={deviceTwin.deviceId}
                                disabled={deviceTwin.deviceAction === DeviceAction.ADD ? false : true}
                                onChange={handleChange} />
                            <LabeledInput label='Device Name' name='deviceName' value={deviceTwin.deviceName} onChange={handleChange} />
                            <LabeledInput label='Phenomenon' name='phenomenon' value={deviceTwin.phenomenon} onChange={handleChange} />
                            <LabeledInput label='Data Period (ms per observation)' name='telemetrySendInterval' value={deviceTwin.telemetrySendInterval} onChange={handleChange} />
                            <ToggleSwitch label='Is value bool' labelPosition="left" name='valueIsBool' checked={deviceTwin.valueIsBool} onChange={(e) => setDeviceTwin({ ...deviceTwin, valueIsBool: e.target.checked, mean: '', amplitude: '', sine_period: '', noise_magnitude: '', unit: '', behaviour: '' })} />
                            <LabeledInput label='Unit' name='unit' value={deviceTwin.unit} onChange={handleChange} style={{ display: deviceTwin.valueIsBool ? 'none' : 'inline' }} />
                            <div className="behaviour-label" style={{ display: deviceTwin.valueIsBool ? 'none' : 'flex' }} ><Label style={{ display: deviceTwin.valueIsBool ? 'none' : 'inline' }}>Behaviour</Label>
                                <div className="button-config" onClick={setBehaviourConfigurer}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M13,9H9v4H7V9H3V7h4V3h2v4h4V9z" /></svg></div></div>
                            <div>
                                {deviceTwin.renderList}
                            </div>
                            {deviceTwin.deviceAction === DeviceAction.ADD ?
                                <Button className="buttons" styleType="cta" onClick={addDevice}> Add </Button>
                                :
                                <Button className="buttons" styleType="cta" onClick={updateDeviceTwin}  > Update </Button>
                            }
                        </div><div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Generated signal",
                                            data: deviceTwin.currDataArray,
                                            fill: false,
                                            borderColor: "green",
                                            borderWidth: 2,
                                            lineTension: 0,
                                            pointRadius: 0,
                                        },
                                    ],
                                }}
                                options={{
                                    maintainAspectRatio: true,
                                    scales: {
                                        yAxes: [
                                            {
                                                ticks: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        ],
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 25,
                                            fontColor: "green",
                                        },
                                    },
                                }}
                            />
                        </div></div> :
                    <table>
                        <tr>
                            <td className="tableLabelStyle"><Label>Device Id</Label></td>
                            <td className="tableStyle"><Label>{deviceTwin.deviceId}</Label></td>
                        </tr>
                        <tr>
                            <td className="tableLabelStyle"><Label>Device Name</Label></td>
                            <td className="tableStyle"><Label>{deviceTwin.deviceName}</Label></td>
                        </tr>
                        <tr>
                            <td className="tableLabelStyle"><Label>Phenomenon</Label></td>
                            <td className="tableStyle"><Label>{deviceTwin.phenomenon}</Label></td>
                        </tr>
                        {deviceTwin.unit ?
                            <tr>
                                <td className="tableLabelStyle"><Label>Unit</Label></td>
                                <td className="tableStyle"><Label>{deviceTwin.unit}</Label></td>
                            </tr> : <></>}
                        {deviceTwin.valueIsBool ?
                            <tr>
                                <td className="tableLabelStyle"><Label>Is value bool</Label></td>
                                <td className="tableStyle"><Label>{deviceTwin.valueIsBool.toString()}</Label></td>
                            </tr> : <></>}
                        {deviceTwin.behaviour ?
                            <>
                                <tr>
                                    <td className="tableLabelStyle"><Label>Behaviour</Label></td>
                                    <td className="tableStyle"><Label>{deviceTwin.behaviour}</Label></td>
                                </tr>
                                {deviceTwin.behaviour === "Sine Function" ?
                                    <>
                                        <tr>
                                            <td className="tableLabelStyle"><Label>Mean</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.mean}</Label></td>
                                        </tr>
                                        <tr>
                                            <td className="tableLabelStyle"><Label>Amplitude</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.amplitude}</Label></td>
                                        </tr>
                                        <tr>
                                            <td className="tableLabelStyle"><Label>Sine Period(ms)</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.sine_period}</Label></td>
                                        </tr>
                                    </> : deviceTwin.behaviour === "Constant Function" ?
                                        <>
                                            <tr>
                                                <td className="tableLabelStyle"><Label>Mean</Label></td>
                                                <td className="tableStyle"><Label>{deviceTwin.mean}</Label></td>
                                            </tr>
                                        </> :
                                        <>
                                            <tr>
                                                <td className="tableLabelStyle"><Label>Slope</Label></td>
                                                <td className="tableStyle"><Label>{deviceTwin.slope}</Label></td>
                                            </tr>
                                        </>
                                }
                                <tr>
                                    <td className="tableLabelStyle"><Label>Noise Magnitude</Label></td>
                                    <td className="tableStyle"><Label>{deviceTwin.noise_magnitude}</Label></td>
                                </tr>
                            </>
                            : <></>
                        }
                        <tr>
                            <td className="tableLabelStyle"><Label>Period (ms)</Label></td>
                            <td className="tableStyle"><Label>{deviceTwin.telemetrySendInterval}</Label></td>
                        </tr>
                    </table>
                }
            </Modal>
            {
                (behaviour === 'Sine Function' && sineConfig) ?
                    <Modal
                        closeOnExternalClick={false}
                        isOpen={sineConfig}
                        onClose={handleCloseSineWave}
                        title='Configure Sine Function'
                        style={{ margin: "0px 441px 0px 441px" }}
                    >
                        <LabeledInput type='number' label='Mean Value' name='mean' value={mean} onChange={changeMean} />
                        <LabeledInput type='number' label='Amplitude' name='amplitude' value={amplitude} onChange={changeAmplitude} />
                        <LabeledInput type='number' label='Period(ms)' name='sine_period' value={sine_period} onChange={changeSine_period} />
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: deviceTwin.phenomenon === '' ? "Phenomenon Vs Time" : deviceTwin.phenomenon.concat(" Vs ".concat("Time")),
                                            data: ar,
                                            fill: false,
                                            borderColor: "green",
                                            borderWidth: 2,
                                            lineTension: 0,
                                            pointRadius: 0,
                                        },
                                    ],
                                }}
                                options={{
                                    maintainAspectRatio: true,
                                    scales: {
                                        yAxes: [
                                            {
                                                ticks: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        ],
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 25,
                                            fontColor: "green",
                                        },
                                    },
                                }}
                            />
                        </div>
                        <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(mean !== '' && amplitude !== '' && sine_period !== '') ? false : true}> Accept </Button>
                    </Modal> : (behaviour === 'Constant Function' && constantConfig) ?
                        <Modal
                            closeOnExternalClick={false}
                            isOpen={constantConfig}
                            onClose={handleCloseConstantWave}
                            title='Configure Constant Function'
                            style={{ margin: "0px 441px 0px 441px" }}
                        >
                            <LabeledInput type='number' label='Mean Value' name='mean' value={mean} onChange={changeMean} />
                            <div className="preview">
                                <Line
                                    data={{
                                        labels: arr,
                                        datasets: [
                                            {
                                                label: deviceTwin.phenomenon === '' ? "Phenomenon Vs Time" : deviceTwin.phenomenon.concat(" Vs ".concat("Time")),
                                                data: ar,
                                                fill: false,
                                                borderColor: "green",
                                                borderWidth: 2,
                                                lineTension: 0,
                                                pointRadius: 0,
                                            },
                                        ],
                                    }}
                                    options={{
                                        maintainAspectRatio: true,
                                        scales: {
                                            yAxes: [
                                                {

                                                    ticks: {
                                                        beginAtZero: true,
                                                    },
                                                },
                                            ],
                                        },
                                        legend: {
                                            labels: {
                                                fontSize: 25,
                                                fontColor: "green",
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(mean !== '') ? false : true}> Accept </Button>
                        </Modal> : (behaviour === 'Strictly Increasing Function' && increasingConfig) ?
                            <Modal
                                closeOnExternalClick={false}
                                isOpen={increasingConfig}
                                onClose={handleCloseIncreasingWave}
                                title='Configure Strictly Increasing Function'
                                style={{ margin: "0px 441px 0px 441px" }}
                            >
                                <LabeledInput type='number' label='Slope' name='slope' value={slope} onChange={changeSlope} />
                                <div className="preview">
                                    <Line
                                        data={{
                                            labels: arr,
                                            datasets: [
                                                {
                                                    label: deviceTwin.phenomenon === '' ? "Phenomenon Vs Time" : deviceTwin.phenomenon.concat(" Vs ".concat("Time")),
                                                    data: ar,
                                                    fill: false,
                                                    borderColor: "green",
                                                    borderWidth: 2,
                                                    lineTension: 0,
                                                    pointRadius: 0,
                                                },
                                            ],
                                        }}
                                        options={{
                                            maintainAspectRatio: true,
                                            scales: {
                                                yAxes: [
                                                    {

                                                        ticks: {
                                                            beginAtZero: true,
                                                        },
                                                    },
                                                ],
                                            },
                                            legend: {
                                                labels: {
                                                    fontSize: 25,
                                                    fontColor: "green",
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(slope !== '') ? false : true}> Accept </Button>
                            </Modal> : (behaviour === 'Noise Function' && noiseConfig) ?
                                <Modal
                                    closeOnExternalClick={false}
                                    isOpen={noiseConfig}
                                    onClose={handleCloseNoiseWave}
                                    title='Configure Noise Function'
                                    style={{ margin: "0px 441px 0px 441px" }}
                                >
                                    <LabeledInput type='number' label='Noise-Magnitude' name='noise_magnitude' value={noise_magnitude} onChange={changeNoise_magnitude} />
                                    <LabeledInput type='number' label='Noise-Standard Deviation' name='noiseSd' value={0.45} disabled={true} />
                                    <div className="preview">
                                        <Line
                                            data={{
                                                labels: arr,
                                                datasets: [
                                                    {
                                                        label: deviceTwin.phenomenon === '' ? "Phenomenon Vs Time" : deviceTwin.phenomenon.concat(" Vs ".concat("Time")),
                                                        data: ar,
                                                        fill: false,
                                                        borderColor: "green",
                                                        borderWidth: 2,
                                                        lineTension: 0,
                                                        pointRadius: 0,
                                                    },
                                                ],
                                            }}
                                            options={{
                                                maintainAspectRatio: true,
                                                scales: {
                                                    yAxes: [
                                                        {

                                                            ticks: {
                                                                beginAtZero: true,
                                                            },
                                                        },
                                                    ],
                                                },
                                                legend: {
                                                    labels: {
                                                        fontSize: 25,
                                                        fontColor: "green",
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                    <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(noise_magnitude !== '' && deviceTwin.noiseSd !== '') ? false : true}> Accept </Button>
                                </Modal> : null
            }
            {
                (behaviour === 'Sine Function' && sineInfo) ?
                    <Modal
                        closeOnExternalClick={true}
                        isOpen={sineInfo}
                        style={{ margin: "265px 200px 0px 180px" }}
                        isDismissible={false}
                    >
                        <div>A sinusoidal wave is a mathematical curve defined in terms of the sine trigonometric function, of which it is the graph.</div>
                    </Modal> : (behaviour === 'Constant Function' && constantInfo) ?
                        <Modal
                            closeOnExternalClick={true}
                            isOpen={constantInfo}
                            style={{ margin: "265px 200px 0px 180px" }}
                            isDismissible={false}
                        >
                            <div>A constant wave is a wave that is same everywhere and having the same value of range for different values of the domain.</div>
                        </Modal> : (behaviour === 'Strictly Increasing Function' && increasingInfo) ?
                            <Modal
                                closeOnExternalClick={true}
                                isOpen={increasingInfo}
                                style={{ margin: "265px 200px 0px 180px" }}
                                isDismissible={false}
                            >
                                <div>A stricty increasing wave is a wave in which Y-value increases with the increasing value on X-axis.</div>
                            </Modal> : (behaviour === 'Noise Function' && noiseInfo) ?
                                <Modal
                                    closeOnExternalClick={true}
                                    isOpen={noiseInfo}
                                    style={{ margin: "265px 200px 0px 180px" }}
                                    isDismissible={false}
                                >
                                    <div>A noise wave is an unwanted random disturbance of a signal.</div>
                                </Modal> : null
            }
            {(behaviourConfig) ?
                <Modal closeOnExternalClick={false}
                    isOpen={behaviourConfig}
                    onClose={handleCloseBehaviour}
                    title='Select Behaviour'
                    style={{ margin: "180px auto auto 115px" }}><div className="behaviour-prop" style={{ display: deviceTwin.valueIsBool ? 'none' : 'flex' }}><Select value={behaviour} placeholder={"Select Behaviour"} options={options} onChange={changeBehaviour} style={{ width: "310px" }} ></Select>
                        <div className="button-config" onClick={(behaviour === 'Sine Function') ? setSineConfigurer : (behaviour === 'Constant Function') ? setConstantConfigurer : (behaviour === 'Strictly Increasing Function') ? setIncreasingConfigurer : (behaviour === 'Noise Function') ? setNoiseConfigurer : setAlert} ><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m16 9.42256v-2.85566l-2.20352-.44435a6.05356 6.05356 0 0 0 -.37645-.903l1.2427-1.87048-2.01923-2.01931-1.86669 1.24016a6.047 6.047 0 0 0 -.91294-.38153l-.44131-2.18839h-2.85566l-.44131 2.18839a6.0501 6.0501 0 0 0 -.91778.38383l-1.85881-1.23495-2.01924 2.01923 1.2388 1.86464a6.05267 6.05267 0 0 0 -.38067.91511l-2.18789.44119v2.85566l2.20054.44373a6.059 6.059 0 0 0 .37924.90383l-1.24251 1.87034 2.01923 2.01924 1.88089-1.24959a6.049 6.049 0 0 0 .8949.372l.44515 2.20735h2.85566l.44683-2.21567a6.05213 6.05213 0 0 0 .88907-.37186l1.882 1.25026 2.01923-2.01923-1.25089-1.88287a6.04854 6.04854 0 0 0 .37291-.89285zm-8.0053 1.61456a3.04782 3.04782 0 1 1 3.04782-3.04782 3.04781 3.04781 0 0 1 -3.04782 3.04782z" /></svg></div>
                        <div className="button-config" onMouseOver={(behaviour === 'Sine Function') ? setSineInfoDisplay : (behaviour === 'Constant Function') ? setConstantInfoDisplay : (behaviour === 'Strictly Increasing Function') ? setIncreasingInfoDisplay : setNoiseInfoDisplay} onMouseOut={(behaviour === 'Sine Function') ? handleCloseSineInfo : (behaviour === 'Constant Function') ? handleCloseConstantInfo : (behaviour === 'Strictly Increasing Function') ? handleCloseIncreasingInfo : handleCloseNoiseInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div></div></Modal> : null}
        </>
    )
}