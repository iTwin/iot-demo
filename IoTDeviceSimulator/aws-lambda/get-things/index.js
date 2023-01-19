/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

var AWS = require('aws-sdk');
var region = process.env.AWS_RESOURCE_REGION;

AWS.config.update({
    region: region
});

const iotClient = new AWS.Iot();

exports.handler = async (event) => {
    let listOfThings = {};
    let statusCode = 200;
    await iotClient.listThings(async (err, data) => {
        if (err) {
            console.log(err, err.stack);
            statusCode = 404;
            listOfThings = {}
        }
        else {
            listOfThings = data.things;
        }
    }).promise();

    const response = {
        statusCode: statusCode,
        body: JSON.stringify(listOfThings)
    }
    return response;
};
