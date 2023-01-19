/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { HubConnectionBuilder } from "@microsoft/signalr";

export class SignalR {
  public static _url = process.env.IMJS_IOT_CONNECTION_URL;
  public static _connection = new HubConnectionBuilder()
    .withUrl(SignalR._url!)
    .withAutomaticReconnect()
    .build();
}
