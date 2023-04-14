
/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { displayToaster } from "../../App";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { getConfiguration } from "../Utils";

export class IoTLink {
  private static time: number = 1;
  private static latestReadings: { [key: string]: any };

  public static fetchReading = async () => {
    IoTLink.latestReadings = await IoTLink.fetchData();
    IoTLink.time = (IoTLink.time === 441) ? 0 : ++IoTLink.time;
    return IoTLink.latestReadings;
  };

  private static fetchData = async () => {
    let hostUrl;
    const connections = getConfiguration().Connections;
    const mockConnId = connections.find((conn: any) => conn.type === "MOCK_API_CONNECTION")?.id.toString();
    const connection = IoTConnectionManager.getConnection(mockConnId ?? "");
    if (connection) {
      hostUrl = connection.get();
    }
    let readings;
    if (hostUrl) {
      try {
        const response = await fetch(`${hostUrl}/SensorData.json`);
        readings = await response.json();
      } catch (error) {
        displayToaster("Invalid Connection URL Please check connection URLs!!!");
      }
    }

    return readings[IoTLink.time];
  };
}
