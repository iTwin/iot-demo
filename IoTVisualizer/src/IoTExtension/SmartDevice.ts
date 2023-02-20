/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Point3d } from "@itwin/core-geometry";
export interface SmartDevice {
  id: string;
  label: string;
  origin: Point3d;
  type: string;
  iotId: string;
  phenomenon: string;
  unit: string;
  observedElement: string;
  isActive: ActivityStatus;
  connectionId: string;
  noOfConsumers: number;
  isChecked: boolean;
}
export enum ActivityStatus {
  "Connected",
  "Disconnected",
  "Active"
}

export enum Roles {
  "Admin",
  "User",
  "Unauthorized"
}
