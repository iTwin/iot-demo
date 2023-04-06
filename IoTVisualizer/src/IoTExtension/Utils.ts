/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ConsumerActionId, DeviceActionId } from "./app/AppState";
import { ITwinViewerApp } from "./app/ITwinViewerApp";
import { ITwinLink, Story } from "./clients/ITwinLink";
import { callbackType, IoTConnectionManager } from "./IoTConnection/IoTConnectionManager";
import { ActivityStatus, Roles, SmartDevice } from "./SmartDevice";
import { BlobServiceClient } from "@azure/storage-blob";
import { toaster } from "@itwin/itwinui-react";
import { IoTAlert } from "./IoTAlert";
import { Point3d } from "@itwin/core-geometry";

let configuration: any = [];
let alert: IoTAlert;

let userRole: Roles | undefined = Roles.Unauthorized;
export const getConnection = (deviceProps: SmartDevice) => {
  if (!deviceProps) {
    return;
  }
  const connection = IoTConnectionManager.getConnection(deviceProps.connectionId);
  return connection;
};

export const getLevelList = async () => {
  const levelIds = (await ITwinLink.getLevels()).reverse();
  const levelList: Story[] = [];
  levelIds.forEach((row, index) => {
    levelList[index] = { name: row.name, levelNumber: row.levelNumber, description: row.description, bottomElevation: row.bottomElevation, topElevation: row.topElevation };
  });
  return levelList;
};

export const getDevicesLevelWise = async (zmin?: number, zmax?: number) => {
  let devices = ITwinViewerApp.store.getState().deviceState.deviceList;
  if (devices.length === 0) {
    devices = await ITwinLink.fetchDevices();
    devices.forEach((device) => {
      device.isActive = ActivityStatus.Disconnected;
      device.noOfConsumers = 0;
    });
  }
  if (zmin && zmax)
    devices = devices.filter((device: any) => device.origin.z > zmin && device.origin.z < zmax);
  return devices;
};

export const setDeviceStatusToActive = (devices: SmartDevice[] | SmartDevice) => {
  const deviceList = ITwinViewerApp.store.getState().deviceState.deviceList;
  if (!Array.isArray(devices)) {
    deviceList?.forEach((d) => {
      if (d.iotId === devices.iotId) {
        if (getConnection(d)?.get()) {
          d.isActive = ActivityStatus.Active;
        }
        d.noOfConsumers += 1;
      }
    });
  } else {
    devices.forEach((device: SmartDevice) => {
      deviceList?.forEach((d) => {
        if (d.iotId === device.iotId) {
          if (getConnection(d)?.get()) {
            d.isActive = ActivityStatus.Active;
          }
          d.noOfConsumers += 1;
        }
      });
    });
  }
  const flag = ITwinViewerApp.store.getState().deviceState.changeDeviceStatus;
  ITwinViewerApp.store.dispatch({
    type: DeviceActionId.setDeviceList,
    payload: deviceList,
  });
  ITwinViewerApp.store.dispatch({
    type: DeviceActionId.setChangeDeviceStatus,
    payload: !flag,
  });
};

export const resetDeviceStatus = (devices: SmartDevice[] | SmartDevice) => {
  const deviceList = ITwinViewerApp.store.getState().deviceState.deviceList;
  if (!Array.isArray(devices)) {
    deviceList?.forEach((d) => {
      if (d.iotId === devices.iotId) {
        d.noOfConsumers -= 1;
        if (getConnection(d)?.get()) {
          if (d.noOfConsumers <= 0) {
            d.noOfConsumers = 0;
            d.isActive = ActivityStatus.Connected;
          } else {
            d.isActive = ActivityStatus.Active;
          }
        } else {
          d.isActive = ActivityStatus.Disconnected;
        }
      }
    });
  } else {
    devices.forEach((device: SmartDevice) => {
      deviceList?.forEach((d) => {
        if (d.iotId === device.iotId) {
          d.noOfConsumers -= 1;
          if (getConnection(d)?.get()) {
            if (d.noOfConsumers <= 0) {
              d.noOfConsumers = 0;
              d.isActive = ActivityStatus.Connected;
            } else {
              d.isActive = ActivityStatus.Active;
            }
          } else {
            d.isActive = ActivityStatus.Disconnected;
          }
        }
      });
    });
  }
  const flag = ITwinViewerApp.store.getState().deviceState.changeDeviceStatus;
  ITwinViewerApp.store.dispatch({
    type: DeviceActionId.setDeviceList,
    payload: deviceList,
  });
  ITwinViewerApp.store.dispatch({
    type: DeviceActionId.setChangeDeviceStatus,
    payload: !flag,
  });
};

export const getDevicesByDeviceId = (deviceIds: string[], deviceList: SmartDevice[]) => {
  const devicesForActivityStatusReset: SmartDevice | SmartDevice[] = [];
  deviceIds.forEach((id) => {
    const device = deviceList.find((d) => d.iotId === id);
    if (device !== undefined) {
      devicesForActivityStatusReset.push(device);
    }
  });
  return devicesForActivityStatusReset;
};

