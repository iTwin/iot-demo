/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Button, Fieldset, LabeledSelect, toaster } from "@itwin/itwinui-react";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { v4 as uuidv4 } from "uuid";
import { DeviceMonitorUI } from "../DeviceMonitorUI";
import { getConfiguration, getDeviceDataFromTelemetry, removeConsumerCallback } from "../Utils";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { ExportToCsv } from "export-to-csv";
import "../../App.scss";

let logData: any[] = [];
export const setLogData = (jsonData: any[]) => {
  logData = jsonData;
};

export const getLogData = () => {
  return logData;
};

const callBackId = uuidv4();
export const IoTLogsWidget = () => {
  const [isLoggingStarted, setIsLoggingStarted] = useState(false);
  const [startTimeStamp, setStartTimeStamp] = useState("");
  const [stopTimeStamp, setStopTimeStamp] = useState("");
  const [selectedConnection, setSelectedConnection] = useState(0);
  const [connectionList, setConnectionList] = useState<{ label: string, value: number }[]>([]);

  const handleStartLogging = useCallback(() => {
    setIsLoggingStarted(true);
    setStartTimeStamp("Logging started : ".concat((new Date(Date.now())).toString()));
    setStopTimeStamp("");
    if (document.getElementById("logs") !== null) {
      ReactDOM.render(<></>, document.getElementById("logs"));
    }
    const deviceList = ITwinViewerApp.store.getState().deviceState.deviceList;
    const deviceListFromSelectedConnection = deviceList.filter((device) => device.connectionId === selectedConnection.toString());
    IoTConnectionManager.monitor((msg: any) => {
      const realTimeData = getDeviceDataFromTelemetry(msg, deviceListFromSelectedConnection);
      if (realTimeData.length !== 0) {
        DeviceMonitorUI.printLogs(realTimeData);
      }
    }, deviceListFromSelectedConnection, callBackId);
  }, [selectedConnection, callBackId]);

  const handleStopLogging = () => {
    setIsLoggingStarted(false);
    setStopTimeStamp("Logging stopped : ".concat((new Date(Date.now())).toString()));
    removeConsumerCallback(callBackId);
    const options = getConfiguration().Logs.options;
    const connectionName = connectionList.find((conn) => conn.value === selectedConnection)?.label;
    if (connectionName !== undefined) {
      options.title = "Real Time Data (Connection: ".concat(connectionName.concat(" )"));
    }

    const csvExporter = new ExportToCsv(options);
    if (logData !== undefined && logData !== null && logData.length !== 0) {
      csvExporter.generateCsv(logData);
      toaster.positive("Downloaded Device log!!", { hasCloseButton: true });
    } else {
      toaster.negative("Cannot download device logs. Check your connection!!", { hasCloseButton: true });
      setStartTimeStamp("");
      setStopTimeStamp("");
    }

    logData = [];
  };

  const ConnectionChanged = (e: any) => {
    const callbacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
    if (callbacks.size !== 0) {
      IoTConnectionManager.connectionChangedNotification(e.detail);
    }
  };

  const handleConnectionSelected = (connection: number) => {
    setSelectedConnection(connection);
    setStartTimeStamp("");
    setStopTimeStamp("");
    if (document.getElementById("logs") !== null) {
      ReactDOM.render(<></>, document.getElementById("logs"));
    }
  };

  useEffect(() => {
    document.addEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    return () => {
      document.removeEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    };
  }, []);

  useEffect(() => {
    const connList = [];
    const connections = getConfiguration().Connections;
    if (connections !== undefined) {
      for (const connection of connections) {
        connList.push({ label: connection.name, value: connection.id });
      }
    }
    setConnectionList(connList);
  }, []);

  return (
    <div style={{ margin: "8px" }}>
      <Fieldset legend="Device Logs" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <LabeledSelect
          label='Connection'
          options={connectionList}
          displayStyle="default"
          value={selectedConnection}
          onChange={(conn: any) => handleConnectionSelected(conn)}
          placeholder='Select Connection'
          disabled={isLoggingStarted}
        />
        <div className="btn-wrapper" aria-disabled={selectedConnection === 0 ? true : false}>
          <div className="left-btn-div">
            <Button styleType="cta" className="btn-left" size="small" title="Start Logging" onClick={handleStartLogging} disabled={isLoggingStarted || selectedConnection === 0}>Start</Button>
          </div >
          <div className="right-btn-div">
            <Button styleType="cta" className="btn-right" title="Stop Logging" size="small" onClick={handleStopLogging} disabled={!isLoggingStarted}>Stop</Button>
          </div>
        </div >
        <div id="startTimeStamp">{startTimeStamp}</div>
        <div id="logs"></div>
        <div id="stopTimeStamp">{stopTimeStamp}</div>
      </Fieldset>

    </div>
  );
};
