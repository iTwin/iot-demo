/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

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

const generateNoise = (noiseSd, noisemagnitude) => {
    if (noisemagnitude !== undefined && noiseSd !== undefined) {
        let mean = 0;
        let standard_deviation = parseFloat(noiseSd);
        // Taken reference from this link for range of x->https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Normal_Distribution_PDF.svg
        let x = (Math.random() - 0.5) * 2;
        // Taken reference from this link for noise value->https://en.wikipedia.org/wiki/Normal_distribution
        let noise = (1 / (Math.sqrt(2 * Math.PI) * standard_deviation)) * Math.pow(Math.E, -1 * Math.pow((x - mean) / standard_deviation, 2) / 2);
        let noise_magnitude = noisemagnitude * Math.sign((Math.random() - 0.5) * 2);
        return noise * noise_magnitude;
    }
    return 0;
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
        const min = parseFloat(device.min);
        const max = parseFloat(device.max);
        if (device.behaviour !== undefined && device.behaviour !== '') {
            if (device.behaviour === 'Sine Function' && device.mean !== undefined && device.amplitude !== undefined && device.phase !== undefined && device.sine_period !== undefined && device.mean !== '' && device.amplitude !== '' && device.phase !== '' && device.sine_period !== '') {
                let t = (currTime - startTime) / 1000;
                let tempData = parseFloat(device.mean) + Math.sin(t * (2 * Math.PI) / (parseFloat(device.sine_period) / 1000) + parseFloat(device.phase)) * parseFloat(device.amplitude);
                currData = tempData + generateNoise(parseFloat(device.noiseSd), parseFloat(device.noise_magnitude));
            }
            else if (device.behaviour === 'Constant Function' && device.mean !== undefined && device.mean !== '') {
                let tempData = parseFloat(device.mean);
                currData = tempData + generateNoise(parseFloat(device.noiseSd), parseFloat(device.noise_magnitude));
            }
            else {
                currData = min + (Math.random() * (max - min));
            }
        }
        else {
            if (device.valueIsBool) {
                const randomBoolean = () => Math.random() >= 0.5;
                currData = randomBoolean();
            }
            else {
                currData = min + (Math.random() * (max - min));
            }
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
