/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { HubConnectionBuilder, HubConnectionState, IHttpConnectionOptions, LogLevel } from "@microsoft/signalr";
import { DeviceActionId } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { SmartDevice } from "../SmartDevice";
import { IoTConnection } from "./IotConnection";

export class AzureConnection extends IoTConnection {
  constructor(connectionUrl: string, key: string) {
    super(connectionUrl, key);
    if (connectionUrl) {
      try {
        this._connection = new HubConnectionBuilder()
          .withUrl(connectionUrl, {
            headers: {
              "x-functions-key": process.env[key],
            },
          } as IHttpConnectionOptions)
          .withAutomaticReconnect()
          .configureLogging(LogLevel.None)
          .build();
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(`Azure connection couldn't be established.`);
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
      // populateDevices
      // fetch Azure device twins from Azure IoT hub
      const response = await fetch(`${process.env.IMJS_FUNCTION_APP_URL}/get-deviceTwins?connectionStringId=${connection.connectionUrl2}` ?? "", {
        method: "get",
        headers: new Headers({
          "x-functions-key": process.env.IMJS_SIMULATOR_FUNCTION_APP_KEY ?? "",
        }),
      }).catch((error) => console.log(`Request failed: ${error}`));
      let deviceTwins: any[];

      if (response && response.status === 200) {
        deviceTwins = await response?.json();
        this._connectionVerified = true;
      }
      // set connectionId to devices belonging to Azure IoT Hub
      deviceListFromIModel.forEach((device) => {
        if (deviceTwins !== undefined) {
          if (deviceTwins.find((d) => d.deviceId === device.iotId)) {
            device.connectionId = connection.id.toString();
            device.unit = deviceTwins.find((d) => d.deviceId === device.iotId).properties.desired.unit;
          }
        }
      });

      ITwinViewerApp.store.dispatch({
        type: DeviceActionId.setDeviceList,
        payload: deviceListFromIModel,
      });
    } catch (error) {
      // displayToaster("Invalid Function URL Please check connection URLs!!!");
    }
  }

  public async validateConnectionURL() {
    if (this._connectionUrl === "") {
      return false;
    }
    // check whether connection url is valid
    const response = await fetch(`${this._connectionUrl}/negotiate?negotiateVersion=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-functions-key": process.env[this._key] ?? "",
      },
    }).catch((error) => { console.log(error); });
    if (response && response.status === 200 && this._connectionVerified) {
      return true;
    } else {
      return false;
    }
  }

  public listen() {
    const signalRConnection = this.get();
    if (!signalRConnection) { // check for IoT Hub devices
      return;
    }
    this._isListening = true;
    let isConnected = false;

    // receive data from socket connection established with Azure SignalR
    signalRConnection.on("newMessage", async (msg: any) => {
      const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
      if (callBacks.size === 0) {
        this.stopMonitoring();
      } else {
        for (const value of callBacks.values()) {
          value(msg);
        }
      }
    });

    if (signalRConnection.state === HubConnectionState.Disconnected) {
      isConnected = false;
      void signalRConnection.start()
        .then(() => {
          isConnected = true;
          console.log("Connected to Azure IoT Hub");
        });
    }

    if (!isConnected) {
      const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
      if (callBacks.size === 0) {
        this.stopMonitoring();
      } else {
        for (const value of callBacks.values()) {
          value("no data");
        }
      }
    }
  }

  public connectionListening(): boolean {
    return this._isListening;
  }

  public stopMonitoring() {
    // when no consumer requesting data from Azure devices, stop receiving data from socket connection
    if (this._connection)
      this._connection.off("newMessage");
    this._isListening = false;
  }
}
