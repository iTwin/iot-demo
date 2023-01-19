/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { XAndY } from "@itwin/core-geometry";
import { BeButtonEvent, DecorateContext, Decorator, imageElementFromUrl, Marker } from "@itwin/core-frontend";
import { SmartDevice as DeviceProps, SmartDevice } from "../SmartDevice";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { DeviceMonitorUI } from "../DeviceMonitorUI";
import { getConnection, getDeviceDataFromTelemetry, getDevicesLevelWise, removeConsumerCallback, resetDeviceStatus, setDeviceStatusToActive } from "../Utils";
import { v4 as uuidv4 } from "uuid";

export class SmartDeviceDecorator implements Decorator {
  private _markerSet: Marker[];
  private _zmin: number | undefined;
  private _zmax: number | undefined;

  constructor(zmin?: number, zmax?: number) {
    this._markerSet = [];
    this._zmin = zmin;
    this._zmax = zmax;

    this.addMarkers().catch((error) => {
      console.error(error);
    });
  }

  private async addMarkers() {
    const values = await getDevicesLevelWise(this._zmin, this._zmax);
    const image = await imageElementFromUrl("sensor.png");
    values.forEach((device: SmartDevice) => {
      const smartDeviceMarker = new SmartDeviceMarker(
        device,
        { x: 50, y: 50 },
        image,
      );
      this._markerSet.push(smartDeviceMarker);
    });
  }

  public decorate(context: DecorateContext): void {
    this._markerSet.forEach((marker) => {
      marker.addDecoration(context);
    });
  }
}

class SmartDeviceMarker extends Marker {
  private _deviceProps: SmartDevice;
  private _isFeatured: boolean;
  private _callBackId: string;
  constructor(device: DeviceProps, size: XAndY, image: HTMLImageElement) {
    const location = { x: device.origin.x, y: device.origin.y, z: device.origin.z };
    super(location, size);

    this._deviceProps = device;
    this._isFeatured = false;
    this.image = image;
    this.imageSize = { x: 20, y: 20 };
    this._callBackId = uuidv4();
  }

  public drawFunc(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = this._isFeatured ? "lightblue" : "lightcyan";
    ctx.lineWidth = this._isFeatured ? 3 : 2;
    ctx.arc(0, 0, this._isFeatured ? 15 : 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  public onMouseEnter(ev: BeButtonEvent) {
    super.onMouseEnter(ev);
    this._isFeatured = true;
    const deviceListForListen: SmartDevice[] = [];
    deviceListForListen.push(this._deviceProps);
    if (getConnection(this._deviceProps)?.get()) {
      setDeviceStatusToActive(this._deviceProps);
    } else {
      DeviceMonitorUI.createToolTip(this._deviceProps, "no data", ev.viewPoint, "");
    }
    IoTConnectionManager.monitor((msg: any) => {
      const data = getDeviceDataFromTelemetry(msg, deviceListForListen);
      if (data.length !== 0) {
        DeviceMonitorUI.createToolTip(this._deviceProps, data[0].value, ev.viewPoint, data[0].unit);
      }
    }, this._deviceProps, this._callBackId);
    DeviceMonitorUI.createToolTip(this._deviceProps, "no data", ev.viewPoint, "");
  }

  public onMouseLeave() {
    super.onMouseLeave();
    this._isFeatured = false;
    resetDeviceStatus(this._deviceProps);
    removeConsumerCallback(this._callBackId);

  }
}

