/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export const getHeaders = () => {
  return new Headers({
    "x-functions-key": process.env.REACT_APP_AZURE_FUNCTION_APP_ADMIN_KEY ?? ""
  })
}

export const getDataFromAzure = async (selectedConnectionStringId) => {
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/get-deviceTwins?connectionStringId=${selectedConnectionStringId}` ?? "", {
    method: "get",
    headers: getHeaders(),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    const devices = await response.json();
    const rows = [];
    const deviceIdList = [];
    let deviceId;
    let telemetryIds = [];
    devices.forEach(device => {
      telemetryIds = [];
      deviceId = device.deviceId;
      device.telemetryPoints.forEach(telemetry=>{
        rows.push({
          telemetryId: telemetry.moduleId,
          deviceId:telemetry.deviceId,
          telemetryName: telemetry.properties.desired.name,          
          phenomenon: telemetry.properties.desired.phenomenon,
          telemetrySendInterval: telemetry.properties.desired.telemetrySendInterval,
          unit: telemetry.properties.desired.unit,
          valueIsBool: telemetry.properties.desired.valueIsBool,          
          noiseSd: telemetry.properties.desired.noiseSd,
          sine_period: telemetry.properties.desired.sine_period,
          min: telemetry.properties.desired.min,
          max: telemetry.properties.desired.max,
          isRunning: telemetry.properties.desired.isRunning,
          primaryKey: telemetry.authentication.symmetricKey.primaryKey,
          signalArray:telemetry.properties.desired.signalArray
        });
        telemetryIds.push(telemetry.moduleId);
      });

      deviceIdList.push({
          deviceId,
          telemetryIds
        });

    });
    console.log("getAzureTwins rows " + rows);
    return { rows: rows , deviceIdList: deviceIdList};
  }
}

export const startSimulatorForAzure = async (selectedDevices, enableLogging, selectedConnectionStringId) => {
  const data = { selectedDevices: selectedDevices, enableLogging: enableLogging, connectionStringId: selectedConnectionStringId }
  const response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/d2c-simulator`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return true;
  }
  return false;
}

export const stopSimulatorForAzure = async (selectedDevices, selectedConnectionStringId) => {
  const data = { telemetryId: selectedDevices[0].telemetryId, deviceId:selectedDevices[0].deviceId, connectionStringId: selectedConnectionStringId }
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/c2d-simulator`, {
    method: "POST",
    headers: getHeaders(),
    keepalive: true,
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return true;
  }
  return false;
}

export const editTwins = async (value, connectionStringId, isDeviceTwin) => {
  let data;
  if(isDeviceTwin){
    data = { deviceId: value?.deviceId, deviceName: value?.deviceName, connectionStringId: connectionStringId, isDeviceTwin: isDeviceTwin }
  }
  else{
    data = { telemetryPointArray: value, connectionStringId: connectionStringId, isDeviceTwin: isDeviceTwin }
  }
  const response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/update-deviceTwin`, {
    method: 'POST',
    headers: getHeaders(),
    keepalive: true,
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    console.log("AzureUtilities - update res:" + response);
    return { response: response, updated: true };
  }
  return { response: response, updated: false };
}