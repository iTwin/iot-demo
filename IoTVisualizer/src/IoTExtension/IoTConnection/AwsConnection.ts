/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { DeviceActionId } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { SmartDevice } from "../SmartDevice";
import { IoTConnection } from "./IotConnection";
import { Amplify } from "@aws-amplify/core";
import API, { graphqlOperation } from "@aws-amplify/api";

const subscriptions: any[] = [];

export class AwsConnection extends IoTConnection {

  private _subscribeDoc = /* GraphQL */ `
  subscription Subscribe($name: String!) {
    subscribe(name: $name) {
      name
      data
    }
  }
`;
  constructor(connectionUrl: string) {
    super(connectionUrl);
    if (connectionUrl) {
      try {
        this._connection = Amplify.configure({
          aws_appsync_graphqlEndpoint: connectionUrl,
          aws_appsync_region: process.env.IMJS_AWS_REGION,
          aws_appsync_authenticationType: "API_KEY",
          aws_appsync_apiKey: process.env.IMJS_AWS_APPSYNC_APIKEY,
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(`Aws connection couldn't be established.`);
    }
  }

  public async populateDevices(deviceListFromIModel: SmartDevice[], connection: {
    id: number;
    type: string;
    name: string;
    connectionUrl1: string;
    connectionUrl2: string;
  }) {
    try {
      // fetch AWS things from AWS IoT Core
      const response = await fetch(`${connection.connectionUrl2}/getthings` ?? "", {
        method: "get",
        headers: new Headers({
          "x-api-key": process.env.IMJS_AWS_API_GATEWAY_APIKEY ?? "",
          "Content-Type": "application/json",
        }),
      }).catch((error) => console.log(`Request failed: ${error}`));
      let things: { thingName: string, attributes: { Phenomenon: string, Unit: string } }[] = [];
      if (response && response.status === 200) {
        const result = await response.json();
        things = JSON.parse(result.body);
        this._connectionVerified = true;
      }
      // set connectionId and unit for all devices belonging to AWS connection
      deviceListFromIModel.forEach((device) => {
        if (things !== undefined) {
          if (things.find((d) => d.thingName === device.iotId)) {
            device.connectionId = connection.id.toString();
            device.unit = things.find((d) => d.thingName === device.iotId)?.attributes.Unit ?? "";
          }
        }
      });

      ITwinViewerApp.store.dispatch({
        type: DeviceActionId.setDeviceList,
        payload: deviceListFromIModel,
      });
    } catch (error) {
    }
  }

  public validateConnectionURL() {
    if (this._connectionUrl === "") {
      return false;
    }
    return true;
  }

  public subscribe = (name: string, next: any, error: any) => {
    return (API.graphql(graphqlOperation(this._subscribeDoc, { name })) as any).subscribe({
      next: ({ provider, value }: any) => {
        next(value.data.subscribe, provider, value);
      },
      error: error || console.log,
    });
  };

  public async listen() {
    this._isListening = true;
    // execute the GraphQL subscribe operation to receive real-time data from AWS IoT Core
    subscriptions.push(this.subscribe(process.env.IMJS_AWS_IOT_MQTT_TOPIC ?? "", ({ data }: any) => {
      const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
      if (callBacks.size === 0) {
        this.stopMonitoring();
      } else {
        for (const value of callBacks.values()) {
          value(data);
        }
      }
    }, ""));
  }

  public connectionListening(): boolean {
    return this._isListening;
  }

  public stopMonitoring() {
    this._isListening = false;
    // when no consumer requesting data from AWS devices, unsubscribe to GraphQL mutation
    subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
