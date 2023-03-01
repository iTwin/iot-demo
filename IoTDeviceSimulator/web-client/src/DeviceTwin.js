/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Modal, LabeledInput, ToggleSwitch, toaster, Button, Label, Select, HorizontalTabs, Tab, InputGroup, Radio, MenuItem, Tooltip } from "@itwin/itwinui-react";
import { DeviceAction } from "./Utils";
import { editDeviceTwins, getHeaders } from "./AzureUtilities";
import { editAWSThings } from "./AWSUtililities";
import { ChartComponent } from "./ChartComponent";
import { BehaviourComponent } from "./BehaviourComponent";

let arr = [];
export let currDataArray = [];

export function DeviceTwin(props) {
    const [deviceTwin, setDeviceTwin] = useState({
        deviceAction: props.device.deviceAction!==undefined ? JSON.parse(JSON.stringify(props.device.deviceAction)):"",
        deviceId: props.device.deviceId!==undefined ? JSON.parse(JSON.stringify(props.device.deviceId)) :"" ,
        deviceName: props.device.deviceName!==undefined ? JSON.parse(JSON.stringify(props.device.deviceName)) :"",
        unit: props.device.unit!==undefined? JSON.parse(JSON.stringify(props.device.unit)):"" ,
        phenomenon: props.device.phenomenon!==undefined ? JSON.parse(JSON.stringify(props.device.phenomenon)) :"",
        valueIsBool: props.device.valueIsBool!==undefined? JSON.parse(JSON.stringify(props.device.valueIsBool)):false ,
        telemetrySendInterval: props.device.telemetrySendInterval!==undefined ? JSON.parse(JSON.stringify(props.device.telemetrySendInterval)) :"" ,
        noiseSd: 0.45,
        isRunning: props.device.isRunning!==undefined ? JSON.parse(JSON.stringify(props.device.isRunning)) : false ,
        min: props.device.min!==undefined ? JSON.parse(JSON.stringify(props.device.min)):"",
        max: props.device.max!==undefined ? JSON.parse(JSON.stringify(props.device.max)) :"" ,
        thingTypeName: props.device.thingTypeName!==undefined ? JSON.parse(JSON.stringify(props.device.thingTypeName)) :"" ,
        signalArray: props.device.signalArray!==undefined ? JSON.parse(JSON.stringify(props.device.signalArray)) :"" ,
    
    });
    
    const [behaviour, setBehaviour] = useState("");
    const [index, setIndex] = useState(0);
    const [len, setLen] = useState(50);
    const [tabCount, setTabCount] = useState(0)
    const [compositeSignalDataArrayChanged, setCompositeSignalDataArrayChanged]=useState(false);
    const [newBehaviour, setNewBehaviour]=useState("");
    const url = useMemo(() => process.env.REACT_APP_FUNCTION_URL, []);

    useEffect(() => {
        setDeviceTwin({
            deviceAction: props.device.deviceAction!==undefined ? JSON.parse(JSON.stringify(props.device.deviceAction)):"",
            deviceId: props.device.deviceId!==undefined ? JSON.parse(JSON.stringify(props.device.deviceId)) :"" ,
            deviceName: props.device.deviceName!==undefined ? JSON.parse(JSON.stringify(props.device.deviceName)) :"",
            unit: props.device.unit!==undefined? JSON.parse(JSON.stringify(props.device.unit)):"" ,
            phenomenon: props.device.phenomenon!==undefined ? JSON.parse(JSON.stringify(props.device.phenomenon)) :"",
            valueIsBool: props.device.valueIsBool!==undefined? JSON.parse(JSON.stringify(props.device.valueIsBool)):false ,
            telemetrySendInterval: props.device.telemetrySendInterval!==undefined ? JSON.parse(JSON.stringify(props.device.telemetrySendInterval)) :"" ,
            noiseSd: 0.45,
            isRunning: props.device.isRunning!==undefined ? JSON.parse(JSON.stringify(props.device.isRunning)) : false ,
            min: props.device.min!==undefined ? JSON.parse(JSON.stringify(props.device.min)):"",
            max: props.device.max!==undefined ? JSON.parse(JSON.stringify(props.device.max)) :"" ,
            thingTypeName: props.device.thingTypeName!==undefined ? JSON.parse(JSON.stringify(props.device.thingTypeName)) :"" ,
            signalArray: props.device.signalArray!==undefined ? JSON.parse(JSON.stringify(props.device.signalArray)) : [`{"Behaviour":"Constant","Mean":100}`, `{"Behaviour":"Noise","Noise Magnitude":5,"Noise Standard-deviation":0.45}`],
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
    

    const changeBehaviour = (event) => {
        setBehaviour(event);
    }

    const setBehaviourConfigurer = () => {
        let k = 0;
        const deviceSignalArray= deviceTwin.signalArray;
        if (deviceTwin.signalArray[deviceTwin.signalArray.length - 1] === '') {
            k = 1;
            deviceSignalArray.pop();
        }
                
        if (k===1 && newBehaviour==="") {
            toaster.negative(`Required values are not provided!`);
        }else if(newBehaviour!=="")
        {
            deviceSignalArray.push(newBehaviour);
            setNewBehaviour("");
        }
        
        setTabCount(deviceTwin.signalArray.length+1);
        deviceSignalArray.push("");
        setDeviceTwin({...deviceTwin,signalArray:deviceSignalArray});
        setBehaviour("");
    }

    const handleLength = (event) => {
        setLen(event.target.value);
    }

    const updateDeviceTwin = useCallback(async (event) => {
        event.preventDefault();
        setNewBehaviour("");
        let updatedDevice = false;
        if (deviceTwin.signalArray[deviceTwin.signalArray.length - 1] === "") {
            deviceTwin.signalArray.pop();
        }
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
        const deviceSignalArray=deviceTwin.signalArray;
        for (let i = 0; i < deviceTwin.signalArray.length; i++) {
            if (deviceTwin.signalArray[i] !== '') {
                k += 1;
            }
        }
        if (k === 1 && i === 0) {
            toaster.negative(`Behaviour cannot be empty!`)
        }
        else {
            
            deviceSignalArray.splice(i, 1);                      
            setTabCount(deviceSignalArray.length);
            setDeviceTwin({...deviceTwin,signalArray:deviceSignalArray});
            setBehaviour("");
            setNewBehaviour("");
        }
    }       
    arr = [];

    for (let i = 0; i < len; i++) {
        arr.push(i * (deviceTwin.telemetrySendInterval) / 1000);
    } 
    
    useEffect(()=>{
        currDataArray=[];
        for(let i=0;i<len;i++)
        {
            currDataArray[i]=0;
        }
        getCompositeSignalDataArray();
        setCompositeSignalDataArrayChanged(!compositeSignalDataArrayChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[deviceTwin,len]);

    const getCompositeSignalDataArray=()=>{
        if(deviceTwin.signalArray===undefined)return [];
        for (let i = 0; i < deviceTwin.signalArray.length; i++) {
            if (deviceTwin.signalArray[i] !== '') {
                if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Sine") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Mean"]) + Math.sin((j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000) + JSON.parse(deviceTwin.signalArray[i])["Phase"]) * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]);
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Constant") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Mean"]);
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Linear") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Slope"]) * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000));
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Noise") {
                    let mean = 0;
                    let standard_deviation = parseFloat(deviceTwin.noiseSd);
                    for (let j = 0; j < len; j++) {
                        let x = (Math.random() - 0.5) * 2;
                        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
                        let noise_mag = JSON.parse(deviceTwin.signalArray[i])["Noise Magnitude"] * Math.sign((Math.random() - 0.5) * 2);
                        let currData = noise * noise_mag;
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Triangular") {
                    for (let j = 0; j < len; j++) {
                        let currData = (2 * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * Math.asin(Math.sin((2 * Math.PI * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)))) / Math.PI;                        
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Sawtooth") {
                    for (let j = 0; j < len; j++) {
                        let currData = 2 * parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * ((j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000) - Math.floor(1 / 2 + (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)));
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(deviceTwin.signalArray[i])["Behaviour"] === "Square") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(deviceTwin.signalArray[i])["Amplitude"]) * Math.sign(Math.sin((2 * Math.PI * (j * (parseFloat(deviceTwin.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(deviceTwin.signalArray[i])["Wave Period"]) / 1000)));
                        currDataArray[j] += currData;
                    }
                }
            }
            else {
                for (let j = 0; j < len; j++) {
                    currDataArray[j] += 0;
                }
            }
        }        
    }
  
    const setCurrDataArray=(behaviourDataArray, behaviourObject)=>{        
        if (deviceTwin.signalArray && !deviceTwin.valueIsBool) {
            currDataArray = [];
            for (let i = 0; i < len; i++) {
                currDataArray[i] = (behaviourDataArray[i] ? behaviourDataArray[i] : 0);
            }
            getCompositeSignalDataArray();            
        }
        setNewBehaviour(behaviourObject);                
    }
                
    if (deviceTwin.valueIsBool) {
        currDataArray = [];
        for (let i = 0; i < len; i++) {
            let currData = Math.round(Math.random());
            currDataArray.push(currData);
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
        if (deviceTwin.signalArray[index] === "") {
            return (<div className="behaviour-func">
                <div className="behaviour-list">
                    <Select value={behaviour} placeholder={"Select Behaviour"} options={options} onChange={changeBehaviour} style={{ width: "300px" }} itemRenderer={(option) => (
                        < MenuItem><Tooltip placement="right" content={option.value === 'Sine' ? sineInfo : option.value === 'Constant' ? constantInfo : option.value === 'Linear' ? increasingInfo : option.value === 'Noise' ? noiseInfo : option.value === 'Triangular' ? triangularInfo : option.value === 'Sawtooth' ? sawtoothInfo : squareInfo}><div className="option">{option.label}</div></Tooltip></MenuItem>
                    )} >
                    </Select>
                </div>
                <BehaviourComponent behaviour={behaviour} signalArray="" telemetrySendInterval={deviceTwin.telemetrySendInterval} arrayLength={len} setCurrDataArray={setCurrDataArray}/>
            </div >);
        }
        else {            
            if (deviceTwin.signalArray[index] === undefined) {
                setIndex(0);
            }
            else {            
                return (<div>
                    <div className="behaviour-list">
                        <Select value={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                    </div>
                    <BehaviourComponent behaviour={JSON.parse(deviceTwin.signalArray[index])["Behaviour"]} signalArray={deviceTwin.signalArray[index]} telemetrySendInterval={deviceTwin.telemetrySendInterval} arrayLength={len} setCurrDataArray={setCurrDataArray}/>
                </div>);
            }
        }
    };    
     

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
                                <ToggleSwitch className="basic" label='Is value bool' labelPosition="left" name='valueIsBool' checked={deviceTwin.valueIsBool} onChange={(e) => { setDeviceTwin({ ...deviceTwin, valueIsBool: e.target.checked, unit: "", signalArray: deviceTwin.valueIsBool ? [`{"Behaviour":"Constant","Mean":100}`, `{"Behaviour":"Noise","Noise Magnitude":5,"Noise Standard-deviation":0.45}`] : [] }); if (deviceTwin.valueIsBool) { setTabCount(2); } }} />
                                <LabeledInput className="basic" label='Unit' name='unit' value={deviceTwin.unit} onChange={handleChange} style={{ display: deviceTwin.valueIsBool ? 'none' : 'inline' }} />
                            </div>
                            <div className="behaviour-area">
                                <InputGroup label='No. of datapoints' displayStyle="inline">
                                    <Radio name="choice" value={10} label={'10'} onChange={handleLength} checked={parseFloat(len) === 10?true:false}/>
                                    <Radio name="choice" value={50} label={'50'} onChange={handleLength} checked={parseFloat(len) === 50?true:false}/>
                                    <Radio name="choice" value={100} label={'100'} onChange={handleLength} checked={parseFloat(len) === 100?true:false}/>
                                </InputGroup>

                                <ChartComponent labelsArray={arr} dataArray={currDataArray} chartName="Composite Signal"/>
                                
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
                                                {i + 1 === tabCount ? <div className="add-button" onClick={setBehaviourConfigurer}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M13,9H9v4H7V9H3V7h4V3h2v4h4V9z" /></svg></div> : null}
                                            </div>
                                        ))}
                                        onTabSelected={setIndex}
                                    >
                                        {getContent()}
                                    </HorizontalTabs>
                                    : null}
                            </div>
                        </div>
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