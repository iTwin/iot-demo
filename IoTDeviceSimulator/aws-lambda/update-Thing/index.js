/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

var AWS = require('aws-sdk');
var region = process.env.AWS_RESOURCE_REGION;

AWS.config.update({
    region: region
});

const transformIntoAWSStructure = (res) => {
    if (res !== undefined) {
        res = res.toString();
        res = res.replaceAll('[', "");
        res = res.replaceAll(']', "");
        res = res.replaceAll('{', '#');
        res = res.replaceAll('}', '/');
        res = res.replaceAll(' ', '_');
        res = res.replaceAll('"', '@');
        return res;
    }
}

const iotClient = new AWS.Iot();
exports.handler = async (event) => {

    for (let thing of event.things) {
        var params = {
            thingName: thing.deviceId,
            thingTypeName: thing.thingTypeName,
            attributePayload: {
                attributes: {
                    'Phenomenon': thing.phenomenon,
                    'Unit': thing.unit,
                    'isRunning': thing.isRunning,
                    'TelemetrySendInterval': thing.telemetrySendInterval,
                    'ValueIsBool': thing.valueIsBool.toString(),
                    'NoiseSd': thing.noiseSd.toString(),
                    'signalArray': transformIntoAWSStructure(thing.signalArray)
                    /* '<AttributeName>': ... */
                },
                merge: true || false
            }
        };
        await iotClient.updateThing(params).promise();
    }

}