/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
  'use strict';

  const Protocol = require('azure-iot-device-mqtt').Mqtt;
  const Client = require('azure-iot-device').Client;
  const Message = require('azure-iot-device').Message;
  const ConnectionString = require('azure-iot-common').ConnectionString;
  const { BlobServiceClient } = require('@azure/storage-blob');
  const { sineGenerator, constantGenerator, increasingGenerator, noiseGenerator, triangularGenerator, sawtoothGenerator, squareGenerator, randomGenerator, booleanGenerator } = require('../signalGenerator.js');
  require('dotenv').config()

  const jsonData = [];
  const iotHubName = ConnectionString.parse(process.env[req.body.connectionStringId], ["HostName"]).HostName;
  let deviceArray = req.body.selectedDevices.map((deviceTwin) => {
    return {
      deviceId: deviceTwin.deviceId,
      telemetrySendInterval: deviceTwin.telemetrySendInterval ?? 5000,
      unit: deviceTwin.unit,
      phenomenon: deviceTwin.phenomenon,
      valueIsBool: deviceTwin.valueIsBool,
      deviceSecurityType: "connectionString",
      connectionString: `HostName=${iotHubName};DeviceId=${deviceTwin.deviceId};SharedAccessKey=${deviceTwin.primaryKey}`,
      phase: Math.random() * Math.PI,
      noiseSd: deviceTwin.noiseSd,
      isRunning: deviceTwin.isRunning,
      min: deviceTwin.min,
      max: deviceTwin.max,
      currDataArray: deviceTwin.currDataArray,
      signalArray: deviceTwin.signalArray,
    }
  });

  const modelIdObject = { modelId: 'dtmi:com:example:Thermostat;1' };

  class GenericDevice {
    constructor() {
      this.currData = 50 + (Math.random() * 46);
      this.currTime = 0;
      this.startTime = Date.now();
      this.device = {
        deviceId: "",
        data: this.currData,
        unit: "",
        phenomenon: "",
      }
    }

    getCurrentDataObject() {
      let telemetry;
      let unit;
      let data;
      if (this.device.valueIsBool) {
        unit = "";
        data = this.currData.toString();
      } else {
        unit = this.device.unit;
        data = this.currData;
      }
      telemetry = {
        deviceId: this.device.deviceId,
        data: data,
        timeStamp: (new Date(this.currTime)).toString()
      };
      context.log(`${JSON.stringify(telemetry)}\n`);
      if (req.body.enableLogging) {
        jsonData.push(telemetry);
      }
      return telemetry;
    }

    generateSignal(signalArray, time) {
      let res = 0;
      let obj;
      for (let index = 0; index < signalArray.length; index++) {
        if (JSON.parse(signalArray[index])["Behaviour"] === "Sine") {
          obj = new sineGenerator(JSON.parse(signalArray[index])["Mean"], JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"], JSON.parse(signalArray[index])["Phase"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Constant") {
          obj = new constantGenerator(JSON.parse(signalArray[index])["Mean"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Linear") {
          obj = new increasingGenerator(JSON.parse(signalArray[index])["Slope"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Noise") {
          obj = new noiseGenerator(JSON.parse(signalArray[index])["Noise Magnitude"], JSON.parse(signalArray[index])["Noise Standard-deviation"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Triangular") {
          obj = new triangularGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Sawtooth") {
          obj = new sawtoothGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        else {
          obj = new squareGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        res += obj.generateValues(time);
      }
      return res;
    }

    updateSensor(device) {
      this.device = device;
      this.currTime = Date.now();
      let time = (this.currTime - this.startTime) / 1000;
      if (device.valueIsBool) {
        const boolObj = new booleanGenerator();
        this.currData = boolObj.generateValues(time);
      }
      else {
        this.currData = this.generateSignal(device.signalArray, time);
      }
      console.log(this.currData);
      return this;
    }

    updateSensorForResolve(device) {
      this.device = device;
      this.currTime = Date.now();
      let time = (this.currTime - this.startTime) / 1000;
      const randomObj = new randomGenerator(device.min, device.max);
      this.currData = randomObj.generateValues(time);
      return this;
    }
  }

  let intervalTokens = [];
  const deviceObj = new GenericDevice();

  async function sendTelemetry(deviceClient, index, device) {
    const msg = new Message(
      JSON.stringify(
        deviceObj.updateSensor(device).getCurrentDataObject()
      )
    );
    msg.contentType = 'application/json';
    msg.contentEncoding = 'utf-8';
    await deviceClient.sendEvent(msg);
  }

  async function sendTelemetryForResolve(deviceClient, index, device) {
    const msg = new Message(
      JSON.stringify(
        deviceObj.updateSensorForResolve(device).getCurrentDataObject()
      )
    );
    msg.contentType = 'application/json';
    msg.contentEncoding = 'utf-8';
    await deviceClient.sendEvent(msg);
  }

  function SetInterval(client, device) {
    let index = 0;
    return setInterval(async () => {
      await sendTelemetry(client, index, device).catch((err) => context.log('error', err.toString()));
      index += 1;
    }, (parseInt(device.telemetrySendInterval)))
  }

  function SetIntervalForResolve(client, device) {
    let index = 0;
    return setInterval(async () => {
      await sendTelemetryForResolve(client, index, device).catch((err) => context.log('error', err.toString()));
      index += 1;
    }, (parseInt(device.telemetrySendInterval)))
  }

  function SetIntervalForResolve(client, device) {
    let index = 0;
    return setInterval(async () => {
      await sendTelemetryForResolve(client, index, device).catch((err) => context.log('error', err.toString()));
      index += 1;
    }, (parseInt(device.telemetrySendInterval)))
  }

  async function runSimulator() {
    let stop = false;
    const containerName = "simulatorcontainer";
    const blobName = "devicelog_".concat(req.body.connectionStringId.concat(".json"))
    let containerClient = "";
    if (req.body.enableLogging) {
      const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
      if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error("Azure Storage Connection string not found");
      }
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
      );
      let containerExists = false;

      containerClient = blobServiceClient.getContainerClient(containerName);
      for await (const container of blobServiceClient.listContainers()) {
        if (container.name === containerName) {
          containerExists = true;
        }
      }
      if (!containerExists) {
        // Create the container
        const createContainerResponse = await containerClient.create();
      }

      const options = {
        deleteSnapshots: 'include' // or 'only'
      }

      // Create blob client from container client
      const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists(options);
    }

    for (const device of deviceArray) {
      if (!stop) {
        const useDps = device.deviceSecurityType;
        let deviceConnectionString = device.connectionString;

        // If the user include a provision host then use DPS
        if (useDps === 'connectionString') {
          try {
            if (!(deviceConnectionString && ConnectionString.parse(deviceConnectionString, ['HostName', 'DeviceId']))) {
              context.error('Connection string was not specified.');
              process.exit(1);
            }
          } catch (err) {
            context.error('Invalid connection string specified.');
            process.exit(1);
          }
        } else {
          context.log('No proper SECURITY TYPE provided.');
          process.exit(1);
        }
        // fromConnectionString must specify a transport, coming from any transport package.
        try {
          const client = Client.fromConnectionString(deviceConnectionString, Protocol);

          try {
            // Add the modelId here
            await client.setOptions(modelIdObject);

            await client.open();
            intervalTokens[device.deviceId] = SetInterval(client, device);

            client.on('message', async function (msg) {
              if (msg.messageId.includes("stop")) {
                stop = true;
                for (const key in intervalTokens) {
                  clearInterval(intervalTokens[key]);
                }
                intervalTokens = [];
                if (req.body.enableLogging) {
                  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                  const data = JSON.stringify(jsonData);
                  // Upload data to the blob              
                  const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
                }
              }
              else if (msg.messageId.includes("resolve")) {
                clearInterval(intervalTokens[device.deviceId]);
                intervalTokens[device.deviceId] = SetIntervalForResolve(client, device);
              }
              client.complete(msg, function (err) {
                if (err) {
                  context.log('Complete error: ' + err.toString());
                } else {
                  context.log('Complete sent');
                }
              });
              // client.close();
            });
            client.close();
          }
          catch (ex) {
            context.log(`Connection could not be opened`);
          }
        } catch (err) {
          context.error('could not connect Plug and Play client or could not attach interval function for telemetry\n' + err.toString());
        }
      }
    }

    if (stop) {
      for (const key in intervalTokens) {
        clearInterval(intervalTokens[key]);
      }
    }
  }

  runSimulator().then(() => context.log(`Executing simulator...\n`)).catch((err) => context.log('error', err));
}