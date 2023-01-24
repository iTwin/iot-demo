/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export const getAzureDeviceTwins = async (selectedConnectionStringId) => {
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/get-deviceTwins?connectionStringId=${selectedConnectionStringId}` ?? "").catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    const devices = await response.json();
    const rows = [];
    devices.forEach(device => {
      rows.push({
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
        slope: device.properties.desired.slope,
        behaviourArray: device.properties.desired.behaviourArray,
        currDataArray: device.properties.desired.currDataArray,
        signalArray: device.properties.desired.signalArray,
        renderList: device.properties.desired.renderList,
      })
    });
    return { deviceTwins: devices, rows: rows };
  }
}

export const startSimulatorForAzure = async (selectedDevices, enableLogging, selectedConnectionStringId) => {
  const data = { selectedDevices: selectedDevices, enableLogging: enableLogging, connectionStringId: selectedConnectionStringId }
  const response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/d2c-simulator`, {
    method: "POST",
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return true;
  }
  return false;
}

export const stopSimulatorForAzure = async (selectedDevices, selectedConnectionStringId) => {
  const data = { deviceId: selectedDevices[0].deviceId, connectionStringId: selectedConnectionStringId, action: "stop" }
  let response = await fetch(`${process.env.REACT_APP_FUNCTION_URL ?? ""}/c2d-simulator`, {
    method: "POST",
    keepalive: true,
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
    keepalive: true,
    body: JSON.stringify(data),
  }).catch(error => console.log("Request failed: " + error));
  if (response && response.status === 200) {
    return { response: response, updated: true };
  }
  return { response: response, updated: false };
}