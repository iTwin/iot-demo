
/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { displayToaster, getConfiguration } from "../Utils";

interface Reading {
  IoTId: string;
  Reading: string;
}

export class IoTLink {
  private static time: number = 1;
  private static latestReadings: Reading[];

  public static fetchReading = async () => {
    IoTLink.latestReadings = await IoTLink.fetchData();
    IoTLink.time = (IoTLink.time === 30) ? 1 : ++IoTLink.time;
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
        const response = await fetch(`${hostUrl}/iot_sim_${IoTLink.time}.json`);
        readings = await response.json();
      } catch (error) {
        displayToaster("Invalid Connection URL Please check connection URLs!!!");
      }
    }

    return readings;
  };
}
