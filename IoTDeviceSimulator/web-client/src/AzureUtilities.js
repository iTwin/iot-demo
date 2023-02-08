/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export const getHeaders=()=>{
  return new Headers({      
    "x-functions-key": process.env.REACT_APP_AZURE_FUNCTION_APP_ADMIN_KEY ?? ""      
  })
}

export const getAzureDeviceTwins = async (selectedConnectionStringId) => {
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/get-deviceTwins?connectionStringId=${selectedConnectionStringId}` ?? "",{
    method: "get",
    headers: getHeaders(),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    const devices = await response.json();
    const rows = [];
    devices.forEach(device => {
      device.telemetryPoints.forEach(telemetry=>{
        rows.push({
          deviceId: telemetry.moduleId,
          deviceInterfaceId:telemetry.deviceId,
          deviceName: telemetry.properties.desired.name,
          amplitude: telemetry.properties.desired.amplitude,
          mean: telemetry.properties.desired.mean,
          phenomenon: telemetry.properties.desired.phenomenon,
          telemetrySendInterval: telemetry.properties.desired.telemetrySendInterval,
          unit: telemetry.properties.desired.unit,
          valueIsBool: telemetry.properties.desired.valueIsBool,
          behaviour: telemetry.properties.desired.behaviour,
          noise_magnitude: telemetry.properties.desired.noise_magnitude,
          noiseSd: telemetry.properties.desired.noiseSd,
          sine_period: telemetry.properties.desired.sine_period,
          min: telemetry.properties.desired.min,
          max: telemetry.properties.desired.max,
          isRunning: telemetry.properties.desired.isRunning,
          primaryKey: telemetry.authentication.symmetricKey.primaryKey
        })
      })
      
    });
    return { deviceTwins: rows, rows: rows };
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
  const data = { deviceId: selectedDevices[0].deviceId, deviceInterfaceId:selectedDevices[0].deviceInterfaceId, connectionStringId: selectedConnectionStringId }
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/c2d-simulator`, {
    method: "POST",
    headers: getHeaders(),
    keepalive:true,
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return true;
  }
  return false;
}

export const editDeviceTwins = async (deviceArray, connectionStringId) => {
  const data = { deviceTwinArray: deviceArray, connectionStringId: connectionStringId }
  const response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/update-deviceTwin`, {
    method: 'POST',
    headers: getHeaders(),
    keepalive:true,
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return { response: response, updated: true };
  }
  return { response: response, updated: false };
}