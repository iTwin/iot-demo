/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Modal, LabeledInput, ToggleSwitch, toaster, Button, Label, Select, HorizontalTabs, Tab, InputGroup, Radio, MenuItem, Tooltip } from "@itwin/itwinui-react";
import { DeviceAction } from "./Utils";
import { Line } from 'react-chartjs-2'
import { editDeviceTwins, getHeaders } from "./AzureUtilities";
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
        noiseSd: props.device.noiseSd,
        isRunning: props.device.isRunning,
        min: props.device.min,
        max: props.device.max,
        thingTypeName: props.device.thingTypeName,
        currDataArray: props.device.currDataArray,
        signalArray: props.device.signalArray,
    });

    const [behaviourConfig, setBehaviourConfig] = useState(false);
    const [mean, setMean] = useState("");
    const [amplitude, setAmplitude] = useState("");
    const [wave_period, setWave_period] = useState("");
    const [noise_magnitude, setNoise_magnitude] = useState("");
    const [slope, setSlope] = useState("");
    const [behaviour, setBehaviour] = useState("Noise");
    const [index, setIndex] = useState(0);
    const [len, setLen] = useState("0");
    const [tabCount, setTabCount] = useState(0)
    const url = useMemo(() => process.env.REACT_APP_FUNCTION_URL, []);

    useEffect(() => {
        setDeviceTwin({
            deviceAction: props.device.deviceAction,
            deviceId: props.device.deviceId ?? '',
            deviceName: props.device.deviceName ?? '',
            unit: props.device.unit ?? '',
            phenomenon: props.device.phenomenon ?? '',
            valueIsBool: props.device.valueIsBool ?? false,
            telemetrySendInterval: props.device.telemetrySendInterval ?? '',
            noiseSd: 0.45,
            isRunning: props.device.isRunning ?? false,
            min: props.device.min ?? '',
            max: props.device.max ?? '',
            thingTypeName: props.device.thingTypeName ?? '',
            currDataArray: props.device.currDataArray ?? [],
            signalArray: props.device.signalArray ?? [`{"Behaviour":"Constant","Mean":100}`, `{"Behaviour":"Noise","Noise Magnitude":5,"Noise Standard-deviation":0.45}`],
        });
        setTabCount(props.device.signalArray?.length ?? 2);
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

    const changeWave_period = (event) => {
        setWave_period(event.target.value);
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

    const setBehaviourConfigurer = () => {
        setTabCount(deviceTwin.signalArray.length + 1);
        if (deviceTwin.signalArray[deviceTwin.signalArray.length - 1] === '') {
            deviceTwin.signalArray.pop();
        }
        if (behaviour === 'Sine' && mean !== '' && amplitude !== '' && wave_period !== '') {
            const sineObj = `{"Behaviour":"Sine","Mean":${mean},"Amplitude":${amplitude},"Wave Period":${wave_period},"Phase":"0"}`;
            deviceTwin.signalArray.push(sineObj);
            setMean("");
            setAmplitude("");
            setWave_period("");
        }
        else if (behaviour === 'Constant' && mean !== '') {
            const constObj = `{"Behaviour":"Constant","Mean":${mean}}`;
            deviceTwin.signalArray.push(constObj);
            setMean("");
        }
        else if (behaviour === 'Linear' && slope !== '') {
            const increasingObj = `{"Behaviour":"Linear","Slope":${slope}}`;
            deviceTwin.signalArray.push(increasingObj);
            setSlope("");
        }
        else if (behaviour === 'Noise' && noise_magnitude !== '') {
            const noiseObj = `{"Behaviour":"Noise","Noise Magnitude":${noise_magnitude},"Noise Standard-deviation":${deviceTwin.noiseSd}}`;
            deviceTwin.signalArray.push(noiseObj);
            setNoise_magnitude("");
        }
        else if (behaviour === 'Triangular' && amplitude !== '' && wave_period !== '') {
            const triangularObj = `{"Behaviour":"Triangular","Amplitude":${amplitude},"Wave Period":${wave_period}}`;
            deviceTwin.signalArray.push(triangularObj);
            setAmplitude("");
            setWave_period("");
        }
        else if (behaviour === 'Sawtooth' && amplitude !== '' && wave_period !== '') {
            const sawtoothObj = `{"Behaviour":"Sawtooth","Amplitude":${amplitude},"Wave Period":${wave_period}}`;
            deviceTwin.signalArray.push(sawtoothObj);
            setAmplitude("");
            setWave_period("");
        }
        else if (behaviour === 'Square' && amplitude !== '' && wave_period !== '') {
            const squareObj = `{"Behaviour":"Square","Amplitude":${amplitude},"Wave Period":${wave_period}}`;
            deviceTwin.signalArray.push(squareObj);
            setAmplitude("");
            setWave_period("");
        }
        deviceTwin.signalArray.push("");
        setBehaviourConfig(true);
        setBehaviour("");
    }

    const handleLength = (event) => {
        setLen(event.target.value);
    }

    const updateDeviceTwin = useCallback(async (event) => {
        event.preventDefault();
        let updatedDevice = false;
        if (props.connection.includes("Azure")) {
            if (deviceTwin.signalArray[deviceTwin.signalArray.length - 1] === "") {
                deviceTwin.signalArray.pop();
            }
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
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).catch(error => console.log("Request failed: " + error));
        if (response && response.status === 200) {
            if (deviceTwin.signalArray[deviceTwin.signalArray.length - 1] === "") {
                deviceTwin.signalArray.pop();
            }
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
        // setIndex(0);
        // setBehaviour("Noise");
        // setLength("");
    }, [props]);

    const options = [
        { value: 'Sine', label: 'Sine' },
        { value: 'Constant', label: 'Constant' },
        { value: 'Linear', label: 'Linear' },
        { value: 'Noise', label: 'Gaussian Noise' },
        { value: 'Triangular', label: 'Triangular' },
        { value: 'Sawtooth', label: 'Sawtooth' },
        { value: 'Square', label: 'Square' },
    ]

    const removeBehaviour = (i) => {
        let k = 0;
        for (let i = 0; i < deviceTwin.signalArray.length; i++) {
            if (deviceTwin.signalArray[i] !== '') {
                k += 1;
            }
        }
        if (k === 1 && i === 0) {
            toaster.negative(`There should be atleast one behaviour`)
        }
        else {
            setTabCount(deviceTwin.signalArray.length - 1);
            deviceTwin.signalArray.splice(i, 1);
        }
    }

    ar = [];
    arr = [];

    for (let i = 0; i < parseFloat(len); i++) {
        arr.push(i * (deviceTwin.telemetrySendInterval) / 1000);
    }

    if (behaviour === 'Sine') {
        const phase = 0;
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = parseFloat(mean) + Math.sin((i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(wave_period) / 1000) + phase) * parseFloat(amplitude);
            ar.push(currData);
        }
    }
    else if (behaviour === 'Constant') {
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = parseFloat(mean);
            ar.push(currData);
        }
    }
    else if (behaviour === 'Linear') {
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = parseFloat(slope) * ((i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)));
            ar.push(currData);
        }
    }
    else if (behaviour === 'Noise') {
        let mean = 0;
        let standard_deviation = parseFloat(deviceTwin.noiseSd);
        for (let i = 0; i < parseFloat(len); i++) {
            let x = (Math.random() - 0.5) * 2;
            let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
            let noise_mag = noise_magnitude * Math.sign((Math.random() - 0.5) * 2);
            let currData = noise * noise_mag;
            ar.push(currData);
        }
    }
    else if (behaviour === 'Triangular') {
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = (2 * parseFloat(amplitude) * Math.asin(Math.sin((2 * Math.PI * (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(wave_period) / 1000)))) / Math.PI;
            ar.push(currData);
        }
    }
    else if (behaviour === 'Sawtooth') {
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = 2 * parseFloat(amplitude) * ((i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(wave_period) / 1000) - Math.floor(1 / 2 + (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(wave_period) / 1000)));
            ar.push(currData);
        }
    }
    else if (behaviour === 'Square') {
        for (let i = 0; i < parseFloat(len); i++) {
            let currData = parseFloat(amplitude) * Math.sign(Math.sin((2 * Math.PI * (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(wave_period) / 1000)));
            ar.push(currData);
        }
    }

    if (deviceTwin.signalArray && !deviceTwin.valueIsBool) {
        deviceTwin.currDataArray = [];
        for (let i = 0; i < parseFloat(len); i++) {
            deviceTwin.currDataArray[i] = (ar[i] ? ar[i] : 0);
        }
        for (let i = 0; i < deviceTwin.signalArray.length; i++) {
            if (deviceTwin.signalArray[i] !== '') {
                if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Sine") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Mean"]) + Math.sin((j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000) + JSON.parse(deviceTwin.signalArray[i])["Phase"]) * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]);
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Constant") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Mean"]);
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Linear") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Slope"]) * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000));
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Noise") {
                    let mean = 0;
                    let standard_deviation = parseFloat(deviceTwin.noiseSd);
                    for (let j = 0; j < parseFloat(len); j++) {
                        let x = (Math.random() - 0.5) * 2;
                        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
                        let noise_mag = JSON.parse(deviceTwin.signalArray[i])["Noise Magnitude"] * Math.sign((Math.random() - 0.5) * 2);
                        let currData = noise * noise_mag;
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Triangular") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = (2 * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * Math.asin(Math.sin((2 * Math.PI * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)))) / Math.PI;
                        ar.push(currData);
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Sawtooth") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = 2 * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * ((j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000) - Math.floor(1 / 2 + (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)));
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Square") {
                    for (let j = 0; j < parseFloat(len); j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * Math.sign(Math.sin((2 * Math.PI * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)));
                        deviceTwin.currDataArray[j] += currData;
                    }
                }
            }
            else {
                for (let j = 0; j < parseFloat(len); j++) {
                    let currData = 0;
                    deviceTwin.currDataArray[j] += currData;
                }
            }
        }
    }

    const sineInfo = "A sinusoidal wave is a mathematical curve defined in terms of the sine trigonometric function, of which it is the graph.";
    const constantInfo = "A constant wave is a wave that is same everywhere & having the same value of range for different values of the domain.";
    const increasingInfo = "A stricty increasing wave is a wave in which Y-value increases with the increasing value on X-axis.";
    const noiseInfo = "A noise wave is an unwanted random disturbance of a signal.";
    const triangularInfo = "A triangular wave or triangle wave is a non-sinusoidal waveform named for its triangular shape.";
    const sawtoothInfo = "The sawtooth wave is a kind of non-sinusoidal waveform named for its resemblance to the teeth of a plain-toothed saw with a zero rake angle.";
    const squareInfo = "A square wave is a non-sinusoidal periodic wave in which the amplitude alternates at a steady frequency between fixed min & max values, with the same duration at min & max.";

    const getContent = () => {
        console.log(index);
        if (deviceTwin.signalArray[index] === "") {
            return (<div className="behaviour-func">
                <div className="behaviour-list">
                    <Select value={behaviour} placeholder={"Select Behaviour"} options={options} onChange={changeBehaviour} style={{ width: "300px" }} itemRenderer={(option) => (
                        < MenuItem><Tooltip placement="right" content={option.value === 'Sine' ? sineInfo : option.value === 'Constant' ? constantInfo : option.value === 'Linear' ? increasingInfo : option.value === 'Noise' ? noiseInfo : option.value === 'Triangular' ? triangularInfo : option.value === 'Sawtooth' ? sawtoothInfo : squareInfo}><div>{option.label}</div></Tooltip></MenuItem>
                    )} >
                    </Select>
                    {/* <div className="button-config" onMouseOver={(behaviour === 'Sine') ? setSineInfoDisplay : (behaviour === 'Constant') ? setConstantInfoDisplay : (behaviour === 'Linear') ? setIncreasingInfoDisplay : (behaviour === 'Noise') ? setNoiseInfoDisplay : (behaviour === 'Triangular') ? setTriangularInfoDisplay : (behaviour === 'Sawtooth') ? setSawtoothInfoDisplay : (behaviour === 'Square') ? setSquareInfoDisplay : null} onMouseOut={(behaviour === 'Sine') ? handleCloseSineInfo : (behaviour === 'Constant') ? handleCloseConstantInfo : (behaviour === 'Linear') ? handleCloseIncreasingInfo : (behaviour === 'Noise') ? handleCloseNoiseInfo : (behaviour === 'Triangular') ? handleCloseTriangularInfo : (behaviour === 'Sawtooth') ? handleCloseSawtoothInfo : (behaviour === 'Square') ? handleCloseSquareInfo : null}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                </div>
                {
                    behaviour === "Sine" ?
                        <div className="behaviour-prop">
                            <div className="behaviour-value">
                                <LabeledInput className="labels" type='number' label='Mean' name='mean' value={mean} onChange={changeMean} />
                                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={amplitude} onChange={changeAmplitude} />
                                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={wave_period} onChange={changeWave_period} />
                            </div >
                            <div className="preview">
                                <Line
                                    data={{
                                        labels: arr,
                                        datasets: [
                                            {
                                                label: "Component Signal",
                                                data: ar,
                                                fill: false,
                                                borderColor: "rgb(0,139,225)",
                                                borderWidth: 2,
                                                // lineTension: 0,
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
                                            xAxes: [
                                                {
                                                    scaleLabel: {
                                                        display: true,
                                                        labelString: 'Time (second)',
                                                        fontColor: "rgb(0,139,225)"
                                                    }
                                                }
                                            ]
                                        },
                                        legend: {
                                            labels: {
                                                fontSize: 15,
                                                fontColor: "rgb(0,139,225)",
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div > : behaviour === "Constant" ?
                            <div className="behaviour-prop">
                                <div className="behaviour-value">
                                    <LabeledInput className="labels" type='number' label='Mean' name='mean' value={mean} onChange={changeMean} />
                                </div>
                                <div className="preview">
                                    <Line
                                        data={{
                                            labels: arr,
                                            datasets: [
                                                {
                                                    label: "Component Signal",
                                                    data: ar,
                                                    fill: false,
                                                    borderColor: "rgb(0,139,225)",
                                                    borderWidth: 2,
                                                    // lineTension: 0,
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
                                                xAxes: [
                                                    {
                                                        scaleLabel: {
                                                            display: true,
                                                            labelString: 'Seconds',
                                                            fontColor: "rgb(0,139,225)"
                                                        }
                                                    }
                                                ]
                                            },
                                            legend: {
                                                labels: {
                                                    fontSize: 15,
                                                    fontColor: "rgb(0,139,225)",
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div> : behaviour === "Linear" ?
                                <div className="behaviour-prop">
                                    <div className="behaviour-value">
                                        <LabeledInput className="labels" type='number' label='Slope' name='slope' value={slope} onChange={changeSlope} />
                                    </div>
                                    <div className="preview">
                                        <Line
                                            data={{
                                                labels: arr,
                                                datasets: [
                                                    {
                                                        label: "Component Signal",
                                                        data: ar,
                                                        fill: false,
                                                        borderColor: "rgb(0,139,225)",
                                                        borderWidth: 2,
                                                        // lineTension: 0,
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
                                                    xAxes: [
                                                        {
                                                            scaleLabel: {
                                                                display: true,
                                                                labelString: 'Seconds',
                                                                fontColor: "rgb(0,139,225)"
                                                            }
                                                        }
                                                    ]
                                                },
                                                legend: {
                                                    labels: {
                                                        fontSize: 15,
                                                        fontColor: "rgb(0,139,225)",
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div> : behaviour === "Noise" ?
                                    <div className="behaviour-prop">
                                        <div className="behaviour-value">
                                            <LabeledInput className="labels" type='number' label='Magnitude' name='noise_magnitude' value={noise_magnitude} onChange={changeNoise_magnitude} />
                                            <LabeledInput className="labels" type='number' label='Deviation' name='noiseSd' value={0.45} disabled={true} />
                                        </div>
                                        <div className="preview">
                                            <Line
                                                data={{
                                                    labels: arr,
                                                    datasets: [
                                                        {
                                                            label: "Component Signal",
                                                            data: ar,
                                                            fill: false,
                                                            borderColor: "rgb(0,139,225)",
                                                            borderWidth: 2,
                                                            // lineTension: 0,
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
                                                        xAxes: [
                                                            {
                                                                scaleLabel: {
                                                                    display: true,
                                                                    labelString: 'Seconds',
                                                                    fontColor: "rgb(0,139,225)"
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    legend: {
                                                        labels: {
                                                            fontSize: 15,
                                                            fontColor: "rgb(0,139,225)",
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div> : behaviour === "Triangular" ?
                                        <div className="behaviour-prop">
                                            <div className="behaviour-value">
                                                <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={amplitude} onChange={changeAmplitude} />
                                                <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={wave_period} onChange={changeWave_period} />
                                            </div>
                                            <div className="preview">
                                                <Line
                                                    data={{
                                                        labels: arr,
                                                        datasets: [
                                                            {
                                                                label: "Component Signal",
                                                                data: ar,
                                                                fill: false,
                                                                borderColor: "rgb(0,139,225)",
                                                                borderWidth: 2,
                                                                // lineTension: 0,
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
                                                            xAxes: [
                                                                {
                                                                    scaleLabel: {
                                                                        display: true,
                                                                        labelString: 'Seconds',
                                                                        fontColor: "rgb(0,139,225)"
                                                                    }
                                                                }
                                                            ]
                                                        },
                                                        legend: {
                                                            labels: {
                                                                fontSize: 15,
                                                                fontColor: "rgb(0,139,225)",
                                                            },
                                                        },
                                                    }}
                                                />
                                            </div>
                                        </div> : behaviour === "Sawtooth" ?
                                            <div className="behaviour-prop">
                                                <div className="behaviour-value">
                                                    <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={amplitude} onChange={changeAmplitude} />
                                                    <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={wave_period} onChange={changeWave_period} />
                                                </div>
                                                <div className="preview">
                                                    <Line
                                                        data={{
                                                            labels: arr,
                                                            datasets: [
                                                                {
                                                                    label: "Component Signal",
                                                                    data: ar,
                                                                    fill: false,
                                                                    borderColor: "rgb(0,139,225)",
                                                                    borderWidth: 2,
                                                                    // lineTension: 0,
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
                                                                xAxes: [
                                                                    {
                                                                        scaleLabel: {
                                                                            display: true,
                                                                            labelString: 'Seconds',
                                                                            fontColor: "rgb(0,139,225)"
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            legend: {
                                                                labels: {
                                                                    fontSize: 15,
                                                                    fontColor: "rgb(0,139,225)",
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div> : behaviour === "Square" ?
                                                <div className="behaviour-prop">
                                                    <div className="behaviour-value">
                                                        <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={amplitude} onChange={changeAmplitude} />
                                                        <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={wave_period} onChange={changeWave_period} />
                                                    </div>
                                                    <div className="preview">
                                                        <Line
                                                            data={{
                                                                labels: arr,
                                                                datasets: [
                                                                    {
                                                                        label: "Component Signal",
                                                                        data: ar,
                                                                        fill: false,
                                                                        borderColor: "rgb(0,139,225)",
                                                                        borderWidth: 2,
                                                                        // lineTension: 0,
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
                                                                    xAxes: [
                                                                        {
                                                                            scaleLabel: {
                                                                                display: true,
                                                                                labelString: 'Seconds',
                                                                                fontColor: "rgb(0,139,225)"
                                                                            }
                                                                        }
                                                                    ]
                                                                },
                                                                legend: {
                                                                    labels: {
                                                                        fontSize: 15,
                                                                        fontColor: "rgb(0,139,225)",
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </div>
                                                </div> : null
                }
            </div >);
        }
        else {
            if (deviceTwin.signalArray[index] === undefined) {
                setIndex(0);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Sine") {
                let arr2 = [];
                const phase = 0;
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = parseFloat(JSON.parse(deviceTwin.signalArray[index])["Mean"]) + Math.sin((i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(JSON.parse(deviceTwin.signalArray[index])["Wave Period"]) / 1000) + phase) * parseFloat(JSON.parse(deviceTwin.signalArray[index])["Amplitude"]);
                    arr2.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setSineInfoDisplay} onMouseOut={handleCloseSineInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Mean' name='mean' value={JSON.parse(deviceTwin.signalArray[index])["Mean"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={JSON.parse(deviceTwin.signalArray[index])["Amplitude"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={JSON.parse(deviceTwin.signalArray[index])["Wave Period"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr2,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div ></div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Constant") {
                let arr3 = [];
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = parseFloat(JSON.parse(deviceTwin.signalArray[index])["Mean"]);
                    arr3.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setConstantInfoDisplay} onMouseOut={handleCloseConstantInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Mean' name='mean' value={JSON.parse(deviceTwin.signalArray[index])["Mean"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr3,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Linear") {
                let arr4 = [];
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = parseFloat(JSON.parse(deviceTwin.signalArray[index])["Slope"]) * (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000));
                    arr4.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setIncreasingInfoDisplay} onMouseOut={handleCloseIncreasingInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div><div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Slope' name='slope' value={JSON.parse(deviceTwin.signalArray[index])["Slope"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr4,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Noise") {
                let arr5 = [];
                let mean = 0;
                let standard_deviation = parseFloat(deviceTwin.noiseSd);
                for (let i = 0; i < parseFloat(len); i++) {
                    let x = (Math.random() - 0.5) * 2;
                    let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
                    let noise_mag = JSON.parse(deviceTwin.signalArray[index])["Noise Magnitude"] * Math.sign((Math.random() - 0.5) * 2);
                    let currData = noise * noise_mag;
                    arr5.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setNoiseInfoDisplay} onMouseOut={handleCloseNoiseInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Magnitude' name='noise_magnitude' value={JSON.parse(deviceTwin.signalArray[index])["Noise Magnitude"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Deviation' name='noiseSd' value={0.45} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr5,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Triangular") {
                let arr6 = [];
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = (2 * parseFloat(JSON.parse(deviceTwin.signalArray[index])["Amplitude"]) * Math.asin(Math.sin((2 * Math.PI * (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[index])["Wave Period"]) / 1000)))) / Math.PI;
                    arr6.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setTriangularInfoDisplay} onMouseOut={handleCloseTriangularInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={JSON.parse(deviceTwin.signalArray[index])["Amplitude"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={JSON.parse(deviceTwin.signalArray[index])["Wave Period"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr6,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Sawtooth") {
                let arr7 = [];
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = 2 * parseFloat(JSON.parse(deviceTwin.signalArray[index])["Amplitude"]) * ((i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[index])["Wave Period"]) / 1000) - Math.floor(1 / 2 + (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[index])["Wave Period"]) / 1000)));
                    arr7.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setSawtoothInfoDisplay} onMouseOut={handleCloseSawtoothInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={JSON.parse(deviceTwin.signalArray[index])["Amplitude"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={JSON.parse(deviceTwin.signalArray[index])["Wave Period"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr7,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else if (JSON.parse(deviceTwin.signalArray[index])["Behaviour"] === "Square") {
                let arr8 = [];
                for (let i = 0; i < parseFloat(len); i++) {
                    let currData = parseFloat(JSON.parse(deviceTwin.signalArray[index])["Amplitude"]) * Math.sign(Math.sin((2 * Math.PI * (i * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[index])["Wave Period"]) / 1000)));
                    arr8.push(currData);
                }
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                        {/* <div className="button-config" onMouseOver={setSquareInfoDisplay} onMouseOut={handleCloseSquareInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div> */}
                    </div>
                    <div className="behaviour-prop">
                        <div className="behaviour-value">
                            <LabeledInput className="labels" type='number' label='Amplitude' name='amplitude' value={JSON.parse(deviceTwin.signalArray[index])["Amplitude"]} disabled={true} />
                            <LabeledInput className="labels" type='number' label='Period(ms)' name='wave_period' value={JSON.parse(deviceTwin.signalArray[index])["Wave Period"]} disabled={true} />
                        </div >
                        <div className="preview">
                            <Line
                                data={{
                                    labels: arr,
                                    datasets: [
                                        {
                                            label: "Component Signal",
                                            data: arr8,
                                            fill: false,
                                            borderColor: "rgb(0,139,225)",
                                            borderWidth: 2,
                                            // lineTension: 0,
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
                                        xAxes: [
                                            {
                                                scaleLabel: {
                                                    display: true,
                                                    labelString: 'Seconds',
                                                    fontColor: "rgb(0,139,225)"
                                                }
                                            }
                                        ]
                                    },
                                    legend: {
                                        labels: {
                                            fontSize: 15,
                                            fontColor: "rgb(0,139,225)",
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div >
                </div>);
            }
            else {
                return null;
            }
        }
    };

    console.log(tabCount);

    // const isDisabled = (deviceTwin.valueIsBool) ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '') ? false : true) : (deviceTwin.behaviour === 'Sine') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && mean !== '' && amplitude !== '' && wave_period !== '') ? false : true) : (deviceTwin.behaviour === 'Constant') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && mean !== '') ? false : true) : (deviceTwin.behaviour === 'Linear') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && slope !== '') ? false : true) : ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && noise_magnitude !== '' && deviceTwin.noiseSd !== '') ? false : true);
    return (
        <>
            <Modal
                closeOnExternalClick={false}
                isOpen={props.isOpen}
                onClose={onClose}
                title={deviceTwin.deviceAction === DeviceAction.ADD ? 'Add Device' : props.isAdmin ? 'Update Device' : 'Device Properties'}
            >
                {props.isAdmin ?
                    <div>
                        <div className="mainBox">
                            <div className="basic-prop">
                                <LabeledInput className="basic" label='Device Id' name='deviceId' value={deviceTwin.deviceId}
                                    disabled={deviceTwin.deviceAction === DeviceAction.ADD ? false : true}
                                    onChange={handleChange} />
                                <LabeledInput className="basic" label='Device Name' name='deviceName' value={deviceTwin.deviceName} onChange={handleChange} />
                                <LabeledInput className="basic" label='Phenomenon' name='phenomenon' value={deviceTwin.phenomenon} onChange={handleChange} />
                                <LabeledInput className="basic" label='Data Period (ms per observation)' name='telemetrySendInterval' value={deviceTwin.telemetrySendInterval} onChange={handleChange} />
                                <ToggleSwitch className="basic" label='Is value bool' labelPosition="left" name='valueIsBool' checked={deviceTwin.valueIsBool} onChange={(e) => { setDeviceTwin({ ...deviceTwin, valueIsBool: e.target.checked, signalArray: deviceTwin.valueIsBool ? [`{"Behaviour":"Constant","Mean":100}`, `{"Behaviour":"Noise","Noise Magnitude":5,"Noise Standard-deviation":0.45}`] : [], currDataArray: Array.from({ length: len }, () => deviceTwin.valueIsBool ? 0 : Math.round(Math.random())) }); }} />
                                <LabeledInput className="basic" label='Unit' name='unit' value={deviceTwin.unit} onChange={handleChange} style={{ display: deviceTwin.valueIsBool ? 'none' : 'inline' }} />
                            </div>
                            <div className="behaviour-area">
                                <InputGroup label='No. of datapoints' displayStyle="inline">
                                    <Radio name="choice" value={10} label={'10'} onChange={handleLength} />
                                    <Radio name="choice" value={50} label={'50'} onChange={handleLength} />
                                    <Radio name="choice" value={100} label={'100'} onChange={handleLength} />
                                </InputGroup>
                                <div className="main-preview">
                                    <Line
                                        data={{
                                            labels: arr,
                                            datasets: [
                                                {
                                                    label: "Composite Signal",
                                                    data: deviceTwin.currDataArray,
                                                    fill: false,
                                                    borderColor: "rgb(0,139,225)",
                                                    borderWidth: 2,
                                                    // lineTension: 0.5,
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
                                                xAxes: [
                                                    {
                                                        scaleLabel: {
                                                            display: true,
                                                            labelString: 'Seconds',
                                                            fontColor: "rgb(0,139,225)"
                                                        }
                                                    }
                                                ]
                                            },
                                            legend: {
                                                labels: {
                                                    fontSize: 15,
                                                    fontColor: "rgb(0,139,225)",
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                {deviceTwin.signalArray && !deviceTwin.valueIsBool ?
                                    <HorizontalTabs
                                        style={{ overflow: "scroll", width: "400px" }}
                                        labels={Array(tabCount).fill(null).map((_, i) => (
                                            <div className="tab-label">
                                                <Tab
                                                    key={i}
                                                    label={deviceTwin.signalArray[i] ? JSON.parse(deviceTwin.signalArray[i])["Behaviour"] : 'New'}
                                                />
                                                <div className="cancel-button" onClick={function () { removeBehaviour(i); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                                                {i + 1 === deviceTwin.signalArray.length ? <div className="add-button" onClick={setBehaviourConfigurer}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M13,9H9v4H7V9H3V7h4V3h2v4h4V9z" /></svg></div> : null}
                                            </div>
                                        ))}
                                        onTabSelected={setIndex}
                                        focusActivationMode="auto"
                                        color="blue"
                                    >
                                        {getContent()}
                                    </HorizontalTabs>
                                    : null}
                            </div>
                        </div>
                        {/* {deviceTwin.signalArray ? deviceTwin.signalArray.map((item, index) =>
                        (<div key={index} className="funcElement">
                            <Label>{item}</Label>
                            <div className="button-config" onClick={function () { removeBehaviour({ index }); }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M14.7 2.7 13.3 1.3 8 6.6 2.7 1.3 1.3 2.7 6.6 8 1.3 13.3 2.7 14.7 8 9.4 13.3 14.7 14.7 13.3 9.4 8z" /></svg></div>
                        </div>)) : <div></div>} */}
                        {deviceTwin.deviceAction === DeviceAction.ADD ?
                            <Button className="buttons" styleType="high-visibility" onClick={addDevice}> Add </Button> : <Button className="buttons" styleType="high-visibility" onClick={updateDeviceTwin}  > Update </Button>}
                    </div>
                    : <table>
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
                                {deviceTwin.behaviour === "Sine" ?
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
                                            <td className="tableLabelStyle"><Label>Wave Period(ms)</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.wave_period}</Label></td>
                                        </tr>
                                    </> : deviceTwin.behaviour === "Constant" ?
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
            </Modal >
        </>
    )
}