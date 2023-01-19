/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
    try {
        var iothub = require('azure-iothub');
        var registry = iothub.Registry.fromConnectionString(process.env[req.query.connectionStringId]);
        const response = await registry.list();
        const devices = response.responseBody.map((device) => {
            return { deviceId: device.deviceId, authentication: device.authentication }
        });
        const deviceTwins = [];
        for (const device of devices) {
            const twin = await registry.getTwin(device.deviceId);
            twin.responseBody.authentication = device.authentication;
            deviceTwins.push(twin.responseBody);
        }
        return {
            // status: 200, /* Defaults to 200 */
            body: deviceTwins
        };
    } catch (error) {
        return {
            status: 500,
            body: error
        }
    }
}