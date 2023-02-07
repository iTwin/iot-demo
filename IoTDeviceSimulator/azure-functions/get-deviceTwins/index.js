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

        const dataSet = [];
        for (const device of devices) {

            const deviceData = { deviceId: device.deviceId, telemetryPoints: [] };

            const modules = await registry.getModulesOnDevice(device.deviceId);

            const moduleIdentity = modules.responseBody.map((moduleT) => {
                return { moduleId: moduleT.moduleId, authentication: moduleT.authentication }
            });

            for (const modIdentity of moduleIdentity) {
                const moduleTwin = await registry.getModuleTwin(device.deviceId, modIdentity.moduleId);

                moduleTwin.responseBody.authentication = modIdentity.authentication;
                deviceData.telemetryPoints.push(moduleTwin.responseBody);
            }
            if (deviceData.telemetryPoints.length !== 0) {
                dataSet.push(deviceData);
            }
        }
        return {
            body: dataSet
        };
    } catch (error) {
        return {
            status: 500,
            body: error
        }
    }
}