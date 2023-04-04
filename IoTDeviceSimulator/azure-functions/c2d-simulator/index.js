/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
  'use strict';

  var config = require('dotenv').config();
  var Client = require('azure-iothub').Client;
  var Message = require('azure-iot-common').Message;

  var targetTelemetryId = req.body.telemetryId;
  var targetDeviceId= req.body.deviceId; 
  var serviceClient = Client.fromConnectionString(process.env[req.body.connectionStringId]);

  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) context.log(op + ' error: ' + err.toString());
      if (res) context.log(op + ' status: ' + res.constructor.name);
    };
  }
  
  serviceClient.open();

  var methodParams = {
    methodName: "stop",
    payload: {},
    timeoutInSeconds: 30
};

serviceClient.invokeDeviceMethod(targetDeviceId, targetTelemetryId, methodParams, function(err, result) {
    if (err) {
        console.error("Direct method error: "+err.message);
    } else {
        console.log("Successfully invoked the device to reboot.");  
    }
});
}