/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Alert, Button, Checkbox, InputGroup, Label, MenuDivider, Radio, Select, SelectOption } from "@itwin/itwinui-react";
import React, { useEffect, useState } from "react";
import { SmartDevice } from "../SmartDevice";
import { getConfiguration } from "../Utils";
import { ChartData } from "./IoTChartWidget";

interface ChartConfigurationProps {
  chart: ChartData;
  phenomenonList: SelectOption<string>[];
  deviceList: SmartDevice[];
  closeModal(): void;
  configureChart(phenomenon: string, deviceId: string[], charttype: string): void;
}

export const ChartConfigurationComponent: React.FC<ChartConfigurationProps> = (props: ChartConfigurationProps) => {
  const [selectedPhenomenon, setSelectedPhenomenon] = useState<string>("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [warningMsg, setWarningMsg] = useState("");
  const [chartTypeSelected, setChartTypeSelected] = useState("");
  const chartTypes = getConfiguration().chart.types;

  useEffect(() => {
    if (props.chart.phenomenon !== "") {
      setSelectedPhenomenon(props.chart.phenomenon);
    }
    if (props.chart.chartType !== "") {
      setChartTypeSelected(props.chart.chartType);
    }
    if (props.chart.deviceIds.length !== 0) {
      const d: React.SetStateAction<string[]> = [];
      props.chart.deviceIds.forEach((id) => {
        d.push(id);
      });
      setSelectedDevices(d);
    }
  }, [props]);

  const onPhenomenonSelectedChanged = (value: string) => {
    setWarningMsg("");
    setSelectedPhenomenon(value);
  };

  const setChart = (e: any) => {
    if (selectedPhenomenon === "") {
      e.preventDefault();
      setWarningMsg("Please Select Phenomenon");
      return;
    } else if (selectedDevices.length === 0) {
      e.preventDefault();
      setWarningMsg("Select atleast one device");
      return;
    } else if (selectedDevices.length > parseInt(getConfiguration().chart.NoOfDevicesInChart, 10)) {
      e.preventDefault();
      setWarningMsg("Maximum ".concat(getConfiguration().chart.NoOfDevicesInChart.concat(" devices can be selected")));
      return;
    } else if (chartTypeSelected === "") {
      e.preventDefault();
      setWarningMsg("Please Select Chart type");
      return;
    } else {
      e.preventDefault();
      props.configureChart(selectedPhenomenon, selectedDevices, chartTypeSelected);
      props.closeModal();
    }

  };

  const onSelectDevices = (deviceId: string, checked: boolean) => {
    const devices = selectedDevices;
    if (checked) {
      devices.push(deviceId);
      setSelectedDevices(devices);
      setWarningMsg("");
    } else {
      devices.splice(devices.indexOf(deviceId), 1);
      setSelectedDevices(devices);
    }

  };

  const onChartTypeSelected = (chartType: string) => {
    setChartTypeSelected(chartType);
    setWarningMsg("");
  };

  return (<>
    <form onSubmit={setChart}>
      {warningMsg !== "" ? <div><Alert type="warning" style={{ height: "20px" }}>
        {warningMsg}
      </Alert></div> : null}
      <br></br>

      <Label>Select Phenomenon</Label>
      <Select value={selectedPhenomenon} options={props.phenomenonList} onChange={(value: any) => onPhenomenonSelectedChanged(value)} disabled={props.chart?.phenomenon !== ""} placeholder="Select Phenomenon"></Select>
      <MenuDivider style={{ margin: "10px 10px 10px 10px" }} />
      {selectedPhenomenon !== "" ?

        <div>
          <Label>Select Devices</Label>
          {props.deviceList.map((device) => {
            if (device.phenomenon === selectedPhenomenon) {
              return (<Checkbox key={device.iotId} label={device.label} defaultChecked={props.chart?.deviceIds?.includes(device.iotId)} onChange={(event) => onSelectDevices(device.iotId, event.target.checked)} />);
            }
          })
          } <MenuDivider style={{ margin: "10px 10px 10px 10px" }} /></div> : null
      }
      <div>
        <InputGroup displayStyle="default"
          label="Select Chart type">
          {chartTypes.map((type: string) => {
            return (
              <Radio
                key={type}
                name={type}
                value={type}
                onChange={() => onChartTypeSelected(type)}
                checked={chartTypeSelected === type}
                label={type.concat(" Chart")}
                required={true}
              />
            );
          })}
        </InputGroup>

      </div>

      <MenuDivider style={{ margin: "10px 10px 10px 10px" }} />
      <div className="btn-wrapper">
        <div className="left-btn-div">
          <Button type="submit" styleType="high-visibility" className="btn-left" size="small" title="Save Chart" onClick={(e) => setChart(e)}>OK</Button>
        </div >
        <div className="right-btn-div">
          <Button styleType="default" className="btn-right" title="Cancel" size="small" onClick={props.closeModal} disabled={false}>Cancel</Button>
        </div>
      </div >
    </form>
  </>);
};
