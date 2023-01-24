/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState } from "react";
import { IModelConnection } from "@itwin/core-frontend";

import { Story } from "../clients/ITwinLink";
import { ToggleSwitch } from "@itwin/itwinui-react";
import { SmartDevice } from "../SmartDevice";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { DeviceMonitorUI } from "../DeviceMonitorUI";
import { getConnection, getDeviceDataFromTelemetry, getDevicesLevelWise, getLevelList, removeConsumerCallback, resetDeviceStatus, setDeviceStatusToActive } from "../Utils";
import "../../App.scss";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { IoTConnection } from "../IoTConnection/IotConnection";
import { v4 as uuidv4 } from "uuid";

export interface IoTHeatMapWidgetProps {
  imodel?: IModelConnection;
  currentLevel?: Story;  // If not supplied, the onLevelChanged callback will trigger with the default level
  onLevelChanged(currentLevel?: Story): void;
}
const callBackId = uuidv4();

export const IoTHeatMapWidget: React.FC<IoTHeatMapWidgetProps> = () => {
  const [selectedLevel, setSelectedLevel] = useState<Story>();
  const [isHeatMapEnabled, setIsHeatMapEnabled] = useState<boolean>(false);
  const [deviceList, setDeviceList] = useState<SmartDevice[]>([]);
  const [measuredParameter, setMeasuredParameter] = useState<string>("");
  const [phenomenon, setPhenomenon] = useState<string[]>([]);

  const removeColorCode = useCallback((connection?: IoTConnection) => {
    deviceList.forEach((device: SmartDevice) => {
      if (device.phenomenon === measuredParameter) {
        const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
        if (callBacks.size !== 0 && callBacks.has(callBackId) && connection === undefined) {
          resetDeviceStatus(device);
        }
        if (connection !== undefined) {
          if (getConnection(device) === connection) {
            DeviceMonitorUI.clearColorCode(device.observedElement);
          }
        } else {
          DeviceMonitorUI.clearColorCode(device.observedElement, true);
        }
      }
    });
    if (connection === undefined) {
      removeConsumerCallback(callBackId);
    }
  }, [deviceList, measuredParameter, callBackId]);

  const onDefaultMode = useCallback(() => {
    removeColorCode();
    setMeasuredParameter("");
  }, [removeColorCode]);

  const onSelectParameter = useCallback((selectedParameter: string) => {
    setMeasuredParameter(selectedParameter);
    const deviceListForListen: SmartDevice | SmartDevice[] = [];

    deviceList.forEach((device: SmartDevice) => {
      if (selectedParameter === device.phenomenon) {
        deviceListForListen.push(device);
      }
    });

    setDeviceStatusToActive(deviceListForListen);

    IoTConnectionManager.monitor((msg: any) => {
      const data = getDeviceDataFromTelemetry(msg, deviceListForListen);
      if (data.length !== 0) {
        DeviceMonitorUI.colorCode(deviceListForListen, data);
      }
    }, deviceListForListen, callBackId);
  }, [deviceList, callBackId]);

  const handleSelectedPhenomenonChanged = useCallback((selectedParameter: string) => {
    removeColorCode();
    onSelectParameter(selectedParameter);
  }, [removeColorCode, onSelectParameter]);

  useEffect(() => {
    const fetchData = async () => {
      let level: Story;

      if (selectedLevel === undefined) {
        const levelList = await getLevelList();
        level = levelList[0];
      } else {
        level = selectedLevel;
      }

      const devices = await getDevicesLevelWise(level?.bottomElevation, level?.topElevation);
      if (selectedLevel === undefined) {
        setSelectedLevel(level);
      }
      setDeviceList(devices);
      onDefaultMode();
      // setMeasuredParameter("");
      const phenomenonArray: React.SetStateAction<string[]> = [];

      devices.forEach((device) => {
        if (phenomenonArray.find((p) => p === device.phenomenon) === undefined) {
          phenomenonArray.push(device.phenomenon);
        }
      });

      setPhenomenon(phenomenonArray);
    };
    void fetchData();
  }, [selectedLevel]);

  const levelSelected = useCallback((e: any) => {
    setSelectedLevel(e.detail);
  }, [onDefaultMode]);

  useEffect(() => {
    document.addEventListener("LevelChanged", (e) => levelSelected(e));
    return () => {
      document.removeEventListener("LevelChanged", (e) => levelSelected(e));
    };
  }, [deviceList, measuredParameter, levelSelected]);

  const ConnectionChanged = (e: any) => {
    const connection = e.detail as IoTConnection;
    const callbacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
    if (callbacks.size !== 0) {
      IoTConnectionManager.connectionChangedNotification(connection);
    }
    if (!connection.get()) {
      removeColorCode(connection);
    }
  };

  useEffect(() => {
    document.addEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    return () => {
      document.removeEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    };
  }, [deviceList, measuredParameter]);

  const handleShowHeatMap = (checkedHeatMap: boolean) => {
    if (!checkedHeatMap) {
      onDefaultMode();
    }
    setIsHeatMapEnabled(checkedHeatMap);
  };

  return (<>
    <br />
    <div style={{ margin: "8px" }}>
      <div></div>
      <ToggleSwitch labelPosition="right" defaultChecked={isHeatMapEnabled} onChange={(e) => handleShowHeatMap(e.target.checked)} label={"Show Heat Map"} />
      <div className="MonitoringModes">
        <div>
          {
            ITwinViewerApp.store.getState().deviceState.phenomenonList.map((parameterEl) => (
              <div key={parameterEl}>
                <input
                  type="radio"
                  name={parameterEl}
                  value={parameterEl}
                  checked={measuredParameter === parameterEl}
                  onChange={() => handleSelectedPhenomenonChanged(parameterEl)}
                  disabled={isHeatMapEnabled ? phenomenon.includes(parameterEl) ? false : true : true}
                />
                <span>{parameterEl}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
    <br />
  </>);
};
