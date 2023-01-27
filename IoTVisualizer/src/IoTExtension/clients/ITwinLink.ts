/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { IModelConnection, ScreenViewport } from "@itwin/core-frontend";
import { QueryRowFormat } from "@itwin/core-common";
import { SmartDevice } from "../SmartDevice";

export interface Story {
  name: string;
  description: string;
  levelNumber: number;
  bottomElevation: number;
  topElevation: number;
}

export class ITwinLink {
  public static iModel: IModelConnection;
  private static stories: Story[];
  private static devices: SmartDevice[];

  public static initializeLink = (vp: ScreenViewport) => {
    ITwinLink.iModel = vp.iModel;
    ITwinLink.fetchDevices().catch((error) => {
      console.error(error);
    });
  };

  public static fetchDevices = async (zmin?: number, zmax?: number): Promise<SmartDevice[]> => {
    let devices = ITwinLink.devices;

    if (!devices) {
      const query = `
      SELECT physicalDevice.UserLabel as label, physicalDevice.ECInstanceId as id, physicalDevice.Origin as origin, deviceType.UserLabel as type, pointType.phenomenon as phenomenon, datapoint.codeValue as iotId, obsElement.TargetECInstanceId as observedElement 
      FROM IoTDeviceFunctional.MeasurementPointObservesSpatialElement obsElement
       JOIN IoTDeviceFunctional.MeasurementPoint datapoint 
       ON datapoint.ECInstanceId=obsElement.SourceECInstanceId 
       JOIN IoTDeviceFunctional.DeviceInterface interface 
       ON interface.ECInstanceId = datapoint.Parent.Id 
       JOIN Functional.PhysicalElementFulfillsFunction deviceLink 
       ON deviceLink.TargetECInstanceId = interface.ECInstanceId 
       JOIN Bis.SpatialElement physicalDevice 
       ON physicalDevice.ECInstanceId = deviceLink.SourceECInstanceId 
       JOIN IoTDeviceFunctional.DeviceInterfaceType deviceType 
       ON deviceType.ECInstanceId = deviceInterface.TypeDefinition.Id
       JOIN IoTDeviceFunctional.DevicePointType pointType
       ON pointType.ECInstanceId= datapoint.TypeDefinition.Id
            `;

      const results = ITwinLink.iModel.query(query, undefined, { rowFormat: QueryRowFormat.UseJsPropertyNames });
      const values = [];

      for await (const row of results)
        values.push(row);

      devices = values;
      ITwinLink.devices = devices;
    }

    if (zmin && zmax)
      devices = devices.filter((device: any) => device.origin.z > zmin && device.origin.z < zmax);

    return devices;
  };

  public static async getLevels(): Promise<Story[]> {
    if (ITwinLink.stories)
      return ITwinLink.stories;

    const query = `select distinct Round(LEVEL_ELEV, 5) as LEVEL_ELEV, DATUM_TEXT from RevitDynamic.level ORDER BY LEVEL_ELEV`;
    const a = await ITwinLink.executeQuery(query);
    console.log(a);
    const rows: any[] = [];
    let i = 0;
    for await (const row of a)
      rows.push({ name: row.dATUM_TEXT, levelNumber: i++, description: row.dATUM_TEXT, LEVEL_ELEV: row.lEVEL_ELEV });

    ITwinLink.stories = [];
    rows.forEach((row, index, allRows) => {
      let bottomElev: number;
      if (index === allRows.length - 1) {
        bottomElev = Number.MAX_SAFE_INTEGER;
      } else
        bottomElev = allRows[index + 1].LEVEL_ELEV;

      if (index === 0) {
        ITwinLink.stories.push({ name: "B1-PLATFORM", levelNumber: allRows.length + 1, description: "below bottom", bottomElevation: Number.MIN_SAFE_INTEGER, topElevation: row.LEVEL_ELEV - 4.3 });
      }

      ITwinLink.stories.push({ name: row.name, levelNumber: allRows.length - row.levelNumber, description: row.description, bottomElevation: row.LEVEL_ELEV, topElevation: bottomElev });
    });

    return ITwinLink.stories;
  }

  private static executeQuery = async (query: string) => {
    const rows = [];
    try {
      for await (const row of ITwinLink.iModel.query(query, undefined, { rowFormat: QueryRowFormat.UseJsPropertyNames }))
        rows.push(row);
    } catch (error) {
      console.error(error);
    }

    return rows;
  };
}