export const addConsumerCallback = (key: string, value: callbackType) => {
  const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
  if (callBacks.has(key)) {
    callBacks.delete(key);
  }
  callBacks.set(key, value);
  ITwinViewerApp.store.dispatch({
    type: ConsumerActionId.setConsumerCallback,
    payload: callBacks,
  });
};

export const removeConsumerCallback = (key: string) => {
  const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
  if (callBacks.has(key)) {
    callBacks.delete(key);
  }
  ITwinViewerApp.store.dispatch({
    type: ConsumerActionId.setConsumerCallback,
    payload: callBacks,
  });
};

export const resolveAlert = async (iotId: any, connectionId: any) => {
  const data = { deviceId: iotId, connectionStringId: connectionId, action: "resolve" };
  const response = await fetch(`${process.env.IMJS_FUNCTION_APP_URL}/c2d-simulator` ?? "", {
    method: "POST",
    body: JSON.stringify(data),
  }).catch((error) => console.log(`Request failed: ${error}`));
  if (response && response.status === 200) {
    return true;
  }
  return false;
};

export const func = async (elementId: any) => {
  const temp = resolveAlert(elementId, "IOT_HUB_CONNECTION_STRING1");
  return temp;
};

function getLabel(myArray: any[], iotId: any) {
  let label = "";
  myArray.forEach(function (element: any) {
    if (element.iotId === iotId) {
      label = element.label;
    }
  });
  return label;
}

function getLoc(myArray: any[], iotId: any) {
  let loc: Point3d = Point3d.create(0, 0, 0);
  myArray.forEach(function (element: any) {
    if (element.iotId === iotId) {
      loc = element.origin;
    }
  });
  return loc;
}

const handleAlert = (device: any, data: any, deviceList: any) => {
  if (device.isChecked === undefined) {
    device.isChecked = false;
  }
  if (parseFloat(data[0].value) > 110 && device.isChecked === false) {
    const label = getLabel(deviceList, data[0].iotId);
    const loc = getLoc(deviceList, data[0].iotId);
    alert = new IoTAlert(data[0].iotId, loc, label);
    alert.display();
    device.isChecked = true;
  } else if (parseFloat(data[0].value) < 110 && device.isChecked === true) {
    const label = getLabel(deviceList, data[0].iotId);
    toaster.closeAll();
    toaster.positive(`Temperature is normalised for '${label}'`);
    device.isChecked = false;
  }
};

export const getDeviceDataFromTelemetry = (msg: any, deviceList?: SmartDevice[]) => {

  const data: { iotId: string, value: string, unit: string, phenomenon: string, timeStamp: Date }[] = []; // Todo: can Queue data str. be used??

  if (msg !== "no data") {
    const msgJson = JSON.parse(msg);
    let realTimeData;

    if (msgJson) {
      if (deviceList?.find((d) => d.iotId === msgJson.telemetryId.toString()) !== undefined) {
        const device = deviceList?.find((dev) => dev.iotId === msgJson.telemetryId.toString());
        if (device !== undefined) {
          if (!isNaN(msgJson.data)) {
            if (device?.phenomenon !== "Motion" && device?.phenomenon !== "Occupancy") {
              realTimeData = parseFloat(msgJson.data).toFixed(1);
            }
          } else {
            realTimeData = msgJson.data;
          }
          data.push({
            iotId: device?.iotId, value: realTimeData, unit: device?.unit !== undefined ? device.unit : "", phenomenon: device?.phenomenon, timeStamp: msgJson.timeStamp,
          });
          if (process.env.IMJS_ENABLE_ALERT === "true") {
            handleAlert(device, data, deviceList);
          }
          return data;
        }
      }
    }

  } else if (msg === "no data") {
    deviceList?.forEach((device) => {
      data.push({ iotId: device.iotId, value: msg, unit: "", phenomenon: "", timeStamp: new Date() });
    });
  }
  return data;
};

export const getConfiguration = () => {

  return configuration;
};
export const readConfiguration = async () => {

  const blobData: any = await getBlobData("iot-demo-configuration", "IotVisualizerConfiguration.json");
  configuration = JSON.parse(blobData);

};

export async function blobToString(blob: any) {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onloadend = (ev) => {
      resolve(ev?.target?.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsText(blob);
  });
}

export const getBlobData = async (containerName: string, blobName: string) => {
  const blobServiceClient = new BlobServiceClient(process.env.IMJS_AZURE_STORAGE_SAS_URL ?? "");
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadBlockBlobResponse = await blockBlobClient.download(0);
  const downloadedData = await blobToString(await downloadBlockBlobResponse.blobBody);
  return downloadedData;
};

export const checkUserRole = async (user: any) => {
  const blobData: any = await getBlobData("iot-demo-configuration", "UserAuthorization.json");
  const roles = JSON.parse(blobData).Roles;
  for (const role of roles) {
    const emailId = role.emailIds.map((r: string) => r.toLowerCase());
    if (emailId.includes(user.toLowerCase())) {
      userRole = parseInt(Roles[role.Role], 10) as Roles;
      return userRole;
    }
  }
  return userRole;
};

export const getUserRole = () => {
  return userRole;
};
