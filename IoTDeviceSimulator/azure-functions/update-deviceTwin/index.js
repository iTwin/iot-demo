/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        var iothub = require('azure-iothub');
        var registry = iothub.Registry.fromConnectionString(process.env[req.body.connectionStringId]);
        var resultArray = [];
        for (let index = 0; index < req.body.deviceTwinArray.length; index++) {
            const patch = {
                properties: {
                    desired: {
                        "deviceName": req.body.deviceTwinArray[index].deviceName,
                        "mean": req.body.deviceTwinArray[index].mean,
                        "amplitude": req.body.deviceTwinArray[index].amplitude,
                        "unit": req.body.deviceTwinArray[index].unit,
                        "phenomenon": req.body.deviceTwinArray[index].phenomenon,
                        "valueIsBool": req.body.deviceTwinArray[index].valueIsBool,
                        "telemetrySendInterval": req.body.deviceTwinArray[index].telemetrySendInterval,
                        "behaviour": req.body.deviceTwinArray[index].behaviour,
                        "noise_magnitude": req.body.deviceTwinArray[index].noise_magnitude,
                        "noiseSd": req.body.deviceTwinArray[index].noiseSd,
                        "sine_period": req.body.deviceTwinArray[index].sine_period,
                        "isRunning": req.body.deviceTwinArray[index].isRunning,
                        "min": req.body.deviceTwinArray[index].min,
                        "max": req.body.deviceTwinArray[index].max,
                        "slope": req.body.deviceTwinArray[index].slope,
                        "behaviourArray": req.body.deviceTwinArray[index].behaviourArray,
                        "currDataArray": req.body.deviceTwinArray[index].currDataArray,
                        "signalArray": req.body.deviceTwinArray[index].signalArray,
                        "renderList": req.body.deviceTwinArray[index].renderList,
                    },
                },
            };
            const deviceId = req.body.deviceTwinArray[index].deviceId;
            const twin = await registry.getTwin(deviceId);
            const response = await twin.responseBody.update(patch);
            resultArray.push(response.result);
        }
        return {
            body: resultArray
        }
    }
    catch (error) {
        return {
            status: 500,
            body: error
        }
    }
}