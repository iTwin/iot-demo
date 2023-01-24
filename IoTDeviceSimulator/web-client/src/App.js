/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Button, Table, tableFilters, TablePaginator, toaster, useTheme, Checkbox, ErrorPage, LabeledSelect } from "@itwin/itwinui-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient } from "@itwin/browser-authorization";
import './App.css';
import { DeviceTwin } from "./DeviceTwin";
import { DeviceAction } from "./Utils";
import { ExportToCsv } from "export-to-csv";
import { checkUserRole, getBlobData } from "./Utils";
import { getAzureDeviceTwins, startSimulatorForAzure, stopSimulatorForAzure, editDeviceTwins } from "./AzureUtilities";
import { getAWSThings, startSimulatorForAWS, stopSimulatorForAWS } from "./AWSUtililities";

let timeout;
let count;

function App() {
  const [isSimulatorStarted, setIsSimulatorStarted] = useState(false);
  const [data, setData] = useState([]);
  const [deviceTwins, setDeviceTwins] = useState([]);
  const [isDeviceTwinModalOpen, setIsDeviceTwinModalOpen] = useState(false);
  const [deviceTwin, setDeviceTwin] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(false);
  const [user, setUser] = React.useState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedConnectionStringId, setSelectedConnectionStringId] = useState("");
  const [connectionList, setConnectionList] = useState([]);
  const [connections, setConnections] = useState([]);
  const [duration, setDuration] = useState("");

  useTheme("os");

  const updateDeviceTwin = async (deviceArray, selectedConnectionStringId) => {
    let isDeviceUpdated = false;
    const response = await editDeviceTwins(deviceArray, selectedConnectionStringId)
    isDeviceUpdated = response.updated;
    if (isDeviceUpdated) {
      handleClose();
    }
  };


  const func_start = (deviceArray, selectedConnectionStringId) => {
    deviceArray.forEach(device => {
      device.isRunning = true;
    });
    updateDeviceTwin(deviceArray, selectedConnectionStringId);
  };

  const func_stop = (deviceArray, selectedConnectionStringId) => {
    //func_stop
    deviceArray.forEach(device => {
      device.isRunning = false;
    })
    updateDeviceTwin(deviceArray, selectedConnectionStringId);
  };

  const removeDevices = async (rows, selectedDeviceIds) => {
    for (let index1 = 0; index1 < selectedDeviceIds.length; index1++) {
      for (let index2 = 0; index2 < rows.length; index2++) {
        if (rows[index2].deviceId === selectedDeviceIds[index1].deviceId && (rows[index2].isRunning === true || rows[index2].isRunning === 'true')) {
          selectedDevices.splice(index1, 1);
        }
      }
    }
  }

  const handleStartSimulator = async () => {
    
    setIsSimulatorStarted(true);
    const rows = await getDevices();
    await removeDevices(rows, selectedDevices);
    if (selectedDevices.length === 0) {
      setIsSimulatorStarted(false);
      toaster.negative("Please Select atleast one device!!");
    } else {
      toaster.informational("Starting simulator...", { type: "persisting" });
      let simulatorStarted = false;
      if (selectedConnection.includes("Azure")) {
        func_start(selectedDevices, selectedConnectionStringId);
        simulatorStarted = await startSimulatorForAzure(selectedDevices, isLoggingEnabled, selectedConnectionStringId);
      }
      else {
        simulatorStarted = await startSimulatorForAWS(selectedDevices);
      }      
      toaster.closeAll();
      if (simulatorStarted) {
        let deviceString = "devices";
        if (selectedDevices.length === 1) {
          deviceString = "device";
        }
        toaster.positive("Simulator started!! Sending data for " + selectedDevices.length + " " + deviceString, { type: "persisting" });
        timeout = setTimeout(handleStopSimulator, parseFloat(duration) * 1000 * 60);
      } else {
        setIsSimulatorStarted(false);
        toaster.negative("Simulator start request not successful. Try again!!", { type: "persisting" });
      }
    }
  };

  const handleStopSimulator = async () => {
    clearTimeout(timeout);
    toaster.informational("Stopping simulator...", { type: "persisting" });
    toaster.closeAll();
    let isSimulatorStopped = false;
    if (selectedConnection.includes("Azure")) {
      func_stop(selectedDevices, selectedConnectionStringId);
      isSimulatorStopped = await stopSimulatorForAzure(selectedDevices, selectedConnectionStringId);
    } else {
      isSimulatorStopped = await stopSimulatorForAWS(selectedDevices);
    }
    if (isSimulatorStopped) {
      setIsSimulatorStarted(false);
      toaster.positive("Simulator stopped!!", { hasCloseButton: true });
      toaster.informational("You need to refresh the content");
      if (isLoggingEnabled) {
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
    if (isSimulatorStarted) {
      handleStopSimulator();
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

  const handleOpenDeviceTwinModal = async (deviceAction, deviceTwin) => {
    setDeviceTwin({ ...deviceTwin, deviceAction });
    setIsDeviceTwinModalOpen(true);
  }

  const handleClose = (device) => {
    if (device && device.deviceAction === DeviceAction.UPDATE) {
      const devices = data.filter((d) => d.deviceId !== device.deviceId);
      if (selectedConnection.includes("Azure")) {

        const twins = deviceTwins;
        for (const twin of deviceTwins) {
          if (twin.deviceId === device.deviceId) {
            twin.properties.desired.deviceName = device.deviceName;
            twin.properties.desired.mean = device.mean;
            twin.properties.desired.amplitude = device.amplitude;
            twin.properties.desired.phenomenon = device.phenomenon;
            twin.properties.desired.unit = device.unit;
            twin.properties.desired.valueIsBool = device.valueIsBool;
            twin.properties.desired.telemetrySendInterval = device.telemetrySendInterval;
            twin.properties.desired.behaviour = device.behaviour;
            twin.properties.desired.noise_magnitude = device.noise_magnitude;
            twin.properties.desired.noiseSd = device.noiseSd;
            twin.properties.desired.sine_period = device.sine_period;
            twin.properties.desired.min = device.min;
            twin.properties.desired.max = device.max;
            twin.properties.desired.isRunning = device.isRunning
            break;
          }
        }
        setDeviceTwins(twins);
      } else {
        device.valueIsBool = device.valueIsBool === "true" ? true : false;
      }
      setData([device, ...devices]);
    } else if (device) {
      setDeviceTwins([...deviceTwins, device]);
      const newDevice = {
        deviceId: device.deviceId,
        deviceName: device.properties.desired.deviceName,
        amplitude: device.properties.desired.amplitude,
        mean: device.properties.desired.mean,
        phenomenon: device.properties.desired.phenomenon,
        telemetrySendInterval: device.properties.desired.telemetrySendInterval,
        unit: device.properties.desired.unit,
        valueIsBool: device.properties.desired.valueIsBool,
        behaviour: device.properties.desired.behaviour,
        noise_magnitude: device.properties.desired.noise_magnitude,
        noiseSd: device.properties.desired.noiseSd,
        sine_period: device.properties.desired.sine_period,
        min: device.properties.desired.min,
        max: device.properties.desired.max,
        isRunning: device.properties.desired.isRunning,
      }
      setData([...data, newDevice]);
    }
    setIsDeviceTwinModalOpen(false);
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
      const azureDevices = await getAzureDeviceTwins(selectedConnectionStringId);
      setDeviceTwins(azureDevices.deviceTwins);
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

  const handleConnectionSelected = async (ConnectionStringId) => {
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
          const deviceTwin = deviceTwins.find((device) => device.deviceId === row.deviceId);
          selectedDeviceIds.push({
            deviceId: deviceTwin.deviceId,
            deviceName: deviceTwin.properties.desired.deviceName,
            deviceAction: "UPDATE",
            amplitude: deviceTwin.properties.desired.amplitude,
            mean: deviceTwin.properties.desired.mean,
            phenomenon: deviceTwin.properties.desired.phenomenon,
            telemetrySendInterval: deviceTwin.properties.desired.telemetrySendInterval,
            unit: deviceTwin.properties.desired.unit,
            valueIsBool: deviceTwin.properties.desired.valueIsBool,
            behaviour: deviceTwin.properties.desired.behaviour,
            noise_magnitude: deviceTwin.properties.desired.noise_magnitude,
            noiseSd: deviceTwin.properties.desired.noiseSd,
            sine_period: deviceTwin.properties.desired.sine_period,
            isRunning: deviceTwin.properties.desired.isRunning,
            min: deviceTwin.properties.desired.min,
            max: deviceTwin.properties.desired.max,
            primaryKey: deviceTwin.authentication.symmetricKey.primaryKey
          });
        } else {
          selectedDeviceIds.push(row)
        }

      });
      setSelectedDevices(selectedDeviceIds);
    },
    [deviceTwins, selectedConnection],
  );
  const isRowDisabled = useCallback(
    (rowData) => {
      if (isSimulatorStarted) {
        return rowData;
      }
      else {
        return (rowData.isRunning === true || rowData.isRunning === "true");
      }
    },
    [isSimulatorStarted],
  );

  const handleLoggingEnabled = (checked) => {
    if (checked) {
      setIsLoggingEnabled(true);
    } else {
      setIsLoggingEnabled(false);
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
            accessor: "deviceId",
            Filter: tableFilters.TextFilter(),
          },
          {
            id: "mean",
            Header: "Mean",
            minWidth: "20px",
            accessor: "mean",
          },
          {
            id: "amplitude",
            Header: "Amplitude",
            minWidth: "20px",
            accessor: "amplitude",
          },
          {
            id: "phenomenon",
            Header: "Phenomenon",
            minWidth: "240px",
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
            id: "behaviour",
            Header: "Behaviour",
            minWidth: "30px",
            accessor: "behaviour",
          },
          {
            id: "action",
            width: "100px",
            Cell: (data) => {
              return (<div>
                <Button size="small" styleType="cta" title={isAdmin ? "Edit Device" : "View Device Properties"} disabled={isSimulatorStarted || data.row.original.isRunning === true} onClick={() => handleOpenDeviceTwinModal(DeviceAction.UPDATE, data.row.original)}> {isAdmin ? "Edit" : "View"}</Button>
              </div>
              );
            },
          },
        ],
      },
    ],
    [isSimulatorStarted, isAdmin]);


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

  return (
    <>
      <header>
        <Button
          onClick={signIn}
          styleType="cta"
          disabled={isAuthorized}
        >
          {"Sign In"}
        </Button>
        <Button
          onClick={() => authClient.signOut()}
          styleType="cta"
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
                  onChange={(conn) => handleConnectionSelected(conn)}
                  placeholder='Select Connection'

                /></div></div>
            :
            <div className="App">
              <h1>Device Simulator</h1>
              <Button styleType='borderless' size='small' onClick={() => { setSelectedConnection("") }} style={{ color: "blue" }}> <u>Back to IoT Connections List</u></Button>
              <h2>Connection: {selectedConnection ?? ""}</h2>

              <Button styleType='cta' size='large' disabled={isSimulatorStarted} onClick={handleStartSimulator}>Start</Button>
              <Button styleType='cta' size='large' disabled={!isSimulatorStarted} onClick={handleStopSimulator}>Stop</Button>
              <br />
              {selectedConnection.includes("Azure") ? <Checkbox label="Enable Logging" defaultChecked={isLoggingEnabled} onChange={(event) => handleLoggingEnabled(event.target.checked)} /> : <></>}
              <div className="table-top">
                <h2 style={{ textAlign: 'left' }}>Devices</h2>
                {isAdmin ? selectedConnection.includes("Azure") ? <Button styleType='cta' disabled={isSimulatorStarted} onClick={() => handleOpenDeviceTwinModal(DeviceAction.ADD)}>Add</Button> : <></> : <></>}
                <Button styleType='cta' onClick={refresh} disabled={isSimulatorStarted}>Refresh</Button>
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
              <DeviceTwin device={deviceTwin} onClose={handleClose} isOpen={isDeviceTwinModalOpen} isAdmin={isAdmin} connectionStringId={selectedConnectionStringId} connection={selectedConnection} />
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
