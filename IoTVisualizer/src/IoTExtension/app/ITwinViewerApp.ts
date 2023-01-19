/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { FrameworkReducer, StateManager, UiFramework } from "@itwin/appui-react";

import { AppState, AppStore } from "./AppState";

// this is a singleton - all methods are static and no instances may be created
export class ITwinViewerApp {
  private constructor() { }
  private static _appState: AppState;
  private static _appNamespace = "DevicePainterApp";
  public static get store(): AppStore {
    return this._appState.store;
  }

  public static async startup(): Promise<void> {
    this._appState = new AppState();
    await UiFramework.initialize(this.store);

    // Initialize state manager for extensions to have access to extending the redux store
    // This will setup a singleton store inside the StoreManager class.
    new StateManager({
      frameworkState: FrameworkReducer,
    });
  }
}
