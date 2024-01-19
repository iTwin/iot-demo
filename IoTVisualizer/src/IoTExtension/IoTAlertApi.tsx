import { Point3d, WritableLowAndHighXYZ, WritableXYAndZ } from "@itwin/core-geometry";
import { IModelApp, ViewChangeOptions } from "@itwin/core-frontend";

export class IoTAlertApi {
  public static zoomToElements = async (elementId: string, location: Point3d) => {
    // Testing deployment
    const vp = IModelApp.viewManager.selectedView;
    if (vp && elementId) {
      const viewChangeOpts: ViewChangeOptions = {};
      viewChangeOpts.animateFrustumChange = true;
      const zoomFactor = 1.5;
      const highPoint: WritableXYAndZ = { x: location.x - zoomFactor, y: location.y + zoomFactor, z: location.z - zoomFactor };
      const lowPoint: WritableXYAndZ = { x: location.x + zoomFactor, y: location.y - zoomFactor, z: location.z + zoomFactor };
      const point: WritableLowAndHighXYZ = { high: lowPoint, low: highPoint };
      vp.zoomToVolume(point, { ...viewChangeOpts });
      vp?.iModel.selectionSet.replace(elementId);
    }
  };
}
