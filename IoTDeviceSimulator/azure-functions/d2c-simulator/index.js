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
  require('dotenv').config()

  const jsonData = [];
  const iotHubName = ConnectionString.parse(process.env[req.body.connectionStringId], ["HostName"]).HostName;
  let deviceArray = req.body.selectedDevices.map((deviceTwin) => {
    return {

      deviceId: deviceTwin.deviceId,
      telemetrySendInterval: deviceTwin.telemetrySendInterval ?? 5000,
      unit: deviceTwin.unit,
      mean: deviceTwin.mean,
      amplitude: deviceTwin.amplitude,
      phenomenon: deviceTwin.phenomenon,
      valueIsBool: deviceTwin.valueIsBool,
      deviceSecurityType: "connectionString",
      connectionString: `HostName=${iotHubName};DeviceId=${deviceTwin.deviceId};SharedAccessKey=${deviceTwin.primaryKey}`,
      phase: Math.random() * Math.PI,
      behaviour: deviceTwin.behaviour,
      noise_magnitude: deviceTwin.noise_magnitude,
      noiseSd: deviceTwin.noiseSd,
      sine_period: deviceTwin.sine_period,
      isRunning: deviceTwin.isRunning,
      min: deviceTwin.min,
      max: deviceTwin.max,
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
      //getCurrentDataObject
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

    generateNoise() {
      if (this.device.noise_magnitude !== undefined && this.device.noiseSd !== undefined) {
        let mean = 0;
        let standard_deviation = parseFloat(this.device.noiseSd);
        // Taken reference from this link for range of x->https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Normal_Distribution_PDF.svg
        let x = (Math.random() - 0.5) * 2;
        // Taken reference from this link for noise value->https://en.wikipedia.org/wiki/Normal_distribution
        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
        let noise_magnitude = this.device.noise_magnitude * Math.sign((Math.random() - 0.5) * 2);
        return noise * noise_magnitude;
      }
      return 0;
    }

    updateSensor(device) {
      this.device = device;
      this.currTime = Date.now();
      const min = parseFloat(device.min);
      const max = parseFloat(device.max);
      if (device.behaviour !== undefined && device.behaviour !== '') {
        if (device.behaviour === 'Sine Function' && device.mean !== undefined && device.amplitude !== undefined && device.phase !== undefined && device.sine_period !== undefined && device.mean !== '' && device.amplitude !== '' && device.phase !== '' && device.sine_period !== '') {
          let t = (this.currTime - this.startTime) / 1000;
          let tempData = parseFloat(device.mean) + Math.sin(t * (2 * Math.PI) / (parseFloat(device.sine_period) / 1000) + parseFloat(device.phase)) * parseFloat(device.amplitude);
          this.currData = tempData + this.generateNoise();
        }
        else if (device.behaviour === 'Constant Function' && device.mean !== undefined && device.mean !== '') {
          let tempData = parseFloat(device.mean);
          this.currData = tempData + this.generateNoise();
        }
        else {
          this.currData = min + (Math.random() * (max - min));
        }
      }
      else {
        if (device.valueIsBool) {
          const randomBoolean = () => Math.random() >= 0.5;
          this.currData = randomBoolean();
        }
        else {
          this.currData = min + (Math.random() * (max - min));
        }
      }
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

  function SetInterval(client, device) {
    let index = 0;
    return setInterval(async () => {
      await sendTelemetry(client, index, device).catch((err) => context.log('error', err.toString()));
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
            intervalTokens.push(SetInterval(client, device));

            client.on('message', async function (msg) {
              stop = true;
              intervalTokens.forEach((value) => clearInterval(value));
              intervalTokens = [];
              if (req.body.enableLogging) {
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                const data = JSON.stringify(jsonData);
                // Upload data to the blob              
                const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
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
      intervalTokens.forEach((value) => clearInterval(value));
    }
  }

  runSimulator().then(() => context.log(`Executing simulator...\n`)).catch((err) => context.log('error', err));
}