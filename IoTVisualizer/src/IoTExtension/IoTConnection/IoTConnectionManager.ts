/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { DeviceActionId } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { ITwinLink } from "../clients/ITwinLink";
import { ActivityStatus, SmartDevice } from "../SmartDevice";
import { addConsumerCallback, getConfiguration, getConnection } from "../Utils";
import { AwsConnection } from "./AwsConnection";
import { AzureConnection } from "./AzureConnection";
import { IoTConnection } from "./IotConnection";
import { MockAPIConnection } from "./MockAPIConnection";

export type callbackType = (msg: any) => void;

export class IoTConnectionManager {
  private static _connectionList: Map<string, IoTConnection> | undefined;
  private static _deviceListFromIModel: SmartDevice[];

  public static getConnection(connectionId: string): IoTConnection {
    let connection: IoTConnection | undefined;
    if (this._connectionList && this._connectionList.has(connectionId)) {
      connection = this._connectionList.get(connectionId);
    }
    return connection!;
  }

  public static getConnectionList(): Map<string, IoTConnection> | undefined {
    return this._connectionList;
  }

  public static async _setDeviceList() {
    this._deviceListFromIModel = await ITwinLink.fetchDevices();
    this._deviceListFromIModel.forEach((device) => {
      device.isActive = ActivityStatus.Disconnected;
      device.noOfConsumers = 0;
    });
    ITwinViewerApp.store.dispatch({
      type: DeviceActionId.setDeviceList,
      payload: this._deviceListFromIModel,
    });

    const phenomenonArray: string[] = [];
    this._deviceListFromIModel.forEach((device) => {
      if (phenomenonArray.find((p) => p === device.phenomenon) === undefined) {
        phenomenonArray.push(device.phenomenon);
      }
    });
    ITwinViewerApp.store.dispatch({
      type: DeviceActionId.setPhenomenonList,
      payload: phenomenonArray,
    });
  }

  public static createConnection = async () => { // Initialize all IoT connections
    const connections = getConfiguration().Connections;
    if (!connections) {
      console.log(`No IoT connections found.`);
      return;
    }
    IoTConnectionManager._connectionList = new Map<string, IoTConnection>();
    await IoTConnectionManager._setDeviceList();
    connections.map(async (connection: any) => {
      if (connection.type === "AZURE_IOT_HUB") {

        const azureConnection = new AzureConnection(connection.connectionUrl1);
        IoTConnectionManager._connectionList?.set(connection.id.toString(), azureConnection);
        await azureConnection.populateDevices(IoTConnectionManager._deviceListFromIModel, connection);

      } else if (connection.type === "MOCK_API_CONNECTION") {
        const mockConnection = new MockAPIConnection(connection.connectionUrl1);
        IoTConnectionManager._connectionList?.set(connection.id.toString(), mockConnection);
        mockConnection.populateDevices(IoTConnectionManager._deviceListFromIModel, connection);

      } else if (connection.type === "AWS") {
        const awsConnection = new AwsConnection(connection.connectionUrl1);
        IoTConnectionManager._connectionList?.set(connection.id.toString(), awsConnection);
        await awsConnection.populateDevices(IoTConnectionManager._deviceListFromIModel, connection);

      } else {
        console.log(`No IoT connections created.`);
      }
    });
  };

  public static connectionChangedNotification(connection: IoTConnection) { // when connection checkboxes are switched on/off after starting consumers, notify the listen method
    if (connection && connection.get() && !connection.connectionListening()) {
      connection.listen();
    }
  }

  public static monitor(callback: callbackType, ...params: any) { // accept real-time data request from all consumers and call the listen method once if not started.
    if (params.length === 0) {
      return;
    }
    const devices = params[0];
    addConsumerCallback(params[1], callback); // store consumer callbacks in redux store
    const connectionList: (IoTConnection | undefined)[] = [];
    // check which connection the devices belong to, so that the appropriate listen method can be called
    if (!Array.isArray(devices)) {
      connectionList.push(getConnection(devices));
    } else {
      devices.forEach((device: SmartDevice) => {
        if (connectionList.find((c) => c === getConnection(device)) === undefined) {
          connectionList.push(getConnection(device));
        }
      });
    }
    connectionList?.forEach((connection) => {
      if (connection && connection.get() && !connection.connectionListening()) {
        connection.listen();
      }
    });
  }
}
