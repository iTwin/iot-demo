/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { EmphasizeElements, IModelApp } from "@itwin/core-frontend";
import { WritableXAndY } from "@itwin/core-geometry";
import { SmartDevice } from "./SmartDevice";
import { ColorDef, FeatureAppearance, FeatureOverrideType } from "@itwin/core-common";
import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, TimeScale, TimeSeriesScale, Title, Tooltip } from "chart.js";
import ReactDOM from "react-dom";
import React from "react";
import { getConfiguration } from "./Utils";
import "chartjs-adapter-moment";
import { getLogData, setLogData } from "./components/IoTLogsWidget";
import { Code } from "@itwin/itwinui-react";
import { BeEvent } from "@itwin/core-bentley";

Chart.register(CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend);

export interface chartData {
  chartDeviceMapId: string;
  chartDataY: { x: any, y: any }[];
}
export interface chartLabels {
  chartOptions: any;
  chartPhenomenon: string | undefined;
}
export class DeviceMonitorUI {

  public static _chartData: chartData[] = [];
  public static chartLabel: Map<string, chartLabels> = new Map();
  public static _colorPallete: string[] = getConfiguration()?.chart?.colors ?? "";

  public static onPopulateDeviceComplete = new BeEvent<() => void>();
  public static onPopulateDeviceError = new BeEvent<(connectionId: number) => void>();

  public static createToolTip(device: SmartDevice, realTimeData: any, location: Readonly<WritableXAndY> | undefined, unitOfData?: string) {
    const title = unitOfData ? `<b> ${device.label} - ${device.type} </b><br> ${device.phenomenon}: ${realTimeData} ${unitOfData}` : `<b> ${device.label} - ${device.type} </b><br> ${device.phenomenon}: ${realTimeData}`;
    const div = document.createElement("div");
    div.innerHTML = title;
    IModelApp.viewManager.selectedView!.openToolTip(div, location);
  }

  public static showChart(data: { iotId: string, value: string, unit: string, timeStamp: Date }[], deviceAdded: undefined | SmartDevice[], chartId: string, phenomenon: string, chartType: string) {

    const dataSets: { label: string, data: { x: any, y: any }[] | undefined, fill: boolean, backgroundColor: string, borderColor: string, spanGaps: boolean, lineTension: number }[] = [];
    if (this.chartLabel.size !== 0 && this.chartLabel.has(chartId)) {
      if (this.chartLabel.get(chartId) !== undefined) {
        const chartLabel = this.chartLabel.get(chartId);
        const yLabel = chartLabel?.chartPhenomenon;
        const options = chartLabel?.chartOptions;
        const labelUnit = data[0].unit === "" ? "" : " (".concat(data[0].unit.concat(")"));
        options.scales.y.title.text = phenomenon.concat(labelUnit);
        this.chartLabel.delete(chartId);
        this.chartLabel.set(chartId, { chartPhenomenon: yLabel, chartOptions: options });
      }

    } else {
      const configData = getConfiguration().chart.options;
      const options = JSON.parse(JSON.stringify(configData));
      const labelUnit = data[0].unit === "" ? "" : " (".concat(data[0].unit.concat(")"));
      options.scales.y.title.text = phenomenon.concat(labelUnit);
      this.chartLabel.set(chartId, { chartPhenomenon: phenomenon, chartOptions: options });
    }
    if (deviceAdded === undefined || deviceAdded.length === 0) {
      if (document.getElementById(chartId) !== null) {
        ReactDOM.render(<></>, document.getElementById(chartId));
      }
      return;
    }
    let colorIndex = 0;
    deviceAdded?.forEach((d) => {
      const chartdata = this._chartData.find((chart) => chart.chartDeviceMapId === chartId.concat(d.iotId));
      const realTimeChartData = data.find((dt) => dt.iotId === d.iotId);
      const dataY = [];
      let chartDataY = chartdata?.chartDataY ?? [];
      if (realTimeChartData !== undefined && realTimeChartData.value !== "no data") {
        let value = realTimeChartData?.value;
        if (value === "false") {
          value = "0";
        } else if (value === "true") {
          value = "1";
        }
        dataY.push({ x: realTimeChartData.timeStamp, y: parseFloat(value) });
      }
      if (chartdata === undefined) {

        if (dataY.length !== 0) {
          this._chartData.push({ chartDeviceMapId: chartId.concat(d.iotId), chartDataY: dataY } as chartData);
          chartDataY?.push(dataY[0]);
        }
      } else {
        const chartYData = chartdata.chartDataY;
        if (chartYData.length !== 0) {
          let timeWindow = new Date((new Date(chartYData[0].x)).getTime() + parseInt(getConfiguration().chart.ChartDuration, 10) * 1000);
          while (data.length !== 0 && (new Date(data[0].timeStamp)) > timeWindow) {
            chartYData.shift();
            if (chartYData.length !== 0) {
              timeWindow = new Date((new Date(chartYData[0].x)).getTime() + parseInt(getConfiguration().chart.ChartDuration, 10) * 1000);
            } else {
              break;
            }
          }
        }
        this._chartData.splice(this._chartData.indexOf(chartdata), 1);
        this._chartData.push({ chartDeviceMapId: chartId.concat(d.iotId), chartDataY: chartYData.concat(dataY) } as chartData);
        chartDataY = chartYData.concat(dataY);
      }
      chartDataY?.sort((a, b) => ((new Date(a.x)) > (new Date(b.x))) ? 1 : -1);
      if (this._colorPallete.length === 0) {
        this._colorPallete = getConfiguration().chart.colors;
      }
      dataSets.push({
        label: d.label,
        data: chartDataY,
        fill: true,
        backgroundColor: this._colorPallete[colorIndex],
        borderColor: this._colorPallete[colorIndex],
        spanGaps: true,
        lineTension: 0.3,
      });
      if (colorIndex > this._colorPallete.length - 2) {
        colorIndex = 0;
      } else {
        colorIndex += 1;
      }
    });
    const chartData = {
      datasets: dataSets,
    };
    const chartOptions = this.chartLabel.get(chartId)?.chartOptions;

    if (document.getElementById(chartId) !== null) {
      let chartComponent = <Line data={chartData} options={chartOptions} />;
      if (chartType === "Bar") {
        chartComponent = <Bar data={chartData} options={chartOptions} />;
      } else if (chartType === "Line") {
        chartComponent = <Line data={chartData} options={chartOptions} />;
      }

      ReactDOM.render(chartComponent, document.getElementById(chartId));
    }
  }

