/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export const getAWSThings = async () => {
  let response = await fetch(`${process.env.REACT_APP_AWS_API_GATEWAY_URL}/getthings` ?? "", {
    method: "get",
    headers: new Headers({
      "x-api-key": process.env.REACT_APP_AWS_API_GATEWAY_APIKEY ?? "",
      "Content-Type": "application/json",
    }),
  }).catch((error) => console.log(`Request failed: ${error}`));
  if (response && response.status === 200) {
    const result = await response.json();
    const things = JSON.parse(result.body);
    let rows = [];
    things.forEach(thing => {
      rows.push({
        deviceId: thing.thingName,
        deviceName: thing.thingName,
        amplitude: thing.attributes.Amplitude,
        mean: thing.attributes.Mean,
        phenomenon: thing.attributes.Phenomenon,
        telemetrySendInterval: thing.attributes.TelemetrySendInterval,
        unit: thing.attributes.Unit,
        valueIsBool: thing.attributes.ValueIsBool === "true" ? true : false,
        behaviour: thing.attributes.Behaviour.toString().replace("_", " "),
        noise_magnitude: thing.attributes.Noise_magnitude,
        noiseSd: thing.attributes.NoiseSd,
        sine_period: thing.attributes.Sine_period,
        isRunning: thing.attributes.isRunning,
        thingTypeName: thing.thingTypeName
      })
    });
    return { rows: rows };
  }
}

export const startSimulatorForAWS = async (selectedDevices) => {

  selectedDevices.map((device) => device.isRunning = "true");
  const result = await editAWSThings(selectedDevices);
  console.log(result);
  const data = { devices: selectedDevices, interval: "300000" }
  const response = fetch(`${process.env.REACT_APP_AWS_API_GATEWAY_URL}/d2csimulator` ?? "", {
    method: "post",
    headers: new Headers({
      "x-api-key": process.env.REACT_APP_AWS_API_GATEWAY_APIKEY ?? "",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data)
  }).catch((error) => console.log(`Request failed: ${error}`));
  console.log(response);
  return true;
}

export const stopSimulatorForAWS = async (selectedDevices) => {
  selectedDevices.map((device) => device.isRunning = "false");
  const result = await editAWSThings(selectedDevices);
  return result;
}

export const editAWSThings = async (selectedDevices) => {

  const response = await fetch(`${process.env.REACT_APP_AWS_API_GATEWAY_URL}/updatethings` ?? "", {
    method: "post",
    keepalive:true,
    headers: new Headers({
      "x-api-key": process.env.REACT_APP_AWS_API_GATEWAY_APIKEY ?? "",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ things: selectedDevices })
  }).catch((error) => console.log(`Request failed: ${error}`));
  if (response && response.status === 200) {
    return true;
  }
  return false;
}