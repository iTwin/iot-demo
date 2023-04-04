/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useState, useMemo } from "react";
import { Modal, LabeledInput, toaster, Button} from "@itwin/itwinui-react";
import { editTwins, getHeaders } from "./AzureUtilities";

export function AddDevice(props) {
    
    const url = useMemo(() => process.env.REACT_APP_FUNCTION_URL, []);
    
    const [deviceData, setDeviceData] = useState({
        deviceId: "",
        deviceName: "",
      });
   
    const handleChange = (event) => {
        event.preventDefault();
        setDeviceData({
            ...deviceData,
            [event.target.name]: event.target.value,
        });
    };

    const onClose = useCallback(() => {   
        setDeviceData("");          
        props.handleClose();
    }, [props]);

    const addDevice = useCallback(async (event) => {
        event.preventDefault();
        const data = { deviceId: deviceData.deviceId, connectionStringId: props.connectionStringId, isDeviceTwin: 'true' }
        const response = await fetch(`${url}/create-device`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).catch(error => console.log("Request failed: " + error));
        if (response && response.status === 200) { 
            const response = await editTwins(deviceData, props.connectionStringId, true )
            if (response.updated) {
                toaster.positive(`Added device : ${deviceData.deviceId}`);
                setDeviceData("");
                props.handleClose(await response.response.json());
            }
        } else {
            const error = await response.text();
            toaster.negative(`${error}`);
        }
    }, [deviceData, props, url]);

    const { deviceId, deviceName} = deviceData;

    return (
        <>
            <Modal
                closeOnExternalClick={false}
                isOpen={props.isOpen}
                onClose={onClose}
                title={'Add Device'}
                >
                <div className="mainBox">
                    <div className="add-device-window">
                        <LabeledInput className="basic" label='Device Id' name='deviceId' value={deviceId} onChange={handleChange} />
                        <LabeledInput className="basic" label='Device Name' name='deviceName' value={deviceName} onChange={handleChange} />
                    </div>
                </div>
                <Button className="buttons" styleType="high-visibility" onClick={addDevice} > Add </Button>
            </Modal >
        </>
    )
}