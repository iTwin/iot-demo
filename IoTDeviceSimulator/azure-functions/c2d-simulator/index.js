/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req) {
  'use strict';

  var config = require('dotenv').config();
  var Client = require('azure-iothub').Client;
  var Message = require('azure-iot-common').Message;

  var targetDevice = req.body.deviceId;
  var serviceClient = Client.fromConnectionString(process.env[req.body.connectionStringId]);

  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) context.log(op + ' error: ' + err.toString());
      if (res) context.log(op + ' status: ' + res.constructor.name);
    };
  }
  
  serviceClient.open(function (err) {
    if (err) {
      context.error('Could not connect: ' + err.message);
    } else {
      context.log('Service client connected');      
      var message = new Message('Cloud to device message.');
      message.ack = 'full';
      message.messageId = `My Message ID: ${Date.now()}`;
      context.log('Sending message: ' + message.getData());
      serviceClient.send(targetDevice, message, printResultFor('send'));
    }
  });
}