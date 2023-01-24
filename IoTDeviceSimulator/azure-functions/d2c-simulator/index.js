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
      slope: deviceTwin.slope,
      behaviourArray: deviceTwin.behaviourArray,
      currDataArray: deviceTwin.currDataArray,
      signalArray: deviceTwin.signalArray,
      renderList: deviceTwin.renderList,
    }
  });

  const modelIdObject = { modelId: 'dtmi:com:example:Thermostat;1' };

  class generator {
    constructor() {
      if (this.constructor === generator) {
        const error = new Error("Can't instantiate abstract class!");
        console.log(error);
      }
    }

    generateValues(t) {
      const error = new Error("This method can't be called!");
      console.log(error);
    }
  }

  class sineGenerator extends generator {
    constructor(mean, amplitude, sine_period, phase) {
      super();
      this.mean = mean;
      this.amplitude = amplitude;
      this.sine_period = sine_period;
      this.phase = phase;
    }

    generateValues(t) {
      let tempData = parseFloat(this.mean) + Math.sin(t * (2 * Math.PI) / (parseFloat(this.sine_period) / 1000) + parseFloat(this.phase)) * parseFloat(this.amplitude);
      return tempData;
    }
  }

  class constantGenerator extends generator {
    constructor(mean) {
      super();
      this.mean = mean;
    }

    generateValues(t) {
      let tempData = parseFloat(this.mean);
      return tempData;
    }
  }

  class increasingGenerator extends generator {
    constructor(slope) {
      super();
      this.slope = slope;
    }

    generateValues(t) {
      let tempData = parseFloat(this.slope) * t;
      return tempData;
    }
  }

  class randomGenerator extends generator {
    constructor(min, max) {
      super();
      this.min = min;
      this.max = max;
    }

    generateValues(t) {
      const mean = (parseFloat(this.min) + parseFloat(this.max)) / 2;
      const constObj = new constantGenerator(mean);
      let tempData = constObj.generateValues(t);
      const noise_magnitude = (Math.random() * (parseFloat(this.max) - parseFloat(this.min))) / 2;
      const noiseSd = 0.45;
      const noiseObj = new noiseGenerator(noise_magnitude, noiseSd);
      tempData += noiseObj.generateValues(t);
      return tempData;
    }
  }

  class booleanGenerator extends generator {
    constructor() {
      super();
    }

    generateValues(t) {
      const randomBoolean = () => Math.random() >= 0.5;
      let tempData = randomBoolean();
      return tempData;
    }
  }

  class noiseGenerator extends generator {
    constructor(noise_magnitude, noiseSd) {
      super();
      this.noise_magnitude = noise_magnitude;
      this.noiseSd = noiseSd;
    }

    generateValues(t) {
      if (this.noise_magnitude !== undefined && this.noiseSd !== undefined) {
        let mean = 0;
        let standard_deviation = parseFloat(this.noiseSd);
        // Taken reference from this link for range of x->https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Normal_Distribution_PDF.svg
        let x = (Math.random() - 0.5) * 2;
        // Taken reference from this link for noise value->https://en.wikipedia.org/wiki/Normal_distribution
        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
        let noise_magnitude = parseFloat(this.noise_magnitude) * Math.sign((Math.random() - 0.5) * 2);
        return noise * noise_magnitude;
      }
      return 0;
    }
  }

  // generateTriangularValues(device, t) {
  //   let tempData = 4 * parseFloat(device.amplitude) / (parseFloat(device.sine_period) / 1000) * Math.abs((((t - (parseFloat(device.sine_period) / 1000) / 4) % (parseFloat(device.sine_period) / 1000)) + (parseFloat(device.sine_period) / 1000)) % (parseFloat(device.sine_period) / 1000) - (parseFloat(device.sine_period) / 1000) / 2) - parseFloat(device.amplitude);
  //   return tempData;
  // }

  // generateSawtoothValues(device, t) {
  //   let tempData = 2 * parseFloat(device.amplitude) * (t / (parseFloat(device.sine_period) / 1000) - Math.floor(1 / 2 + t / (parseFloat(device.sine_period) / 1000)));
  //   return tempData;
  // }

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
      for (let index = 0; index < signalArray.length; index++) {
        res += signalArray[index].generateValues(time);
      }
      return res;
    }

    updateSensor(device) {
      this.device = device;
      this.currTime = Date.now();
      let signalArray = [];
      let time = (this.currTime - this.startTime) / 1000;
      if (device.behaviour !== undefined && device.behaviour !== '') {
        if (device.behaviour === 'Sine Function' && device.mean !== undefined && device.amplitude !== undefined && device.phase !== undefined && device.sine_period !== undefined && device.mean !== '' && device.amplitude !== '' && device.phase !== '' && device.sine_period !== '') {
          const sineObj = new sineGenerator(device.mean, device.amplitude, device.sine_period, device.phase);
          const noiseObj = new noiseGenerator(device.noise_magnitude, device.noiseSd);
          signalArray.push(sineObj);
          signalArray.push(noiseObj);
        }
        else if (device.behaviour === 'Constant Function' && device.mean !== undefined && device.mean !== '') {
          const constantObj = new constantGenerator(device.mean);
          const noiseObj = new noiseGenerator(device.noise_magnitude, device.noiseSd);
          signalArray.push(constantObj);
          signalArray.push(noiseObj);
        }
        else if (device.behaviour === 'Strictly Increasing Function' && device.slope !== undefined && device.slope !== '') {
          const increasingObj = new increasingGenerator(device.slope);
          const noiseObj = new noiseGenerator(device.noise_magnitude, device.noiseSd);
          signalArray.push(increasingObj);
          signalArray.push(noiseObj);
        }
        else {
          const randomObj = new randomGenerator(device.min, device.max);
          signalArray.push(randomObj);
        }
      }
      else {
        if (device.valueIsBool) {
          const booleanObj = new booleanGenerator();
          signalArray.push(booleanObj);
        }
        else {
          const randomObj = new randomGenerator(device.min, device.max);
          signalArray.push(randomObj);
        }
      }
      this.currData = this.generateSignal(signalArray, time);
      return this;
    }

    updateSensorForResolve(device) {
      this.device = device;
      this.currTime = Date.now();
      let signalArray = [];
      let time = (this.currTime - this.startTime) / 1000;
      const randomObj = new randomGenerator(device.min, device.max);
      signalArray.push(randomObj);
      this.currData = this.generateSignal(signalArray, time);
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
              else {
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