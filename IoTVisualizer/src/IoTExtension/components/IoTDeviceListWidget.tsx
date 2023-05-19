/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState } from "react";
import { IModelApp, IModelConnection, ViewState3d } from "@itwin/core-frontend";
import { ClipPlane, ClipPrimitive, ClipVector, ConvexClipPlaneSet, Plane3dByOriginAndUnitNormal, Point3d, Vector3d } from "@itwin/core-geometry";
import { Story } from "../clients/ITwinLink";
import { SensorList } from "./SensorList";
import { Label, NonIdealState, ProgressRadial, Select, ToggleSwitch } from "@itwin/itwinui-react";
import { IoTConnectionListComponent } from "./IoTConnectionListComponent";
import { getConfiguration, getConnection, getLevelList } from "../Utils";
import { useSelector } from "react-redux";
import { DeviceActionId, RootState } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { ActivityStatus } from "../SmartDevice";
import { IoTConnection } from "../IoTConnection/IotConnection";
import { DeviceMonitorUI } from "../DeviceMonitorUI";
import { SvgError } from "@itwin/itwinui-illustrations-react";

export interface DeviceListWidgetProps {
  imodel?: IModelConnection;
  currentLevel?: Number;  // If not supplied, the levelChanged callback will trigger with the default level
  levelChanged(currentLevel?: Story): void;
}

export const IoTDeviceListWidget: React.FC<DeviceListWidgetProps> = (props: DeviceListWidgetProps) => {
  const [levelListState, setLevelList] = useState<Array<Story>>([]);
  const [selectedLevel, setSelectedLevel] = useState<Story>();
  const [showMakers, setShowMarkers] = useState<boolean>(true);
  const [connectionChanged, setConnectionChanged] = useState<boolean>(true);
  const [readyConnections, setReadyConnections] = useState<number>(0);
  const [failedConnections, setFailedConnections] = useState<number[]>([]);

  const changeDeviceStatus = useSelector<RootState, boolean | undefined>(
    (state) => state?.deviceState?.changeDeviceStatus,
  );

  const levelSelected = useCallback((level: Story) => {
    changeViewForModel(level).catch((error) => {
      console.error(error);
    });
    props.levelChanged(level);
    setSelectedLevel(level);
  }, [props]);

  const listFailedConnections = useCallback((connectionId: number) => {
    const failedConnectionArray = failedConnections.slice();
    if (!failedConnectionArray.includes(connectionId)) {
      failedConnectionArray.push(connectionId);
      setFailedConnections(failedConnectionArray);
    }
  }, [failedConnections]);

  useEffect(() => {
    const populateLevelList = async (_imodel: IModelConnection) => {
      const levelList: Story[] = await getLevelList();
      if (levelList.length) {
        setLevelList(levelList);
        levelSelected(levelList[0]);
      } else {
        // If level is undefined then add markers for all devices
        props.levelChanged();
        const vp = IModelApp.viewManager.selectedView;
        if (vp) {
          const categoryIds = await getCategoriesToTurnOff(vp.iModel);
          vp?.changeCategoryDisplay(categoryIds, false);
        }
      }
    };

    populateLevelList(props.imodel!).catch((error) => {
      console.error(error);
    });
  }, [levelSelected, props]);

  useEffect(() => {
    DeviceMonitorUI.onPopulateDeviceComplete.addListener(() => setReadyConnections(readyConnections + 1));
    return () => {
      DeviceMonitorUI.onPopulateDeviceComplete.removeListener(() => setReadyConnections(readyConnections + 1));
    };
  });

  useEffect(() => {
    DeviceMonitorUI.onPopulateDeviceError.addListener((connectionId: number) => listFailedConnections(connectionId));
    return () => {
      DeviceMonitorUI.onPopulateDeviceError.removeListener((connectionId: number) => listFailedConnections(connectionId));
    };
  });

  const onLevelChange = (value: Number) => {
    const level = levelListState.find((val: Story) => val.levelNumber === value);

    if (level) {
      levelSelected(level);
      onShowMarkersToggle(showMakers);
      const customEvent = new CustomEvent("LevelChanged", { detail: level });
      document.dispatchEvent(customEvent);
    }
  };

  const handleConnectionChanged = (connection: IoTConnection) => {
    const _deviceListFromIModel = ITwinViewerApp.store.getState().deviceState.deviceList;
    _deviceListFromIModel.forEach((device) => {
      if (getConnection(device)?.get()) {
        if (device.noOfConsumers > 0) {
          device.isActive = ActivityStatus.Active;
        } else {
          device.isActive = ActivityStatus.Connected;
        }

      } else {
        device.isActive = ActivityStatus.Disconnected;
      }

    });
    ITwinViewerApp.store.dispatch({
      type: DeviceActionId.setDeviceList,
      payload: _deviceListFromIModel,
    });
    setConnectionChanged(!connectionChanged);
    const customEvent = new CustomEvent("ConnectionChanged", { detail: connection });
    document.dispatchEvent(customEvent);
  };

  const onShowMarkersToggle = React.useCallback((checked: boolean) => {
    if (!checked) {
      // Send props a "fake" level where the top is below the bottom
      const fakeLevel: Story = { name: "", description: "", levelNumber: -1, bottomElevation: 99, topElevation: -99 };
      props.levelChanged(fakeLevel);
    }

    if (checked && !showMakers && selectedLevel)
      props.levelChanged(selectedLevel);

    setShowMarkers(checked);
  }, [showMakers, selectedLevel, props]);

  const array = Array.from(levelListState, (l) => {
    return { value: l.levelNumber, label: l.name };
  });

  return (<>

    {(failedConnections && readyConnections + failedConnections.length === getConfiguration().Connections.length) ? readyConnections !== 0 ?
      <div style={{ margin: "8px" }}>
        <div style={{ margin: "5px 0px" }}>
          <IoTConnectionListComponent handleConnectionChanged={handleConnectionChanged} failedConnections={failedConnections} />
        </div>
        <br />
        <div style={{ margin: "5px 0px" }}>
          {selectedLevel ?
            <Select value={selectedLevel?.levelNumber} options={array} onChange={(value: any) => onLevelChange(value)}></Select>
            : <></>
          }
          <br />
          <ToggleSwitch labelPosition="right" defaultChecked={showMakers} onChange={(e) => onShowMarkersToggle(e.target.checked)} label={"Show devices"} />
          <br />
          <SensorList selectedLevel={selectedLevel} deviceStatusChanged={changeDeviceStatus} />
          {/* <Button styleType="cta" onClick={toggleSimulationStatus}>{simulationText}</Button> */}
        </div>
        <br />
      </div> :
      < div > <NonIdealState heading="Error" description="Something went wrong! Please check the connection urls." svg={<SvgError />} /></div > :
      <div style={{ textAlign: "center", marginTop: "20vh" }}>
        <ProgressRadial indeterminate style={{ alignContent: "center" }} />
        <Label>Loading Device List</Label>
      </div>
    }</>);
};

