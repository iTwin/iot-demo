/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Modal, LabeledInput, ToggleSwitch, toaster, Button, Label, Select, HorizontalTabs, Tab, InputGroup, Radio, MenuItem, Tooltip, Table, LabeledSelect } from "@itwin/itwinui-react";
import { DeviceAction } from "./Utils";
import { editTwins, getHeaders } from "./AzureUtilities";
import { editAWSThings } from "./AWSUtililities";
import { ChartComponent } from "./ChartComponent";
import { BehaviourComponent } from "./BehaviourComponent";
import { Tabs} from '@itwin/itwinui-react/esm/core/Tabs/Tabs';
import { getDataFromAzure} from "./AzureUtilities";

// import App from './App';
let arr = [];
export let currDataArray = [];

export function AddTelemetryPoint(props) {

    const [telemetryPoint, setTelemetryPoint] = useState({
        deviceAction: props.device.deviceAction!==undefined ? JSON.parse(JSON.stringify(props.device.deviceAction)):"",
        deviceId: props.device.deviceId!==undefined ? JSON.parse(JSON.stringify(props.device.deviceId)) :"" ,
        telemetryId: props.device.telemetryId!==undefined ? JSON.parse(JSON.stringify(props.device.telemetryId)) :"" ,
        telemetryName: props.device.telemetryName!==undefined ? JSON.parse(JSON.stringify(props.device.telemetryName)) :"",
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
    const [tabIndex, setTabIndex] = React.useState(0);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [deviceList, setDeviceList] = useState([]);

    useEffect(() => {
        getDeviceList();
    },[props]);

    useEffect(() => {
        setTelemetryPoint({
            deviceAction: props.device.deviceAction!==undefined ? JSON.parse(JSON.stringify(props.device.deviceAction)):"",
            telemetryId: props.device.telemetryId!==undefined ? JSON.parse(JSON.stringify(props.device.telemetryId)) :"" ,
            deviceId: props.device.deviceId!==undefined ? JSON.parse(JSON.stringify(props.device.deviceId)) :"" ,
            telemetryName: props.device.telemetryName!==undefined ? JSON.parse(JSON.stringify(props.device.telemetryName)) :"",
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
        setSelectedDeviceId(props.device.deviceId);
    }, [props]);
   
    const handleChange = (event) => {
        event.preventDefault();
        if(event.target.name === 'telemetryId'){
            deviceList.forEach(async (twin) => {
                if (selectedDeviceId === twin.deviceId){
                    if(!twin.telemetryIds.includes(event.target.value)){
                        setTelemetryPoint((telemetryPoint)=>({
                            ...telemetryPoint,
                            [event.target.name]: event.target.value,
                        }));
                    }
                    else{
                        console.log(`TelemetryId ${event.target.value}  already present`);
                    }
                }
            });
        }
        else{
            setTelemetryPoint((telemetryPoint)=>({
                ...telemetryPoint,
                [event.target.name]: event.target.value,
            }));
        }
    };
    

    const changeBehaviour = (event) => {
        setBehaviour(event);
    }

    const setBehaviourConfigurer = () => {
        let k = 0;
        const deviceSignalArray= telemetryPoint.signalArray;
        if (telemetryPoint.signalArray[telemetryPoint.signalArray.length - 1] === '') {
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
        
        setTabCount(telemetryPoint.signalArray.length+1);
        deviceSignalArray.push("");
        setTelemetryPoint((telemetryPoint)=>({...telemetryPoint,signalArray:deviceSignalArray}));
        setBehaviour("");
    }

    const handleLength = (event) => {
        setLen(event.target.value);
    }

    const updateTelemetryPoint = useCallback(async (event) => {
        event.preventDefault();
        setNewBehaviour("");
        let updatedDevice = false;
        if (telemetryPoint.signalArray[telemetryPoint.signalArray.length - 1] === "") {
            telemetryPoint.signalArray.pop();
        }
        if (props.connection.includes("Azure")) {
            if (telemetryPoint.signalArray[telemetryPoint.signalArray.length - 1] === "") {
                telemetryPoint.signalArray.pop();
            }
            let deviceArray = [telemetryPoint];
            const response = await editTwins(deviceArray, props.connectionStringId, false)
            updatedDevice = response.updated;
            
        } else {
            updatedDevice = await editAWSThings([telemetryPoint]);
        }        
        if (updatedDevice) {
            toaster.informational(`Updated telemetryPoint : ${telemetryPoint.telemetryId}`);
            props.handleClose(telemetryPoint);
        }
    }, [props, telemetryPoint]);

    const addTelemetryPoint = useCallback(async (event) => {
        event.preventDefault();
        const telemetryId = selectedDeviceId+"-"+telemetryPoint.telemetryId;
        const data = { telemetryId: telemetryId, deviceId: selectedDeviceId, connectionStringId: props.connectionStringId, isDeviceTwin: 'false' }
        const response = await fetch(`${url}/create-device`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).catch(error => console.log("Request failed: " + error));
        if (response && response.status === 200) {            
            if (telemetryPoint.signalArray[telemetryPoint.signalArray.length - 1] === "") {
                telemetryPoint.signalArray.pop();
            }
            let deviceArray = [telemetryPoint];
            deviceArray[0]["telemetryId"] = telemetryId;
            const response = await editTwins(deviceArray, props.connectionStringId, false)
            if (response.updated) {
                toaster.positive(`Added TelemetryPoint : ${telemetryPoint.telemetryId}`);
                props.handleClose(await response.response.json());
            }
        } else {
            const error = await response.text();
            toaster.negative(`${error}`);
        }
    }, [telemetryPoint, props, url, selectedDeviceId]);

    const onClose = useCallback(() => {  
        setNewBehaviour("");  
        setTabIndex(0);           
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
        const deviceSignalArray=telemetryPoint.signalArray;
        for (let i = 0; i < telemetryPoint.signalArray.length; i++) {
            if (telemetryPoint.signalArray[i] !== '') {
                k += 1;
            }
        }
        if (k === 1 && i === 0) {
            toaster.negative(`Behaviour cannot be empty!`)
        }
        else {
            
            deviceSignalArray.splice(i, 1);                      
            setTabCount(deviceSignalArray.length);
            setTelemetryPoint((telemetryPoint)=>({...telemetryPoint,signalArray:deviceSignalArray}));
            setBehaviour("");
            setNewBehaviour("");
        }
    }       
    arr = [];

    for (let i = 0; i < len; i++) {
        arr.push(i * (telemetryPoint.telemetrySendInterval) / 1000);
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
    },[telemetryPoint,len]);

    const getCompositeSignalDataArray=()=>{
        if(telemetryPoint.signalArray===undefined)return [];
        for (let i = 0; i < telemetryPoint.signalArray.length; i++) {
            if (telemetryPoint.signalArray[i] !== '') {
                if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Sine") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Mean"]) + Math.sin((j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000)) * (2 * Math.PI) / (parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Wave Period"]) / 1000) + JSON.parse(telemetryPoint.signalArray[i])["Phase"]) * parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Amplitude"]);
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Constant") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Mean"]);
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Linear") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Slope"]) * (j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000));
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Noise") {
                    let mean = 0;
                    let standard_deviation = parseFloat(telemetryPoint.noiseSd);
                    for (let j = 0; j < len; j++) {
                        let x = (Math.random() - 0.5) * 2;
                        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
                        let noise_mag = JSON.parse(telemetryPoint.signalArray[i])["Noise Magnitude"] * Math.sign((Math.random() - 0.5) * 2);
                        let currData = noise * noise_mag;
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Triangular") {
                    for (let j = 0; j < len; j++) {
                        let currData = (2 * parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Amplitude"]) * Math.asin(Math.sin((2 * Math.PI * (j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Wave Period"]) / 1000)))) / Math.PI;                        
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Sawtooth") {
                    for (let j = 0; j < len; j++) {
                        let currData = 2 * parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Amplitude"]) * ((j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Wave Period"]) / 1000) - Math.floor(1 / 2 + (j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000)) / (parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Wave Period"]) / 1000)));
                        currDataArray[j] += currData;
                    }
                }
                else if (JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] === "Square") {
                    for (let j = 0; j < len; j++) {
                        let currData = parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Amplitude"]) * Math.sign(Math.sin((2 * Math.PI * (j * (parseFloat(telemetryPoint.telemetrySendInterval) / 1000))) / (parseFloat(JSON.parse(telemetryPoint.signalArray[i])["Wave Period"]) / 1000)));
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
        if (telemetryPoint.signalArray && !telemetryPoint.valueIsBool) {
            currDataArray = [];
            for (let i = 0; i < len; i++) {
                currDataArray[i] = (behaviourDataArray[i] ? behaviourDataArray[i] : 0);
            }
            getCompositeSignalDataArray();            
        }
        setNewBehaviour(behaviourObject);                
    }
                
    if (telemetryPoint.valueIsBool) {
        currDataArray = [];
        for (let i = 0; i < len; i++) {
            let currData = Math.round(Math.random());
            currDataArray.push(currData);
        }
    }
    
    const sineInfo = "A sinusoidal wave is a mathematical curve defined in terms of the sine trigonometric function, of which it is the graph.";
    const constantInfo = "A constant wave is a wave that is same everywhere & having the same value of range for different values of the domain.";
    const increasingInfo = "A strictly increasing wave is a wave in which Y-value increases with the increasing value on X-axis.";
    const noiseInfo = "A noise wave is an unwanted random disturbance of a signal.";
    const triangularInfo = "A triangular wave or triangle wave is a non-sinusoidal waveform named for its triangular shape.";
    const sawtoothInfo = "The sawtooth wave is a kind of non-sinusoidal waveform named for its resemblance to the teeth of a plain-toothed saw with a zero rake angle.";
    const squareInfo = "A square wave is a non-sinusoidal periodic wave in which the amplitude alternates at a steady frequency between fixed min & max values, with the same duration at min & max.";

    const getContent = () => {
        if (telemetryPoint.signalArray[index] === "") {
            return (<div className="behaviour-func">
                        <div className="behaviour-list">
                            <Select value={behaviour} placeholder={"Select Behaviour"} options={options} onChange={changeBehaviour} style={{ width: "300px" }} itemRenderer={(option) => (
                                < MenuItem><Tooltip placement="right" content={option.value === 'Sine' ? sineInfo : option.value === 'Constant' ? constantInfo : option.value === 'Linear' ? increasingInfo : option.value === 'Noise' ? noiseInfo : option.value === 'Triangular' ? triangularInfo : option.value === 'Sawtooth' ? sawtoothInfo : squareInfo}><div className="option">{option.label}</div></Tooltip></MenuItem>
                            )} >
                            </Select>
                        </div>
                        <BehaviourComponent behaviour={behaviour} signalArray="" telemetrySendInterval={telemetryPoint.telemetrySendInterval} arrayLength={len} setCurrDataArray={setCurrDataArray} newBehaviour={newBehaviour}/>
                    </div >);
        }
        else {            
            if (telemetryPoint.signalArray[index] === undefined) {
                setIndex(0);
            }
            else {            
                return (<div>
                            <div className="behaviour-list">
                                <Select value={JSON.parse(telemetryPoint.signalArray[index])["Behaviour"]} options={options} style={{ width: "300px" }} disabled={true}></Select>
                            </div>
                            <BehaviourComponent behaviour={JSON.parse(telemetryPoint.signalArray[index])["Behaviour"]} signalArray={telemetryPoint.signalArray[index]} telemetrySendInterval={telemetryPoint.telemetrySendInterval} arrayLength={len} setCurrDataArray={setCurrDataArray} newBehaviour={newBehaviour}/>
                        </div>);
            }
        }
    };   

    const getBehaviourColumns = (signal) => {
        let columns =[];
        Object.keys(signal).map(key => (
            columns.push(
                {
                  id: key,
                  Header: key,
                  minWidth: 100,
                  accessor: key,
                })
        ));
        return [{
            Header: "Table",
            columns: columns,
          }]
    };
    
    const propertiesColumn = useMemo(
      () => [
        {
          id: 'propKey',
          Header: 'propKey',
          accessor: 'propKey',
          width: 120,
        },
        {
          id: 'propValue',
          Header: 'propValue',
          accessor: 'propValue',
        },
      ],
      [],
    );

    const propertiesData = [
        {
          propKey: "Telemetry Id",
          propValue: telemetryPoint.telemetryId ? telemetryPoint.telemetryId.toString() : null,
        },
        {
            propKey: "Device Name",
            propValue: telemetryPoint.telemetryName ? telemetryPoint.telemetryName.toString() : null,
        },
        {
            propKey: "Phenomenon",
            propValue: telemetryPoint.phenomenon ? telemetryPoint.phenomenon.toString() : null,
        },
        {
            propKey: "Unit",
            propValue: telemetryPoint.unit ? telemetryPoint.unit.toString() : null,
        },
        {
            propKey: "Is value bool",
            propValue: telemetryPoint.valueIsBool ? telemetryPoint.valueIsBool.toString() : "false",
        },
        {
            propKey: "Period (ms)",
            propValue: telemetryPoint.telemetrySendInterval ? telemetryPoint.telemetrySendInterval.toString() : null,
        },
      ];

    const getTabContent = () => {
      switch (tabIndex) {
        case 0: // Properties
          return (
            <div className="divMarginTop">
                <Table 
                    columns={propertiesColumn}
                    data={propertiesData}
                    style={{ height: '100%', borderLeft: "thin solid #d3d3d3", borderTop: "thin solid #d3d3d3"}}
                /> 
            </div>
          );
        case 1: // Behaviour
            return (telemetryPoint.signalArray)?(
                <div className="divMarginTop">   
                    <ChartComponent labelsArray={arr} dataArray={currDataArray} chartName="Composite Signal" />

                    <div className="scrollBarStyle">
                        <div className="border-div">
                        {telemetryPoint.signalArray.map((signal) => {
                            const signalParse =JSON.parse(signal);
                            if(signalParse?.Behaviour)
                                delete signalParse.Behaviour;
                            return(
                                <div className="wrapper">
                                    <div className="first"><Label style = {{fontWeight:"normal", color:"dark"}}>{JSON.parse(signal)["Behaviour"]}</Label></div>
                                    <div className="second">
                                        <Table 
                                            columns={getBehaviourColumns(signalParse)}
                                            data={[signalParse]}
                                            style={{ height: '100%', borderLeft: "thin solid #d3d3d3", borderTop: "thin solid #d3d3d3"}}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </div> 
          ):null;
          default: return null;
      }
    };

    const onDeviceIdSelected = async(deviceId)=>{
        setSelectedDeviceId(deviceId);
        setTelemetryPoint((telemetryPoint)=>({...telemetryPoint,deviceId:deviceId}));

    }

    const getDeviceList = async () => {
        let result;
        const devices = await getDataFromAzure(props.connectionStringId);      
        if(devices?.deviceIdList){
            result = devices.deviceIdList
        }
        console.log(result);
        setDeviceList(result);
    }
    
    const deviceIds = useMemo(() => {
        let selectOptions = [];
        if(deviceList){
            deviceList.forEach(async (twin) => {
                if (twin.deviceId){
                    selectOptions.push({ value: twin.deviceId, label: twin.deviceId });
                }
            });
            selectOptions = selectOptions.filter((a, i) => selectOptions.findIndex((s) => a.value === s.value) === i)
        }
        return selectOptions;
      }, [deviceList]);

   let telemetryPointComponent; 
    if(props.isView){
        telemetryPointComponent = 
        <div className="viewStyle">
        <Tabs
            labels={[
            <Tab key={0} label='Properties' />,
            <Tab key={1} label='Behaviour' />,
            ]}
            type='borderless'
            onTabSelected={setTabIndex}
        >
            {getTabContent()}
        </Tabs>
    </div>
   }
   else{
        telemetryPointComponent =
        <div>
            <div className="mainBox">
                <div className="basic-prop">
                    <LabeledSelect className="basic" style={{marginTop:"15px"}}
                                        label=' Select Device ID'
                                        options={deviceIds}
                                        displayStyle="default"
                                        value={selectedDeviceId}
                                        onChange={(id) => onDeviceIdSelected(id)}
                                        placeholder='Select Device ID'
                                        disabled={telemetryPoint.deviceAction === DeviceAction.ADD ? false : true}
                                    />
                    <LabeledInput className="basic" label='Telemetry Id' name='telemetryId' value={telemetryPoint.telemetryId}
                        disabled={telemetryPoint.deviceAction === DeviceAction.ADD ? false : true}
                        onChange={handleChange} />
                    <LabeledInput className="basic" label='Device Name' name='telemetryName' value={telemetryPoint.telemetryName} onChange={handleChange} />
                    <LabeledInput className="basic" label='Phenomenon' name='phenomenon' value={telemetryPoint.phenomenon} onChange={handleChange} />
                    <LabeledInput className="basic" label='Data Period (ms per observation)' name='telemetrySendInterval' value={telemetryPoint.telemetrySendInterval} onChange={handleChange} />
                    <ToggleSwitch className="basic" label='Is value bool' labelPosition="left" name='valueIsBool' checked={telemetryPoint.valueIsBool} onChange={(e) => { setTelemetryPoint((telemetryPoint)=>({ ...telemetryPoint, valueIsBool: e.target.checked, unit: "", signalArray: telemetryPoint.valueIsBool ? [`{"Behaviour":"Constant","Mean":100}`, `{"Behaviour":"Noise","Noise Magnitude":5,"Noise Standard-deviation":0.45}`] : [] })); if (telemetryPoint.valueIsBool) { setTabCount(2); } }} />
                    <LabeledInput className="basic" label='Unit' name='unit' value={telemetryPoint.unit} onChange={handleChange} style={{ display: telemetryPoint.valueIsBool ? 'none' : 'inline' }} />
                </div>
                <div className="behaviour-area">
                    <InputGroup label='No. of datapoints' displayStyle="inline">
                        <Radio name="choice" value={10} label={'10'} onChange={handleLength} checked={parseFloat(len) === 10 ? true : false} />
                        <Radio name="choice" value={50} label={'50'} onChange={handleLength} checked={parseFloat(len) === 50 ? true : false} />
                        <Radio name="choice" value={100} label={'100'} onChange={handleLength} checked={parseFloat(len) === 100 ? true : false} />
                    </InputGroup>

                    <ChartComponent labelsArray={arr} dataArray={currDataArray} chartName="Composite Signal" />

                    {telemetryPoint.signalArray && !telemetryPoint.valueIsBool ?
                        <HorizontalTabs
                            style={{ overflow: "scroll", width: "400px" }}
                            labels={Array(tabCount).fill(null).map((_, i) => (
                                <div className="tab-label">
                                    <Tab
                                        key={i}
                                        label={telemetryPoint.signalArray[i] ? JSON.parse(telemetryPoint.signalArray[i])["Behaviour"] : 'New'}
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
            {telemetryPoint.deviceAction === DeviceAction.ADD ?
                <Button className="buttons" styleType="high-visibility" onClick={addTelemetryPoint}> Add </Button> : <Button className="buttons" styleType="high-visibility" onClick={updateTelemetryPoint}  > Update </Button>}
        </div>  
   }

    return (
        <>
            <Modal
                closeOnExternalClick={false}
                isOpen={props.isOpen}
                onClose={onClose}
                title={telemetryPoint.deviceAction === DeviceAction.ADD ? 'Add Telemetry' : props.isView ? 'Device Details' : 'Update Device'}
            >
                {telemetryPointComponent}
            </Modal >
        </>
    );
}