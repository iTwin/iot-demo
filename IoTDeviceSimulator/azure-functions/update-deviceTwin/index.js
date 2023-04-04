/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        console.log("Entering update-device");
        let iothub = require('azure-iothub');
        let registry = iothub.Registry.fromConnectionString(process.env[req.body.connectionStringId]);
        if(req.body.isDeviceTwin === true){
            const patch = {
                properties: {
                    desired: {
                        "deviceName": req.body.deviceName
                    }
                }
            }
            const deviceId = req.body.deviceId;
            const twin = await registry.getTwin(deviceId);
            const response = await twin.responseBody.update(patch);
            console.log('update-device for deviceTwin ' + deviceId);
            return {
                body: response.result
            }
        }
        else{
            console.log("Entering update-device for module twin ");
            var resultArray = [];
            console.log("array len "+req.body.telemetryPointArray.length);
            for (let index = 0; index < req.body.telemetryPointArray.length; index++) {
                const patch = {
                    properties: {
                        desired: {
                            "name": req.body.telemetryPointArray[index].telemetryName,
                            "unit": req.body.telemetryPointArray[index].unit,
                            "phenomenon": req.body.telemetryPointArray[index].phenomenon,
                            "valueIsBool": req.body.telemetryPointArray[index].valueIsBool,
                            "telemetrySendInterval": req.body.telemetryPointArray[index].telemetrySendInterval,
                            "noiseSd": req.body.telemetryPointArray[index].noiseSd,
                            "isRunning": req.body.telemetryPointArray[index].isRunning,
                            "min": req.body.telemetryPointArray[index].min,
                            "max": req.body.telemetryPointArray[index].max,
                            "signalArray": req.body.telemetryPointArray[index].signalArray,
                        },
                    },
                };
                console.log(patch);
                const deviceId = req.body.telemetryPointArray[index].deviceId;
                const moduleId = req.body.telemetryPointArray[index].telemetryId;
                console.log("deviceId "+ deviceId + " moduleId "+ moduleId);
                const moduleTwin = await registry.getModuleTwin(deviceId, moduleId);
                const response = await moduleTwin.responseBody.update(patch);
                console.log(response.result);
                resultArray.push(response.result);
                console.log("ResultArray:" + resultArray);
            }
            console.log('update-device for moduleTwin ');
            return {
                body: resultArray
            }
        }
    }
    catch (error) {
        return {
            status: 500,
            body: error
        }
    }
}