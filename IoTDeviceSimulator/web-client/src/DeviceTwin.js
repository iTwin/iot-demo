/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Modal, LabeledInput, ToggleSwitch, toaster, Button, Label, Select } from "@itwin/itwinui-react";
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
    });
    const [sineConfig, setSineConfig] = useState(false);
    const [constantConfig, setConstantConfig] = useState(false);
    const [sineInfo, setSineInfo] = useState(false);
    const [constantInfo, setConstantInfo] = useState(false);
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
        });
    }, [props]);

    const handleChange = useCallback((event) => {
        event.preventDefault();
        setDeviceTwin({
            ...deviceTwin,
            [event.target.name]: event.target.value,
        });
    }, [deviceTwin]);

    const setChange = useCallback((event) => {
        setDeviceTwin({
            ...deviceTwin,
            behaviour: event,
        });
    }, [deviceTwin]);

    const setSineConfigurer = () => {
        if (deviceTwin.behaviour === 'Sine Function') {
            setConstantConfig(false);
            setSineConfig(true);
        }
    }
    const setConstantConfigurer = () => {
        if (deviceTwin.behaviour === 'Constant Function') {
            setSineConfig(false);
            setConstantConfig(true);
        }
    }
    const setAlert = () => {
        toaster.negative(`Behaviour property can't be empty`);
    }

    const setSineInfoDisplay = () => {
        if (deviceTwin.behaviour === 'Sine Function') {
            setSineInfo(true);
        }
    }
    const setConstantInfoDisplay = () => {
        if (deviceTwin.behaviour === 'Constant Function') {
            setConstantInfo(true);
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
            headers: getHeaders(),
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
    ]

    const handleCloseSineWave = () => {
        setSineConfig(false);
    }

    const handleCloseConstantWave = () => {
        setConstantConfig(false);
    }

    const handleCloseSineInfo = () => {
        setSineInfo(false);
    }

    const handleCloseConstantInfo = () => {
        setConstantInfo(false);
    }

    const configureBehaviour = () => {
        // eslint-disable-next-line no-lone-blocks
        {
            if (deviceTwin.behaviour === 'Sine Function') {
                toaster.informational(`Sine Wave Configured`);
                setSineConfig(false);
            }
            else {
                toaster.informational(`Constant Wave Configured`);
                deviceTwin.amplitude = null;
                deviceTwin.sine_period = null;
                setConstantConfig(false);
            }

        }
    }

    const generateNoise = () => {
        let mean = 0;
        let standard_deviation = parseFloat(deviceTwin.noiseSd);
        // Taken reference from this link for range of x->https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Normal_Distribution_PDF.svg
        let x = (Math.random() - 0.5) * 2;
        // Taken reference from this link for noise value->https://en.wikipedia.org/wiki/Normal_distribution
        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
        let noise_magnitude = deviceTwin.noise_magnitude * Math.sign((Math.random() - 0.5) * 2);
        return noise * noise_magnitude;
    }

    ar = [];
    arr = [];

    if (deviceTwin.behaviour === 'Sine Function') {
        const phase = 0;
        for (let index = 0; index <= 50; index++) {
            let tempData = parseFloat(deviceTwin.mean) + Math.sin(index * (2 * Math.PI) / (parseFloat(deviceTwin.sine_period) / 1000) + phase) * parseFloat(deviceTwin.amplitude);
            let currData = tempData + generateNoise();
            ar.push(currData);
            arr.push(index);
        }
    }
    else {
        for (let index = 0; index <= 50; index++) {
            let tempData = parseFloat(deviceTwin.mean);
            let currData = tempData + generateNoise();
            ar.push(currData);
            arr.push(index);
        }
    }

    const isDisabled = (deviceTwin.valueIsBool) ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '') ? false : true) : (deviceTwin.behaviour === 'Sine Function') ? ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && deviceTwin.mean !== '' && deviceTwin.amplitude !== '' && deviceTwin.sine_period !== '' && deviceTwin.noise_magnitude !== '') ? false : true) : ((deviceTwin.deviceId !== '' && deviceTwin.deviceName !== '' && deviceTwin.phenomenon !== '' && deviceTwin.telemetrySendInterval !== '' && deviceTwin.unit !== '' && deviceTwin.behaviour !== '' && deviceTwin.mean !== '' && deviceTwin.noise_magnitude !== '') ? false : true);

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
                        <LabeledInput label='Device Id' name='deviceId' value={deviceTwin.deviceId}
                            disabled={deviceTwin.deviceAction === DeviceAction.ADD ? false : true}
                            onChange={handleChange} />
                        <LabeledInput label='Device Name' name='deviceName' value={deviceTwin.deviceName} onChange={handleChange} />
                        <LabeledInput label='Phenomenon' name='phenomenon' value={deviceTwin.phenomenon} onChange={handleChange} />
                        <LabeledInput label='Data Period (ms per observation)' name='telemetrySendInterval' value={deviceTwin.telemetrySendInterval} onChange={handleChange} />
                        <ToggleSwitch label='Is value bool' labelPosition="left" name='valueIsBool' checked={deviceTwin.valueIsBool} onChange={(e) => setDeviceTwin({ ...deviceTwin, valueIsBool: e.target.checked, mean: '', amplitude: '', sine_period: '', noise_magnitude: '', unit: '', behaviour: '' })} />
                        <LabeledInput label='Unit' name='unit' value={deviceTwin.unit} onChange={handleChange} style={{ display: deviceTwin.valueIsBool ? 'none' : 'inline' }} />
                        <Label style={{ display: deviceTwin.valueIsBool ? 'none' : 'block' }}>Behaviour</Label>
                        <div className="behaviour-prop" style={{ display: deviceTwin.valueIsBool ? 'none' : 'flex' }}><Select value={deviceTwin.behaviour} placeholder={"Select Behaviour"} options={options} onChange={setChange} style={{ width: "380px" }} ></Select>
                            <div className="button-config" onClick={(deviceTwin.behaviour === 'Sine Function') ? setSineConfigurer : (deviceTwin.behaviour === 'Constant Function') ? setConstantConfigurer : setAlert} ><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m16 9.42256v-2.85566l-2.20352-.44435a6.05356 6.05356 0 0 0 -.37645-.903l1.2427-1.87048-2.01923-2.01931-1.86669 1.24016a6.047 6.047 0 0 0 -.91294-.38153l-.44131-2.18839h-2.85566l-.44131 2.18839a6.0501 6.0501 0 0 0 -.91778.38383l-1.85881-1.23495-2.01924 2.01923 1.2388 1.86464a6.05267 6.05267 0 0 0 -.38067.91511l-2.18789.44119v2.85566l2.20054.44373a6.059 6.059 0 0 0 .37924.90383l-1.24251 1.87034 2.01923 2.01924 1.88089-1.24959a6.049 6.049 0 0 0 .8949.372l.44515 2.20735h2.85566l.44683-2.21567a6.05213 6.05213 0 0 0 .88907-.37186l1.882 1.25026 2.01923-2.01923-1.25089-1.88287a6.04854 6.04854 0 0 0 .37291-.89285zm-8.0053 1.61456a3.04782 3.04782 0 1 1 3.04782-3.04782 3.04781 3.04781 0 0 1 -3.04782 3.04782z" /></svg></div>
                            <div className="button-config" onMouseOver={(deviceTwin.behaviour === 'Sine Function') ? setSineInfoDisplay : setConstantInfoDisplay} onMouseOut={(deviceTwin.behaviour === 'Sine Function') ? handleCloseSineInfo : handleCloseConstantInfo}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,1.5A6.5,6.5,0,1,1,1.5,8,6.50736,6.50736,0,0,1,8,1.5M8,0a8,8,0,1,0,8,8A8.02352,8.02352,0,0,0,8,0ZM9.2,3.2a.92336.92336,0,0,1,1,.9A1.30936,1.30936,0,0,1,8.9,5.3a.94477.94477,0,0,1-1-1A1.22815,1.22815,0,0,1,9.2,3.2Zm-2,9.6c-.5,0-.9-.3-.5-1.7l.6-2.4c.1-.4.1-.5,0-.5-.2-.1-.9.2-1.3.5l-.2-.5A6.49723,6.49723,0,0,1,9.1,6.6c.5,0,.6.6.3,1.6l-.7,2.6c-.1.5-.1.6.1.6a2.00284,2.00284,0,0,0,1.1-.6l.3.4A5.76883,5.76883,0,0,1,7.2,12.8Z" fill="#2b9be3" /></svg></div></div>

                        {deviceTwin.deviceAction === DeviceAction.ADD ?
                            <Button className="buttons" styleType="cta" onClick={addDevice} disabled={isDisabled}> Add </Button>
                            :
                            <Button className="buttons" styleType="cta" onClick={updateDeviceTwin} disabled={isDisabled} > Update </Button>
                        }
                    </div> :
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
                                <tr>
                                    <td className="tableLabelStyle"><Label>Mean</Label></td>
                                    <td className="tableStyle"><Label>{deviceTwin.mean}</Label></td>
                                </tr>
                                {deviceTwin.behaviour === "Sine Function" ?
                                    <>
                                        <tr>
                                            <td className="tableLabelStyle"><Label>Amplitude</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.amplitude}</Label></td>
                                        </tr>
                                        <tr>
                                            <td className="tableLabelStyle"><Label>Sine Period(ms)</Label></td>
                                            <td className="tableStyle"><Label>{deviceTwin.sine_period}</Label></td>
                                        </tr>
                                    </> : <></>
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
            {(deviceTwin.behaviour === 'Sine Function' && sineConfig) ?
                <Modal
                    closeOnExternalClick={false}
                    isOpen={sineConfig}
                    onClose={handleCloseSineWave}
                    title='Configure Sine Function'
                    style={{ margin: "0px 441px 0px 441px" }}
                >
                    <LabeledInput type='number' label='Mean Value' name='mean' value={deviceTwin.mean} onChange={handleChange} />
                    <LabeledInput type='number' label='Amplitude' name='amplitude' value={deviceTwin.amplitude} onChange={handleChange} />
                    <LabeledInput type='number' label='Period(ms)' name='sine_period' value={deviceTwin.sine_period} onChange={handleChange} />
                    <LabeledInput type='number' label='Noise-Magnitude' name='noise_magnitude' value={deviceTwin.noise_magnitude} onChange={handleChange} />
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
                    <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(deviceTwin.mean !== '' && deviceTwin.amplitude !== '' && deviceTwin.sine_period !== '' && deviceTwin.noise_magnitude !== '' && deviceTwin.noiseSd !== '') ? false : true}> Accept </Button>
                </Modal> : (deviceTwin.behaviour === 'Constant Function' && constantConfig) ? <Modal
                    closeOnExternalClick={false}
                    isOpen={constantConfig}
                    onClose={handleCloseConstantWave}
                    title='Configure Constant Function'
                    style={{ margin: "0px 441px 0px 441px" }}
                >
                    <LabeledInput type='number' label='Mean Value' name='mean' value={deviceTwin.mean} onChange={handleChange} />
                    <LabeledInput type='number' label='Noise-Magnitude' name='noise_magnitude' value={deviceTwin.noise_magnitude} onChange={handleChange} />
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
                    <Button className="buttons" styleType="cta" onClick={configureBehaviour} disabled={(deviceTwin.mean !== '' && deviceTwin.noise_magnitude !== '' && deviceTwin.noiseSd !== '') ? false : true} > Accept </Button>
                </Modal> : null
            }
            {(deviceTwin.behaviour === 'Sine Function' && sineInfo) ?
                <Modal
                    closeOnExternalClick={true}
                    isOpen={sineInfo}
                    style={{ margin: "315px 200px 0px 200px" }}
                    isDismissible={false}
                >
                    <div>A sinusoidal wave is a mathematical curve defined in terms of the sine trigonometric function, of which it is the graph.</div>
                </Modal> : (deviceTwin.behaviour === 'Constant Function' && constantInfo) ? <Modal
                    closeOnExternalClick={true}
                    isOpen={constantInfo}
                    style={{ margin: "315px 200px 0px 200px" }}
                    isDismissible={false}
                >
                    <div>A constant wave is a wave that is same everywhere and having the same value of range for different values of the domain.</div>
                </Modal> : null
            }
        </>
    )
}