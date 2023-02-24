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
                        "unit": req.body.deviceTwinArray[index].unit,
                        "phenomenon": req.body.deviceTwinArray[index].phenomenon,
                        "valueIsBool": req.body.deviceTwinArray[index].valueIsBool,
                        "telemetrySendInterval": req.body.deviceTwinArray[index].telemetrySendInterval,
                        "noiseSd": req.body.deviceTwinArray[index].noiseSd,
                        "isRunning": req.body.deviceTwinArray[index].isRunning,
                        "min": req.body.deviceTwinArray[index].min,
                        "max": req.body.deviceTwinArray[index].max,
                        "signalArray": req.body.deviceTwinArray[index].signalArray,
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