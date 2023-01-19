/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelApp, MessageBoxIconType, MessageBoxType } from "@itwin/core-frontend";
import { HubConnectionState } from "@microsoft/signalr";
import { checkNamedVersionCreated } from "./App";
import { IoTConnectionManager } from "./IoTExtension/IoTConnection/IoTConnectionManager";

export class ITwinNotification {
  public static fetchNewNamedVersion() {
    const signalRConnection =
      IoTConnectionManager.getConnection("AZURE_IOT_HUB").get();
    if (!signalRConnection) {
      return;
    }
    signalRConnection.on("newNamedVersion", (data: any) => {
      const content = JSON.parse(data);

      const msg = `New named version (ID: ${content.versionId}, Name: ${content.versionName}) was created for iModel (ID: ${content.imodelId}).\
      Do you want to Reload the iModel ? `;

      const result = IModelApp.notifications.openMessageBox(
        MessageBoxType.YesNo,
        msg,
        MessageBoxIconType.Question
      );

      if (result != null) {
        void checkNamedVersionCreated(result);
      }
    });
    if (signalRConnection.state === HubConnectionState.Disconnected)
      void signalRConnection.start().then(() => console.log("Connected..."));
  }
}
