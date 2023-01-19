/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export abstract class IoTConnection {
  protected _connectionUrl: string;
  protected _connection: any;
  protected _isActive: boolean;
  protected _isListening: boolean;
  protected _connectionVerified: boolean;

  constructor(connectionUrl: string) {
    this._connectionUrl = connectionUrl;
    this._isActive = false;
    this._isListening = false;
    this._connectionVerified = false;
  }

  public setActive(isActive: boolean) {
    this._isActive = isActive;
    if (!isActive) {
      this.stopMonitoring();
    }
  }

  public get(): any {
    return this._isActive ? this._connection : undefined;
  }

  public abstract listen(): void;
  public abstract stopMonitoring(): void;
  public abstract connectionListening(): boolean;
  public abstract validateConnectionURL(): any;
}

