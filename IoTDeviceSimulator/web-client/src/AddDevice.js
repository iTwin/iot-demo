/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useState, useMemo } from "react";
import { Modal, LabeledInput,toaster, Button} from "@itwin/itwinui-react";
import { editTwins, getHeaders } from "./AzureUtilities";

export function AddDevice(props) {
    
    const url = useMemo(() => process.env.REACT_APP_FUNCTION_URL, []);
    
    const [deviceInterfaceData, setDeviceInterfaceData] = useState({
        deviceInterfaceId: "",
        deviceInterfaceName: "",
      });
      
   

    // useEffect(() => {
        
    // }, [props]);
   
    const handleChange = (event) => {
        event.preventDefault();
        setDeviceInterfaceData({
            ...deviceInterfaceData,
            [event.target.name]: event.target.value,
        });
    };

    const onClose = useCallback(() => {             
        props.handleClose();
    }, [props]);

    const addDeviceInterface = useCallback(async (event) => {
        event.preventDefault();
        const data = { deviceInterfaceId: deviceInterfaceData.deviceInterfaceId, connectionStringId: props.connectionStringId, isDeviceTwin: 'true' }
        const response = await fetch(`${url}/create-device`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).catch(error => console.log("Request failed: " + error));
        if (response && response.status === 200) { 
            let deviceInterfaceObject = deviceInterfaceData;
            const response = await editTwins(deviceInterfaceObject, props.connectionStringId, true )
            if (response.updated) {
                toaster.positive(`Added device : ${deviceInterfaceData.deviceInterfaceId}`);
                props.handleClose(await response.response.json());
            }
        } else {
            const error = await response.text();
            toaster.negative(`${error}`);
        }
    }, [deviceInterfaceData, props, url]);

    const { deviceInterfaceId, deviceInterfaceName} = deviceInterfaceData;

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
                        <LabeledInput className="basic" label='Device Id' name='deviceInterfaceId' value={deviceInterfaceId} onChange={handleChange} />
                        <LabeledInput className="basic" label='Device Name' name='deviceInterfaceName' value={deviceInterfaceName} onChange={handleChange} />
                    </div>
                </div>
                <Button className="buttons" styleType="high-visibility" onClick={addDeviceInterface} > Add </Button>
            </Modal >
        </>
    )
}