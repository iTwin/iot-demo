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
                        "deviceName": req.body.deviceInterfaceName
                    }
                }
            }
            const deviceId = req.body.deviceInterfaceId;
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
            console.log("array len "+req.body.deviceTwinArray.length);
            for (let index = 0; index < req.body.deviceTwinArray.length; index++) {
                const patch = {
                    properties: {
                        desired: {
                            "name": req.body.deviceTwinArray[index].deviceName,
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
                console.log(patch);
                const deviceId = req.body.deviceTwinArray[index].deviceInterfaceId;
                const moduleId = req.body.deviceTwinArray[index].deviceId;
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