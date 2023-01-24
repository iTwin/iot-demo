/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { IModelApp, ViewChangeOptions } from "@itwin/core-frontend";
import { Point3d, WritableLowAndHighXYZ, WritableXYAndZ } from "@itwin/core-geometry";
import { CommonProps } from "@itwin/core-react";
import React, { useEffect, useState } from "react";
import { Story } from "../clients/ITwinLink";
import { ActivityStatus, SmartDevice } from "../SmartDevice";
import "../styles/sensorlist.scss";
import { getDevicesLevelWise } from "../Utils";

interface SensorListProps extends CommonProps {
  selectedLevel?: Story;
  isDeviceStatusChanged?: boolean | undefined;
}

export const SensorList: React.FC<SensorListProps> = (props: SensorListProps) => {
  const [markers, setMarkers] = useState<Array<any>>([]);
  useEffect(() => {
    const getMarkers = async () => {
      const markersList = await getDevicesLevelWise(props.selectedLevel?.bottomElevation, props.selectedLevel?.topElevation);
      setMarkers(markersList);
    };
    getMarkers().catch((error) => {
      console.error(error);
    });
  }, [props]);

  const zoomToSensor = (id: string, location: Point3d) => {
    const vp = IModelApp.viewManager.selectedView;
    if (vp && id) {
      const viewChangeOpts: ViewChangeOptions = {};
      viewChangeOpts.animateFrustumChange = true;
      const zoomFactor = 1.5;
      const highPoint: WritableXYAndZ = { x: location.x - zoomFactor, y: location.y + zoomFactor, z: location.z - zoomFactor };
      const lowPoint: WritableXYAndZ = { x: location.x + zoomFactor, y: location.y - zoomFactor, z: location.z + zoomFactor };
      const point: WritableLowAndHighXYZ = { high: lowPoint, low: highPoint };
      vp.zoomToVolume(point, { ...viewChangeOpts });
      vp?.iModel.selectionSet.replace(id);
    }
  };

  return (<table><tbody>
    <tr><th>Device</th><th>Type</th><th>Status</th></tr>
    {
      markers.map((m: SmartDevice) => {
        return (<tr key={m.id} onClick={() => {
          zoomToSensor(m.id, m.origin);
        }}>
          <td>{m.label}</td>
          <td>{m.type}</td>
          <td>{ActivityStatus[m.isActive]}</td>
        </tr>);

      })
    }
  </tbody></table>);
};