const changeViewForModel = async (level: Story) => {
  const vp = IModelApp.viewManager.selectedView!;
  if (!vp)
    return;

  const imodel = vp.iModel;
  const viewState = vp.view;

  const planeSet = ConvexClipPlaneSet.createEmpty();
  createPlane(planeSet, level.bottomElevation, false);
  createPlane(planeSet, level.topElevation, true);

  const prim = ClipPrimitive.createCapture(planeSet);
  const clip = ClipVector.createEmpty();
  clip.appendReference(prim);
  viewState.viewFlags = viewState.viewFlags.with("clipVolume", true);
  viewState.setViewClip(clip);

  viewState.viewFlags = viewState.viewFlags.with("backgroundMap", true);

  const displayStyle = (viewState as ViewState3d).getDisplayStyle3d();
  displayStyle.environment = displayStyle.environment.withDisplay({ sky: true });

  // Wait for all the asynchronous stuff before we start changing the viewport.
  // Otherwise we might see some of the changes before they are all applied.
  const categoryIds = await getCategoriesToTurnOff(imodel);

  vp.applyViewState(viewState);
  vp.changeCategoryDisplay(categoryIds, false);

  // Need a way to re-render the scene
  vp.invalidateDecorations();
  requestAnimationFrame(() => { });
};

const createPlane = (planeSet: ConvexClipPlaneSet, z: number, top: boolean) => {
  const topPlaneOffset = -1.0;
  const botPlaneOffset = -1.0;
  const normal = Vector3d.create(0, 0, top ? -1.0 : 1.0);
  const origin = Point3d.create(0, 0, top ? z + topPlaneOffset : z + botPlaneOffset);

  const plane = Plane3dByOriginAndUnitNormal.create(origin, normal);
  if (undefined === plane)
    return;

  planeSet.addPlaneToConvexSet(ClipPlane.createPlane(plane));
};

const getCategoriesToTurnOff = async (imodel: IModelConnection) => {
  const categoryNames = ["FILL_Mesh", "SM_Mesh", "CL_Mesh", "SP-SM_Mesh", "GP_Mesh",
    "S-PILE-CONC", "li_building_footprints", "e_terrain_exterior", "completestreets",
    "A-SITE", "A-SITE-EARTH", "a-flor-otln", "neighborhoods_philadelphia",
    "GP", "boreholes_interpretation", "boreholes_interpretation_decoration", "boreholes",
    "Boreholes_Interpretation_Decoration", "CL", "IoTDeviceSpatialCategory",
    "A-Reserved Retail Area", "A-Reserved Retail Area",
    "SM", "boreholes_decoration", "SP-SM", "FILL"];

  let query = `SELECT ECInstanceId, UserLabel FROM bis.category WHERE`;
  categoryNames.forEach((catName, index) => {
    if (0 !== index)
      query += ` or`;
    query += ` codeValue = '${catName}'`;
  });

  const rows = [];
  for await (const row of imodel.query(query))
    rows.push(row);

  return rows.map((row) => {
    return row[0];
  });
};
