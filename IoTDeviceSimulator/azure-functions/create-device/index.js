/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        let res;
        let iothub = require('azure-iothub');
        let registry = iothub.Registry.fromConnectionString(process.env[req.body.connectionStringId]);
        if(process.env[req.body.deviceInterfaceId]){
            const deviceId = req.body.deviceInterfaceId;
            res = await registry.create({ deviceId});
        }
        else{
            const moduleId = req.body.deviceId;
            res = await registry.create({ moduleId });
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