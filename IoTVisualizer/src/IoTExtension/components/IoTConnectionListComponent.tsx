/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Checkbox, InputGroup } from "@itwin/itwinui-react";
import React from "react";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { Roles } from "../SmartDevice";
import { displayToaster, getConfiguration, getUserRole } from "../Utils";

export const IoTConnectionListComponent = (props: any) => {
  const connections = getConfiguration().Connections;

  const handleChange = async (e: { target: { checked: any } }, connection: any) => {
    const connectionObject = IoTConnectionManager.getConnection(connection.id.toString());
    if (!e.target.checked) {
      if (connectionObject) {
        connectionObject.setActive(false);
        props.onConnectionChanged(connectionObject);
      }

    } else {
      if (getUserRole() === Roles.Unauthorized) {
        displayToaster("Access Denied!!");
        e.target.checked = false;
      } else {
        if (await connectionObject.validateConnectionURL()) {
          if (connectionObject) {
            connectionObject.setActive(true);
            props.onConnectionChanged(connectionObject);
          }
        } else {
          displayToaster("Invalid Connection URL. Please check connection URLs!!");
          e.target.checked = false;
        }
      }
    }
  };

  return (
    <>
      < InputGroup
        label='IoT Connection'
      >
        {connections?.map((connection: any) => {
          return (
            <Checkbox key={connection.id} label={connection.name} defaultChecked={false} onChange={(e: { target: { checked: any } }) => { void handleChange(e, connection); }} />
          );
        })}
      </InputGroup>
    </>
  );

};
