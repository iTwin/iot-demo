/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Icon } from "@itwin/core-react";
import { Button, DropdownMenu, IconButton, MenuDivider, MenuItem, Modal, SelectOption } from "@itwin/itwinui-react";
import React, { useCallback, useEffect, useState } from "react";
import { Story } from "../clients/ITwinLink";
import { DeviceMonitorUI } from "../DeviceMonitorUI";
import { IoTConnectionManager } from "../IoTConnection/IoTConnectionManager";
import { SmartDevice } from "../SmartDevice";
import { getDeviceDataFromTelemetry, getDevicesByDeviceId, getDevicesLevelWise, getLevelList, removeConsumerCallback, resetDeviceStatus, setDeviceStatusToActive } from "../Utils";
import { ChartConfigurationComponent } from "./ChartConfigurationComponent";
import { v4 as uuidv4 } from "uuid";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { SvgMore } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import "@itwin/itwinui-layouts-css";

export interface ChartData {
  chartId: string;
  name: string;
  level: string;
  phenomenon: string;
  deviceIds: string[];
  chartType: string;
}

export const IoTChartWidget = () => {
  const [deviceList, setDeviceList] = useState<SmartDevice[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Story>();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartDataChanged, setChartDataChanged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<ChartData>({} as ChartData);
  const [phenomenonList, setPhenomenonList] = useState<SelectOption<string>[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let level: Story;

      if (selectedLevel === undefined) {
        const levelList = await getLevelList();
        level = levelList[0];
      } else {
        level = selectedLevel;
      }

      const devices = await getDevicesLevelWise(level?.bottomElevation, level?.topElevation);
      if (selectedLevel === undefined) {
        setSelectedLevel(level);
      }
      setDeviceList(devices);
      const phenomenonArray: SelectOption<string>[] = [];

      devices.forEach((device) => {
        if (phenomenonArray.find((p) => p.value === device.phenomenon) === undefined) {
          phenomenonArray.push({ value: device.phenomenon, label: device.phenomenon });
        }
      });

      setPhenomenonList(phenomenonArray);
    };
    void fetchData();
  }, [selectedLevel]);

  const levelSelected = useCallback((e: any) => {
    setSelectedLevel(e.detail);
  }, []);

  useEffect(() => {
    document.addEventListener("LevelChanged", (e) => levelSelected(e));
  }, [levelSelected]);

  const ConnectionChanged = (e: any) => {
    const callbacks = ITwinViewerApp.store.getState().consumerState.consumerCallbacks;
    if (callbacks.size !== 0) {
      IoTConnectionManager.handleConnectionChange(e.detail);
    }
  };

  useEffect(() => {
    document.addEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    return () => {
      document.removeEventListener("ConnectionChanged", (e) => ConnectionChanged(e));
    };
  }, []);

  const createTile = () => {
    const chartdata = chartData;
    let chartName = "";
    if (selectedLevel === undefined) {
      chartName = "DefaultLevel";
    } else {
      chartName = selectedLevel.name;
    }
    chartdata.push({
      chartId: uuidv4(),
      name: chartName.concat("_".concat((chartdata.length + 1).toString())),
      level: selectedLevel?.name,
      deviceIds: [],
      phenomenon: "",
      chartType: "",
    } as ChartData);
    setChartData(chartdata);
    setChartDataChanged(!chartDataChanged);
  };

  const deleteChart = (chart: ChartData, close: () => void) => {
    const chartdata = chartData;
    removeConsumerCallback(chart.chartId);
    const devicesForActivityStatusReset: SmartDevice | SmartDevice[] = getDevicesByDeviceId(chart.deviceIds, deviceList);

    if (devicesForActivityStatusReset.length !== 0) {
      resetDeviceStatus(devicesForActivityStatusReset);
    }
    chartdata.splice(chartdata.findIndex((item) => item.chartId === chart.chartId), 1);
    setChartData(chartdata);
    setChartDataChanged(!chartDataChanged);
    close();
  };

  const openChartConfigurationModal = (chart: ChartData, close: () => void) => {
    setData(chart);
    setIsModalOpen(true);
    close();
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const configureChart = (phenomenon: string, deviceIds: string[], charttype: string) => {
    const chartdata = chartData;
    let devicesForChart: SmartDevice[] = [];
    let devicesToRemove: string | any[] | SmartDevice = [];
    let devicesToAdd: string | any[] | SmartDevice = [];
    const id = data.chartId;
    chartdata.forEach((chart) => {
      if (chart.chartId === data.chartId) {
        if (deviceIds.length === 0) {
          devicesToRemove = getDevicesByDeviceId(chart.deviceIds, deviceList);
        } else {
          devicesToRemove = getDevicesByDeviceId(chart.deviceIds.filter((x) => !deviceIds.includes(x)), deviceList);
        }
        if (chart.deviceIds.length === 0) {
          devicesToAdd = getDevicesByDeviceId(deviceIds, deviceList);
        } else {
          devicesToAdd = getDevicesByDeviceId(deviceIds.filter((x) => !chart.deviceIds.includes(x)), deviceList);
        }
        chart.deviceIds = deviceIds;
        chart.phenomenon = phenomenon;
        chart.chartType = charttype;
      }
    });
    if (devicesToRemove.length !== 0) {
      resetDeviceStatus(devicesToRemove);
    }
    if (devicesToAdd.length !== 0) {
      setDeviceStatusToActive(devicesToAdd);
    }

    setChartData(chartData);
    setChartDataChanged(!chartDataChanged);
    devicesForChart = getDevicesByDeviceId(deviceIds, deviceList);
    IoTConnectionManager.monitor((msg: any) => {
      const realTimeData = getDeviceDataFromTelemetry(msg, devicesForChart);
      if (realTimeData.length !== 0) {
        DeviceMonitorUI.showChart(realTimeData, devicesForChart, id, phenomenon, charttype);
      }
    }, devicesForChart, id);
  };

  const renderCharts = (chart: ChartData) => {
    const dropdownMenuItems = (close: () => void) => {
      return (
        [<MenuItem key={1} onClick={() => openChartConfigurationModal(chart, close)}>
          Configure Chart
        </MenuItem>,
        < MenuItem key={2} onClick={() => deleteChart(chart, close)} >
          Delete Chart
        </MenuItem>]);
    };

    return (
      <div key={chart.name} style={{ maxWidth: "555px", margin: "5px 5px 5px 5px", border: "1px solid #b3b3b5", display: chart.level === selectedLevel?.name ? "block" : "none" }}>
        <div id={chart.chartId} style={{ width: "100%", height: "300px", display: "block" }} ></div>
        <div style={{ width: "100%", height: "20px", borderTop: "1px solid #b3b3b5", display: "table", backgroundColor: "#e8e8ed" }}>
          <div style={{ display: "table-cell", textAlign: "left", paddingLeft: "5px" }}><h3>{chart.name}</h3></div>
          <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: "right" }}>
            <DropdownMenu menuItems={dropdownMenuItems}>
              <IconButton size="small" styleType="borderless">
                <SvgMore />
              </IconButton>
            </DropdownMenu>
          </div>
        </div>
      </div>

    );
  };

  return (<>

    <div style={{ textAlign: "center", overflow: "auto", margin: "10px 10px 10px 10px" }}>
      <MenuDivider style={{ margin: "10px 10px 10px 10px" }} />
      <Button styleType="default" title="Add a new chart" size="large" onClick={createTile} style={{ width: "100%" }} startIcon={<Icon iconSpec="icon-add" />}> Add a new chart</Button>
      <MenuDivider style={{ margin: "10px 10px 10px 10px" }} />
      <br></br>
      <FluidGrid minItemWidth={560}>{chartData.map((chart: any) => renderCharts(chart))}</FluidGrid>
      <Modal
        isOpen={isModalOpen}
        title="Configure Chart"
        onClose={closeModal}
        style={{ overflow: "scroll" }}
      >
        <ChartConfigurationComponent chart={data} phenomenonList={phenomenonList} deviceList={deviceList} closeModal={closeModal} configureChart={configureChart} />
      </Modal>
    </div>

  </>

  );
};