  public static printLogs(realTimeData: any) {
    if (realTimeData[0].value !== "no data") {
      const jsondata = getLogData();
      jsondata.push(realTimeData[0]);
      setLogData(jsondata);
      const unique = [...new Set(jsondata.map((item) => item.iotId))];
      if (document.getElementById("logs") !== null) {
        const info = "Collected ".concat(jsondata.length.toString().concat(" datapoints  from ".concat(unique.length.toString().concat(" devices"))));
        const logInfoComponent = <Code>{info}</Code>;
        ReactDOM.render(logInfoComponent, document.getElementById("logs"));
      }
    }
  }

  public static colorCode(deviceList: SmartDevice[], realTimeData: { iotId: string, value: string, unit: string, timeStamp: Date }[]) {
    const vp = IModelApp.viewManager.selectedView!;
    const emphasize = EmphasizeElements.getOrCreate(vp);
    deviceList.forEach((device) => {
      realTimeData.forEach((data) => {
        if (data.iotId === device.iotId && data.value !== "no data") {
          const color = ColorPickerController.deviceColorPicker(data.value, device.phenomenon);
          emphasize.emphasizeElements(device.observedElement, vp, FeatureAppearance.fromTransparency(parseFloat(getConfiguration().HeatMap.Transparency)), false);
          emphasize.overrideElements(device.observedElement, vp, color, FeatureOverrideType.ColorAndAlpha, false);
        }
      });
    });
  }

  public static clearColorCode(observedElement: string, clearEmphasized?: boolean) {
    const vp = IModelApp.viewManager.selectedView!;
    const emphasize = EmphasizeElements.getOrCreate(vp);
    if (clearEmphasized) {
      emphasize.clearEmphasizedElements(vp);
    }
    const emphasizedElements = emphasize.getEmphasizedElements(vp);
    if (emphasizedElements?.has(observedElement)) {
      emphasizedElements.delete(observedElement);
    }
    if (emphasizedElements !== undefined) {
      emphasize.emphasizeElements(emphasizedElements, vp, FeatureAppearance.fromTransparency(parseFloat(getConfiguration().HeatMap.Transparency)), false);
    }
    emphasize.clearOverriddenElements(vp, observedElement);
  }
}

export class ColorPickerController {
  public static deviceColorPicker = (reading: any, selectedParam: string) => {
    if (reading === "false")
      reading = 1;
    else if (reading === "true")
      reading = 0;

    return getenvColorCode(selectedParam, reading);
  };

}

export const getenvColorCode = (selectedParam: string, readingValue: number) => {
  let defaultColor = ColorDef.fromString("black");
  const envColorValueData = getConfiguration().HeatMap.colors.find((data: any) => data.phenomenon === selectedParam);
  const envColorValue = envColorValueData?.data;
  envColorValue?.forEach((element: any) => {
    if (readingValue >= element.min && readingValue <= element.max) {
      defaultColor = ColorDef.fromString(element.color);
      return;
    }
  });
  return defaultColor;
};
