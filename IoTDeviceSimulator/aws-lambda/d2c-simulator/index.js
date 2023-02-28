/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
const { SineGenerator, ConstantGenerator, IncreasingGenerator, NoiseGenerator, TriangularGenerator, SawtoothGenerator, SquareGenerator, RandomGenerator, BooleanGenerator } = require('../signalGenerator.js');

var AWS = require('aws-sdk');
let interval = [];
let stopInterval = [];
let timeout;
let stop = false;
var iotdata = new AWS.IotData({ endpoint: process.env.AWS_IOT_CONNECTION_ENDPOINT });
var region = process.env.AWS_RESOURCE_REGION;

AWS.config.update({
    region: region
});

let startTime;
const iotClient = new AWS.Iot();

const checkSimulatorStopped = (device) => {
    stopInterval.push(setInterval(async function () {
        let listOfThings = {};
        await iotClient.listThings(async (err, data) => {

            if (err) {
                console.log(err, err.stack);
                listOfThings = {}
            }
            else {
                listOfThings = data.things;
            }
        }).promise();

        const things = listOfThings;
        const thing = things.find((thing) => thing.thingName === device.deviceId);
        if (thing.attributes.isRunning === "false") {
            stop = true;
            stopInterval.forEach((int) => {
                clearInterval(int)
            })
            clearTimeout(timeout);
        }

    }, 10000));
}

const generateSignal = (signalArray, time) => {
    let res = 0;
    let obj;
    for (let index = 0; index < signalArray.length; index++) {
        if (JSON.parse(signalArray[index])["Behaviour"] === "Sine") {
            obj = new SineGenerator(JSON.parse(signalArray[index])["Mean"], JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"], JSON.parse(signalArray[index])["Phase"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Constant") {
            obj = new ConstantGenerator(JSON.parse(signalArray[index])["Mean"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Linear") {
            obj = new IncreasingGenerator(JSON.parse(signalArray[index])["Slope"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Noise") {
            obj = new NoiseGenerator(JSON.parse(signalArray[index])["Noise Magnitude"], JSON.parse(signalArray[index])["Noise Standard-deviation"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Triangular") {
            obj = new TriangularGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Sawtooth") {
            obj = new SawtoothGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Square") {
            obj = new SquareGenerator(JSON.parse(signalArray[index])["Amplitude"], JSON.parse(signalArray[index])["Wave Period"]);
        }
        else if (JSON.parse(signalArray[index])["Behaviour"] === "Random") {
            obj = new RandomGenerator(JSON.parse(signalArray[index])["Min"], JSON.parse(signalArray[index])["Max"]);
        }
        res += obj.generateValues(time);
    }
    return res;
}

const publishData = async (device, callback) => {

    let i = 0;
    device.phase = Math.random() * Math.PI;
    const dataFrequency = device.telemetrySendInterval;
    if (dataFrequency >= 900000) {
        dataFrequency = 900000;
    }
    interval.push(setInterval(async function () {

        if (stop) {
            interval.forEach((int) => {
                clearInterval(int)
            })
            stop = false;
            return callback(null, {
                statusCode: 200,
                body: 'data sent'
            })
        }
        const currTime = Date.now();
        let currData = 0;
        let time = (currTime - startTime) / 1000;
        if (device.valueIsBool) {
            const boolObj = new BooleanGenerator();
            currData = boolObj.generateValues(time);
        }
        else {
            currData = generateSignal(device.signalArray, time);
        }
        var params = {
            topic: process.env.AWS_MQTT_TOPIC,
            payload: JSON.stringify({ "data": { deviceId: device.deviceId, data: currData, timeStamp: (new Date(currTime)).toString() } }),
            qos: 0
        };
        const request = iotdata.publish(params);
        request
            .on('success', () => console.log("Success"))
            .on('error', () => console.log("Error"))
        new Promise(() => request.send());

    }, parseFloat(dataFrequency)));
}

exports.handler = async (event, context, callback) => {
    startTime = Date.now();
    const simulatorTimeout = event.interval;
    if (simulatorTimeout >= 900000) {
        simulatorTimeout = 900000;
    }
    timeout = setTimeout(function () {
        stop = true;
        stopInterval.forEach((int) => {
            clearInterval(int)
        })
    }, parseInt(simulatorTimeout));
    checkSimulatorStopped(event.devices[0]);
    event.devices.forEach(async (device) => {
        publishData(device, callback);
    }
    );
    return callback(null, {
        statusCode: 200,
        body: ' sent'
    })

};
