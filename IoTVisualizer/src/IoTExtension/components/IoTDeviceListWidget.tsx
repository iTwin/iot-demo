/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState } from "react";
import { IModelApp, IModelConnection, ViewState3d } from "@itwin/core-frontend";
import { ClipPlane, ClipPrimitive, ClipVector, ConvexClipPlaneSet, Plane3dByOriginAndUnitNormal, Point3d, Vector3d } from "@itwin/core-geometry";
import { Story } from "../clients/ITwinLink";
import { SensorList } from "./SensorList";
import { Select, ToggleSwitch } from "@itwin/itwinui-react";
import { IoTConnectionListComponent } from "./IoTConnectionListComponent";
import { getConnection, getLevelList } from "../Utils";
import { useSelector } from "react-redux";
import { DeviceActionId, RootState } from "../app/AppState";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { ActivityStatus } from "../SmartDevice";
import { IoTConnection } from "../IoTConnection/IotConnection";

export interface DeviceListWidgetProps {
  imodel?: IModelConnection;
  currentLevel?: Number;  // If not supplied, the onLevelChanged callback will trigger with the default level
  onLevelChanged(currentLevel?: Story): void;
}

export const IoTDeviceListWidget: React.FC<DeviceListWidgetProps> = (props: DeviceListWidgetProps) => {
  const [levelListState, setLevelList] = useState<Array<Story>>([]);
  const [selectedLevel, setSelectedLevel] = useState<Story>();
  const [isMarkerShown, setIsMarkerShown] = useState<boolean>(true);
  const [isConnectionChanged, setIsConnectionChanged] = useState<boolean>(true);

  const isDeviceStatusChanged = useSelector<RootState, boolean | undefined>(
    (state) => state?.deviceState?.isDeviceStatusChanged,
  );

  const levelSelected = useCallback((level: Story) => {
    changeViewForModel(level).catch((error) => {
      console.error(error);
    });
    props.onLevelChanged(level);
    setSelectedLevel(level);
  }, [props]);

  useEffect(() => {
    const populateLevelList = async (_imodel: IModelConnection) => {
      const levelList: Story[] = await getLevelList();
      if (levelList.length) {
        setLevelList(levelList);
        levelSelected(levelList[0]);
      } else {
        // If level is undefined then add markers for all devices
        props.onLevelChanged();
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

  const handleLevelChanged = (value: Number) => {
    const level = levelListState.find((val: Story) => val.levelNumber === value);

    if (level) {
      levelSelected(level);
      handleShowMarkers(isMarkerShown);
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
    setIsConnectionChanged(!isConnectionChanged);
    const customEvent = new CustomEvent("ConnectionChanged", { detail: connection });
    document.dispatchEvent(customEvent);
  };

  const handleShowMarkers = React.useCallback((checked: boolean) => {
    if (!checked) {
      // Send props a "fake" level where the top is below the bottom
      const fakeLevel: Story = { name: "", description: "", levelNumber: -1, bottomElevation: 99, topElevation: -99 };
      props.onLevelChanged(fakeLevel);
    }

    if (checked && !isMarkerShown && selectedLevel)
      props.onLevelChanged(selectedLevel);

    setIsMarkerShown(checked);
  }, [isMarkerShown, selectedLevel, props]);

  const array = Array.from(levelListState, (l) => {
    return { value: l.levelNumber, label: l.name };
  });

  return (<><div style={{ margin: "8px" }}>
    <div style={{ margin: "5px 0px" }}>
      <IoTConnectionListComponent onConnectionChanged={handleConnectionChanged} />
    </div>
    <br />
    <div style={{ margin: "5px 0px" }}>
      {selectedLevel ?
        <Select value={selectedLevel?.levelNumber} options={array} onChange={(value: any) => handleLevelChanged(value)}></Select>
        : <></>
      }
      <br />
      <ToggleSwitch labelPosition="right" defaultChecked={isMarkerShown} onChange={(e) => handleShowMarkers(e.target.checked)} label={"Show devices"} />
      <br />
      <SensorList selectedLevel={selectedLevel} isDeviceStatusChanged={isDeviceStatusChanged} />
      {/* <Button styleType="cta" onClick={toggleSimulationStatus}>{simulationText}</Button> */}
    </div>
    <br />
  </div> </>);
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
