/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Checkbox, InputGroup } from "@itwin/itwinui-react";
import React from "react";
import { displayToaster } from "../../App";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { Roles } from "../SmartDevice";
import { getConfiguration, getUserRole } from "../Utils";

export const IoTConnectionListComponent = (props: any) => {
  const connections = getConfiguration().Connections.filter((item: any) => item.type === "MOCK_API_CONNECTION");
  return (
    <>
      < InputGroup
        label='IoT Connection'
      >
        {connections?.map((connection: any) => {

          return (
            <Checkbox key={connection.id} label={connection.name} defaultChecked={false} onChange={async (e: { target: { checked: any } }) => {
              const connectionObject = IoTConnectionManager.getConnection(connection.id.toString());
              if (!e.target.checked) {
                if (connectionObject) {
                  connectionObject.setActive(false);
                  props.handleConnectionChanged(connectionObject);
                }

              } else {
                if (getUserRole() === Roles.Unauthorized) {
                  displayToaster("Access Denied!!");
                  e.target.checked = false;
                } else {
                  if (await connectionObject.validateConnectionURL()) {
                    if (connectionObject) {
                      connectionObject.setActive(true);
                      props.handleConnectionChanged(connectionObject);
                    }
                  } else {
                    displayToaster("Invalid Connection URL. Please check connection URLs!!");
                    e.target.checked = false;
                  }
                }
              }
            }} />

          );
        })}
      </InputGroup>
    </>
  );

};
