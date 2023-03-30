/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        console.log("Entering create-device");
        let res;
        let iothub = require('azure-iothub');
        let registry = iothub.Registry.fromConnectionString(process.env[req.body.connectionStringId]);
        console.log(req.body.isDeviceTwin);
        if(req.body.isDeviceTwin === 'true'){
            const deviceId = req.body.deviceInterfaceId;
            res = await registry.create({ deviceId});
            console.log('create-device for deviceTwin ' + deviceId);
        }
        else{
            console.log("Entering create-device for module twin ");
            const moduleId = req.body.deviceId;
            const deviceId = req.body.deviceInterfaceId;
            res = await registry.addModule({ deviceId, moduleId });
            console.log('create-device for moduleTwin' + deviceId + "," + moduleId);
        }
        return {
            body: res.responseBody
        }
        
    } catch (error) {
        return {
            status: 500,
            body: `${error}`
        }
    }
}