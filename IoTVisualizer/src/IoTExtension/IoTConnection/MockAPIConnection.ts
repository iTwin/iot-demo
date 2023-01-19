/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { DeviceActionId } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { IoTLink } from "../clients/IoTLink";
import { SmartDevice } from "../SmartDevice";
import { IoTConnection } from "./IotConnection";
import mockData from "./MockConnection.json";

export class MockAPIConnection extends IoTConnection {
  private _timer: NodeJS.Timeout[] = [];
  constructor(connectionUrl: string) {
    super(connectionUrl);
    if (connectionUrl) {
      this._connection = this._connectionUrl;
    } else {
      console.log(`Mock API connection couldn't be established.`);
    }
  }

  public populateDevices(deviceListFromIModel: SmartDevice[], connection: {
    id: number;
    type: string;
    name: string;
    connectionUrl1: string;
    connectionUrl2: string;
  }) {

    deviceListFromIModel.forEach((device) => {
      if (mockData !== undefined && mockData.find((d) => d.deviceId.toString() === device.iotId.toString()) !== undefined) {
        device.connectionId = connection.id.toString();
        device.unit = mockData.find((d) => d.deviceId.toString() === device.iotId.toString())?.unit ?? "";
      }
    });
    this._connectionVerified = true;
    ITwinViewerApp.store.dispatch({
      type: DeviceActionId.setDeviceList,
      payload: deviceListFromIModel,
    });

  }

  public async validateConnectionURL() {
    try {
      if (this._connectionUrl === "") {
        return false;
      }
      const response = await fetch(`${this._connectionUrl}/iot_sim_1.json`).catch((error) => {
        console.log(error);
      });
      if (response && response.status === 200 && await response.json() !== undefined && this._connectionVerified) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public listen() {
    this._isListening = true;
    const timer = setInterval(async () => {
      const reading = await IoTLink.fetchReading();
      const callBacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
      if (reading !== undefined) {
        reading.forEach((read) => {
          const readingData = { deviceId: read.IoTId, data: read.Reading.split(" ")[0], unit: read.Reading.split(" ")[1], timeStamp: new Date().toString() };
          if (callBacks.size === 0) {
            this.stopMonitoring();
          } else {
            for (const value of callBacks.values()) {
              value(JSON.stringify(readingData));
            }
          }
        });
      } else {
        if (callBacks.size === 0) {
          this.stopMonitoring();
        } else {
          for (const value of callBacks.values()) {
            value("no data");
          }
        }
      }
    }, 1000);

    this._timer?.push(timer);
  }

  public connectionListening(): boolean {
    return this._isListening;
  }

  public stopMonitoring() {

    if (this._timer?.length !== 0) {
      this._timer?.forEach((timer) => {
        clearInterval(timer);
      });
    }
    this._isListening = false;
  }
}
