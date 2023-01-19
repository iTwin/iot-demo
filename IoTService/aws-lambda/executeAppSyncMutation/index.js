/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

const https = require('https');
const AWS = require('aws-sdk');
const urlParse = require("url").URL;

//environment variables
const region = process.env.AWS_RESOURCE_REGION
const appsyncUrl = process.env.AWS_APPSYNC_GRAPHQL_ENDPOINT
const endpoint = new urlParse(appsyncUrl).hostname.toString();

exports.handler = async (event) => {

  const req = new AWS.HttpRequest(appsyncUrl, region);

  //define the graphql mutation to create the sensor values
  const mutationName = 'Publish';
  const mutation = `
  mutation Publish($data: String!, $name: String!) {
      publish(data: $data, name: $name) {
          data
          name
      }
  }
`;
  const item = {
    name: process.env.AWS_MQTT_TOPIC,
    data: JSON.stringify(event.data)
  };

  //execute the mutation
  try {

    req.method = "POST";
    req.headers.host = endpoint;
    req.headers["Content-Type"] = "application/json";
    req.body = JSON.stringify({
      query: mutation,
      operationName: mutationName,
      variables: item
    });

    const signer = new AWS.Signers.V4(req, "appsync", true);
    signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

    const data = await new Promise((resolve, reject) => {
      const httpRequest = https.request({ ...req, host: endpoint }, (result) => {
        result.on('data', (data) => {
          console.log(data);
          resolve(JSON.parse(data.toString()));
        });
      });

      httpRequest.write(req.body);
      httpRequest.end();

    });
    return {
      statusCode: 200,
      body: data
    };

  }
  catch (err) {
    console.log("error: " + err);
    throw new Error("Error creating sensor value");
  }
}