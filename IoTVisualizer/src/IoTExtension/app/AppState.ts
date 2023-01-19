/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { combineReducers, createStore, Store } from "redux";
import { ActionsUnion, createAction, DeepReadonly, FrameworkReducer, FrameworkState } from "@itwin/appui-react";
import { SmartDevice } from "../SmartDevice";
import { callbackType } from "../IoTConnection/IoTConnectionManager";

export interface ConsumerState {
  consumerCallbacks: Map<string, callbackType>;
}
export interface DeviceState {
  deviceList: SmartDevice[];
  changeDeviceStatus: boolean;
  phenomenonList: string[];
}

const initialConsumerState: ConsumerState = {
  consumerCallbacks: new Map<string, callbackType>(),
};

const initialDeviceState: DeviceState = {
  deviceList: [],
  changeDeviceStatus: false,
  phenomenonList: [],

};
export enum ConsumerActionId {
  setConsumerCallback = "SET_CONSUMER_CALLBACK",
}

export enum DeviceActionId {
  setDeviceList = "SET_DEVICE_LIST",
  setChangeDeviceStatus = "SET_DEVICE_STATUS",
  setPhenomenonList = "SET_PHENOMENON_ARRAY",
}

export const ConsumerActions = {
  setConsumerCallback: (consumerMap: Map<string, callbackType>) =>
    createAction(ConsumerActionId.setConsumerCallback, consumerMap),
};

export const DeviceActions = {
  setDeviceList: (deviceList: []) =>
    createAction(DeviceActionId.setDeviceList, deviceList),
  setChangeDeviceStatus: (changeDeviceStatus: boolean) =>
    createAction(DeviceActionId.setChangeDeviceStatus, changeDeviceStatus),
  setPhenomenonList: (phenomenonList: string[]) =>
    createAction(DeviceActionId.setPhenomenonList, phenomenonList),

};

export type ConsumerActionsUnion = ActionsUnion<typeof ConsumerActions>;
export type DeviceActionsUnion = ActionsUnion<typeof DeviceActions>;

export function consumerReducer(
  state: ConsumerState = initialConsumerState,
  action: ConsumerActionsUnion,
): DeepReadonly<ConsumerState> {
  switch (action.type) {
    case ConsumerActionId.setConsumerCallback:
      return {
        ...state,
        consumerCallbacks: action.payload,
      };
    default:
      return { ...state };
  }
}

export function deviceReducer(
  state: DeviceState = initialDeviceState,
  action: DeviceActionsUnion,
): DeepReadonly<DeviceState> {
  switch (action.type) {
    case DeviceActionId.setDeviceList:
      return {
        ...state,
        deviceList: action.payload,
      };
    case DeviceActionId.setChangeDeviceStatus:
      return {
        ...state,
        changeDeviceStatus: action.payload,
      };
    case DeviceActionId.setPhenomenonList:
      return {
        ...state,
        phenomenonList: action.payload,
      };
    default:
      return { ...state };
  }
}

// React-redux interface stuff
export interface RootState {
  frameworkState?: FrameworkState;
  deviceState: DeviceState;
  consumerState: ConsumerState;
}

export type AppStore = Store<RootState>;
/**
 * Centralized state management class using  Redux actions, reducers and store.
 */
export class AppState {
  private _store: AppStore;
  private _rootReducer: any;

  constructor() {
    // this is the rootReducer for the application.
    this._rootReducer = combineReducers<RootState>({
      frameworkState: FrameworkReducer,
      deviceState: deviceReducer,
      consumerState: consumerReducer,
    } as any);

    // create the Redux Store.
    this._store = createStore(
      this._rootReducer,
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__(),
    );
  }

  public get store(): Store<RootState> {
    return this._store;
  }
}
