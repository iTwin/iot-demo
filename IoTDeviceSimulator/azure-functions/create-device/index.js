/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        var iothub = require('azure-iothub');
        var registry = iothub.Registry.fromConnectionString(process.env[req.body.connectionStringId]);
        const deviceId = req.body.deviceId;
        const res = await registry.create({ deviceId });
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