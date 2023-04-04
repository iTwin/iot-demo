/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Button, Table, tableFilters, TablePaginator, toaster, useTheme, Checkbox, ErrorPage, LabeledSelect, IconButton, ButtonGroup, DropdownButton, MenuItem } from "@itwin/itwinui-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient } from "@itwin/browser-authorization";
import './App.css';
import { AddTelemetryPoint } from "./AddTelemetryPoint";
import { DeviceAction } from "./Utils";
import { ExportToCsv } from "export-to-csv";
import { checkUserRole, getBlobData } from "./Utils";
import { getDataFromAzure, startSimulatorForAzure, stopSimulatorForAzure, editTwins } from "./AzureUtilities";
import { getAWSThings, startSimulatorForAWS, stopSimulatorForAWS } from "./AWSUtililities";
import { AddDevice } from "./AddDevice";
import {SvgAdd, SvgRefresh , SvgVisibilityShow, SvgEdit} from '@itwin/itwinui-icons-react/cjs/icons';

let timeout;
let count;

function App() {
  const [toggle, setToggle] = useState(false);
  const [data, setData] = useState([]);
  const [telemetryPoints, setTelemetryPoints] = useState([]);
  const [openAddTelemetryPoint, setOpenAddTelemetryPoint] = useState(false);
  const [telemetryPoint, setTelemetryPoint] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [enableLogging, setEnableLogging] = useState(false);
  const [user, setUser] = React.useState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedConnectionStringId, setSelectedConnectionStringId] = useState("");
  const [connectionList, setConnectionList] = useState([]);
  const [connections, setConnections] = useState([]);
  const [duration, setDuration] = useState("");
  const [isView, setIsView] = useState(true);
  const [openAddDevice, setOpenAddDevice] = useState(false);

  useTheme("os");

  const updateTelemetryPoint = async (deviceArray, selectedConnectionStringId) => {
    let updatedDevice = false;
    const response = await editTwins(deviceArray, selectedConnectionStringId, false)
    updatedDevice = response.updated;
    if (updatedDevice) {
      handleClose();
    }
  };


  const func_start = (deviceArray, selectedConnectionStringId) => {
    deviceArray.forEach(device => {
      device.isRunning = true;
    });
    updateTelemetryPoint(deviceArray, selectedConnectionStringId);
  };

  const func_stop = (deviceArray, selectedConnectionStringId) => {
    //func_stop
    deviceArray.forEach(device => {
      device.isRunning = false;
    })
    updateTelemetryPoint(deviceArray, selectedConnectionStringId);
  };

  const removeDevices = async (rows, selectedDeviceIds) => {
    for (let index1 = 0; index1 < selectedDeviceIds.length; index1++) {
      for (let index2 = 0; index2 < rows.length; index2++) {
        if (rows[index2].telemetryId === selectedDeviceIds[index1].telemetryId && (rows[index2].isRunning === true || rows[index2].isRunning === 'true')) {
          selectedDevices.splice(index1, 1);
        }
      }
    }
  }

  const startSimulator = async () => {
    setToggle(true);
    const rows = await getDevices();
    await removeDevices(rows, selectedDevices);
    if (selectedDevices.length === 0) {
      setToggle(false);
      toaster.negative("Please Select atleast one device!!");
    } else {
      toaster.informational("Starting simulator...", { type: "persisting" });
      let simulatorStarted = false;
      if (selectedConnection.includes("Azure")) {
        func_start(selectedDevices, selectedConnectionStringId);
        simulatorStarted = await startSimulatorForAzure(selectedDevices, enableLogging, selectedConnectionStringId);
      }
      else {
        simulatorStarted = await startSimulatorForAWS(selectedDevices);
      }
      console.log(simulatorStarted);
      toaster.closeAll();
      if (simulatorStarted) {
        let deviceString = "devices";
        if (selectedDevices.length === 1) {
          deviceString = "device";
        }
        toaster.positive("Simulator started!! Sending data for " + selectedDevices.length + " " + deviceString, { type: "persisting" });
        timeout = setTimeout(stopSimulator, parseFloat(duration) * 1000 * 60);
      } else {
        setToggle(false);
        toaster.negative("Simulator start request not successful. Try again!!", { type: "persisting" });
      }
    }
  };

  const stopSimulator = async () => {
    clearTimeout(timeout);
    toaster.informational("Stopping simulator...", { type: "persisting" });
    toaster.closeAll();
    let simulatorStopped = false;
    if (selectedConnection.includes("Azure")) {
      func_stop(selectedDevices, selectedConnectionStringId);
      simulatorStopped = await stopSimulatorForAzure(selectedDevices, selectedConnectionStringId);
    } else {
      simulatorStopped = await stopSimulatorForAWS(selectedDevices);
    }
    if (simulatorStopped) {
      setToggle(false);
      toaster.positive("Simulator stopped!!", { hasCloseButton: true });
      toaster.informational("You need to refresh the content");
      if (enableLogging) {
        const downloadedData = await getBlobData("simulatorcontainer", "devicelog_".concat(selectedConnectionStringId.concat(".json")));

        if (downloadedData !== undefined && downloadedData !== "") {
          const logData = JSON.parse(downloadedData);
          const options = {
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true,
            showTitle: true,
            title: 'Real Time Data',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
            filename: "DeviceLog_Simulator"
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
          };
          const csvExporter = new ExportToCsv(options);
          csvExporter.generateCsv(logData);
        }

      }
    } else {
      toaster.negative("Simulator stop request not successful. Try again!!", { type: "persisting" });
    }
  };

  const beforeUnloadHandler = (e) => {
    if (toggle) {
      stopSimulator();
      if (navigator.userAgent.indexOf("Firefox") > 0) {
        const time = Date.now();
        while ((Date.now() - time) < 500) {
        }
      }
    }
  }

  useEffect(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return function cleanup() {
      window.removeEventListener("beforeunload", beforeUnloadHandler)
    }
  })

  const openAddTelemetryPointModal = async (deviceAction, telemetryPoint, isButtonView) => {
    setTelemetryPoint({ ...telemetryPoint, deviceAction });
    setIsView(isButtonView)
    setOpenAddTelemetryPoint(true);
  }
 
  const openAddDeviceModal = async () => {
    setOpenAddDevice(true);
  }

  const handleClose = (device) => {
    if (device && device.deviceAction === DeviceAction.UPDATE) {
      const devices = data.filter((d) => d.telemetryId !== device.telemetryId);
      if (selectedConnection.includes("Azure")) {

        const twins = telemetryPoints;
        for (const twin of telemetryPoints) {
          if (twin.telemetryId === device.telemetryId) {
            twin.telemetryName = device.telemetryName;
            twin.deviceId=device.deviceId;            
            twin.phenomenon = device.phenomenon;
            twin.unit = device.unit;
            twin.valueIsBool = device.valueIsBool;
            twin.telemetrySendInterval = device.telemetrySendInterval;                        
            twin.noiseSd = device.noiseSd;            
            twin.min = device.min;
            twin.max = device.max;
            twin.isRunning = device.isRunning
            twin.signalArray= device.signalArray
            break;
          }
        }
        setTelemetryPoints(twins);
      } else {
        device.valueIsBool = device.valueIsBool === "true" ? true : false;
      }
      setData([device, ...devices]);
    } else if (device) {
      setTelemetryPoints([...telemetryPoints, device]);
      const newDevice = {
        telemetryId: device.telemetryId,
        deviceId:device.deviceId,
        telemetryName: device.telemetryName,        
        phenomenon: device.phenomenon,
        telemetrySendInterval: device.telemetrySendInterval,
        unit: device.unit,
        valueIsBool: device.valueIsBool,        
        noiseSd: device.noiseSd,        
        min: device.min,
        max: device.max,
        isRunning: device.isRunning,
        signalArray: device.signalArray
      }
      setData([...data, newDevice]);
    }
    setOpenAddTelemetryPoint(false);
    setOpenAddDevice(false);
  }

  const getDevices = useCallback(async () => {
    if (selectedConnection === '' || selectedConnectionStringId === '') {
      return;
    }
    let rows = [];
    setData([]);
    setIsLoading(true);
    count = 0;
    let deviceString = "devices are";
    if (selectedConnection.includes("Azure")) {
      const azureDevices = await getDataFromAzure(selectedConnectionStringId);
      setTelemetryPoints(azureDevices.rows);
      rows = azureDevices.rows;
    } else {
      const AWSThings = await getAWSThings();
      rows = AWSThings.rows;
    }
    for (let index = 0; index < rows.length; index++) {
      if (rows[index].isRunning === true || rows[index].isRunning === 'true') {
        count += 1;
      }
    }
    if (count === 1) {
      deviceString = "device is";
    }
    if (count > 0) {
      toaster.negative(`${count} ${deviceString} already sending data`);
    }
    setData(rows);
    setIsLoading(false);
    return rows;
  }, [selectedConnection, selectedConnectionStringId])

  const refresh = () => {
    getDevices();
  }

  const getConfiguration = async () => {
    const configuration = JSON.parse(await getBlobData("iot-demo-configuration", "IotDeviceSimulatorConfiguration.json"));
    const connList = [];
    configuration.connections.forEach((conn) => {
      connList.push({ label: conn.name, value: conn.IoTHubConnectionStringId });
    })
    setConnectionList(connList);
    setConnections(configuration.connections);
    setDuration(configuration.duration);
  }

  const onConnectionSelected = async (ConnectionStringId) => {
    setSelectedConnectionStringId(ConnectionStringId);
    setSelectedConnection(connections.find((conn) => conn.IoTHubConnectionStringId === ConnectionStringId).name);
  }

  useEffect(() => {
    if (selectedConnectionStringId !== "") {
      getDevices();
    }
  }, [selectedConnectionStringId, getDevices]);

  useEffect(() => {
    toaster.setSettings({
      placement: 'bottom',
      order: 'descending',
    });
    getConfiguration();
  }, []);

  if (!process.env.REACT_APP_CLIENT_ID) {
    throw new Error("Please add a valid OIDC client id to the .env file and restart the application. See the README for more information.");
  }
  if (!process.env.REACT_APP_CLIENT_SCOPES) {
    throw new Error("Please add valid scopes for your OIDC client to the .env file and restart the application. See the README for more information.");
  }
  if (!process.env.REACT_APP_REDIRECT_URI) {
    throw new Error("Please add a valid redirect URI to the .env file and restart the application. See the README for more information.");
  }

  const authClient = useMemo(
    () =>
      new BrowserAuthorizationClient({
        scope: process.env.REACT_APP_CLIENT_SCOPES ?? "",
        clientId: process.env.REACT_APP_CLIENT_ID ?? "",
        redirectUri: process.env.REACT_APP_REDIRECT_URI ?? "",
        postSignoutRedirectUri: process.env.REACT_APP_LOGOUT_URI,
        responseType: "code",
      }),
    []);

  const [isAuthorized, setIsAuthorized] = useState(authClient.isAuthorized);

  useEffect(() => {
    BrowserAuthorizationCallbackHandler.handleSigninCallback(process.env.REACT_APP_REDIRECT_URI ?? "")
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
  const parseJwt = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  };

  const signIn = async () => {
    await authClient.signInPopup();
    setIsAuthorized(authClient.isAuthorized);
    const token = await authClient.getAccessToken();
    const jsonPayload = parseJwt(token);
    setUser(jsonPayload.email);
  }

  const setAdmin = async (user) => {
    const role = await checkUserRole(user);
    setUserRole(role);
    setIsAdmin(role === "Admin");
  }

  useEffect(() => {
    setAdmin(user);
  }, [user]);

  const onSelect = useCallback(
    (rows, state) => {
      const selectedDeviceIds = []
      rows.forEach((row) => {
        if (selectedConnection.includes("Azure")) {
          const telemetryPoint = telemetryPoints.find((device) => device.telemetryId === row.telemetryId);
          selectedDeviceIds.push({
            telemetryId: telemetryPoint.telemetryId,
            deviceId:telemetryPoint.deviceId,
            telemetryName: telemetryPoint.telemetryName,
            deviceAction: "UPDATE",            
            phenomenon: telemetryPoint.phenomenon,
            telemetrySendInterval: telemetryPoint.telemetrySendInterval,
            unit: telemetryPoint.unit,
            valueIsBool: telemetryPoint.valueIsBool,            
            noiseSd: telemetryPoint.noiseSd,            
            isRunning: telemetryPoint.isRunning,
            min: telemetryPoint.min,
            max: telemetryPoint.max,
            primaryKey: telemetryPoint.primaryKey,
            signalArray: telemetryPoint.signalArray
          });
          console.log("App.js - OnSelect telemetryPoint " +selectedDeviceIds);
        } else {
          selectedDeviceIds.push(row)
        }

      });
      setSelectedDevices(selectedDeviceIds);
    },
    [telemetryPoints, selectedConnection],
  );
  const isRowDisabled = useCallback(
    (rowData) => {
      if (toggle) {
        return rowData;
      }
      else {
        return (rowData.isRunning === true || rowData.isRunning === "true");
      }
    },
    [toggle],
  );

  const onEnableLogging = (checked) => {
    if (checked) {
      setEnableLogging(true);
    } else {
      setEnableLogging(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: "deviceId",
            Header: "Device Id",
            minWidth: "150px",
            width: "22vw",
            accessor: "deviceId",
            Filter: tableFilters.TextFilter(),
          },
          {
            id: "telemetryId",
            Header: "Telemetry Id",
            minWidth: "150px",
            width: "23vw",
            accessor: "telemetryId",
            Filter: tableFilters.TextFilter(),
          },
          {
            id: "phenomenon",
            Header: "Phenomenon",
            minWidth: "40px",
            accessor: "phenomenon",
            Filter: tableFilters.TextFilter(),
          },
          {
            id: "unit",
            Header: "Unit",
            minWidth: "40px",
            accessor: "unit",
          },
          {
            id: "telemetrySendInterval",
            Header: "Period (ms)",
            minWidth: "30px",
            accessor: "telemetrySendInterval",
          },
          {
            id: "action", 
            width:  isAdmin ? "120px": "80px",
            Cell: (data) => {
              
              return (
                <div>
                  <ButtonGroup>
                    <IconButton size="small" className="icon-button-style" styleType="borderless" title= "View Device" disabled={toggle || data.row.original.isRunning === true} onClick={() => openAddTelemetryPointModal(DeviceAction.UPDATE, data.row.original, true)}><SvgVisibilityShow/></IconButton>
                    <IconButton size="small" className="icon-button-style" styleType="borderless" title="Edit Device" style={isAdmin? {}:{display:"none"}} disabled={toggle || data.row.original.isRunning === true} onClick={() => openAddTelemetryPointModal(DeviceAction.UPDATE, data.row.original, false)}><SvgEdit/></IconButton>              
                  </ButtonGroup>
                </div>
              );
            },
          },
        ],
      },
    ],
    [toggle, isAdmin]);


  const pageSizeList = useMemo(() => [10, 25, 50], []);

  const paginator = useCallback(
    (props) => (
      <TablePaginator {...props} pageSizeList={pageSizeList} />
    ),
    [pageSizeList],
  );

  const errorProps = {
    errorType: '401',
    errorMessage: (
      <>
        You do not have permission to access this server.
        <br />
        Unable to fulfill request.
      </>
    ),
  };

  const buttonMenuItems =  (close) => [
      <MenuItem key={1} onClick={()=> {openAddDeviceModal(DeviceAction.ADD); close()}} textAlign="center">
        Device
      </MenuItem>,
      <MenuItem key={2} onClick={()=> {openAddTelemetryPointModal(DeviceAction.ADD); close()}}>
        TelemetryPoint
      </MenuItem>,
    ];

  return (
    <>
      <header>
        <Button
          onClick={signIn}
          styleType="default"
          disabled={isAuthorized}
        >
          {"Sign In"}
        </Button>
        <Button
          onClick={() => authClient.signOut()}
          styleType="default"
          disabled={!isAuthorized}
        >
          {"Sign Out"}
        </Button>
      </header>
      {isAuthorized ? userRole === "" ? <div className="container">Checking Access Permissions...</div> : userRole !== "Unauthorized" ?
        <div >

          {selectedConnection === "" ?
            <div className="components-signin App">
              <div className="components-signin-content" style={{ textAlign: "center" }}>

                <img src='iotconn.png' alt="iotconnection" height="150px" width="200px" textAlign="center" />

                <LabeledSelect
                  label=' Select IoT Connection'
                  options={connectionList}
                  displayStyle="default"
                  value={selectedConnectionStringId}
                  onChange={(conn) => onConnectionSelected(conn)}
                  placeholder='Select Connection'

                /></div></div>
            :
            <div className="App">
              <h1>Device Simulator</h1>
              <Button styleType='borderless' size='small' onClick={() => { setSelectedConnection("") }} style={{ color: "blue" }}> <u>Back to IoT Connections List</u></Button>
              <h2>Connection: {selectedConnection ?? ""}</h2>

              <Button styleType='cta' size='large' disabled={toggle} onClick={startSimulator}>Start</Button>
              <Button styleType='cta' size='large' disabled={!toggle} onClick={stopSimulator}>Stop</Button>
              <br />
              <div className="table-top-wrap">
                <div className="table-top-left">
                <h2>Devices</h2>
                {
                  isAdmin ? 
                    selectedConnection.includes("Azure") ? 
                    <DropdownButton styleType='high-visibility' className="icon-button-style" disabled={toggle} menuItems={buttonMenuItems}><Button className="icon-button-style"  startIcon={<SvgAdd />} styleType='borderless' style={{color:"#fff"}} size="small" disabled={toggle}>New</Button> </DropdownButton>
                    : <></> 
                  : <></>
                }
                  <IconButton className="icon-button-style remove-left-margin-button" styleType='borderless' size="small" onClick={refresh} disabled={toggle}><SvgRefresh/></IconButton>
                </div>
                <div className="table-top-right">
                  {selectedConnection.includes("Azure") ? <Checkbox label="Enable Logging" defaultChecked={enableLogging} onChange={(event) => onEnableLogging(event.target.checked)} /> : <></>}
                </div>                
              </div>
              <Table
                columns={columns}
                isSortable
                data={data}
                isLoading={isLoading}
                paginatorRenderer={paginator}
                density='condensed'
                isSelectable={true}
                onSelect={onSelect}
                isRowDisabled={isRowDisabled}
              />
              <AddDevice handleClose={handleClose} isOpen={openAddDevice} connectionStringId={selectedConnectionStringId} connection={selectedConnection} />
              <AddTelemetryPoint device={telemetryPoint} handleClose={handleClose} isOpen={openAddTelemetryPoint} isView={isView} connectionStringId={selectedConnectionStringId} connection={selectedConnection} />
            </div>
          }
        </div> :
        < ErrorPage  {...errorProps} />
        : <div className="container">Please sign in.</div>
      }
    </>
  );
}

export default App;
