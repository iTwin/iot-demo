/*---------------------------------------------------------------------------------------------
* Copyright © Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React from "react";
import { IModelApp } from "@itwin/core-frontend";
import { ITwinLink, Story } from "../clients/ITwinLink";
import { AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider, WidgetState } from "@itwin/appui-abstract";
import { SmartDeviceDecorator } from "../decorators/SmartDeviceDecorator";
import { IoTHeatMapWidget } from "../components/IoTHeatMapWidget";
import { Provider } from "react-redux";
import { IoTDeviceListWidget } from "../components/IoTDeviceListWidget";
import { ITwinViewerApp } from "../app/ITwinViewerApp";
import { IoTChartWidget } from "../components/IoTChartWidget";
import { IoTLogsWidget } from "../components/IoTLogsWidget";
import { getConfiguration } from "../Utils";

export class IoTMonitoringWidgetProvider implements UiItemsProvider {
  public readonly id: string = "IoTMonitoringWidgetProvider";
  private static decorator?: SmartDeviceDecorator;

  public handleLevelChange = async (selectedStory?: Story) => {
    const vp = IModelApp.viewManager.selectedView;
    if (vp) {
      if (IoTMonitoringWidgetProvider.decorator) {
        IModelApp.viewManager.dropDecorator(IoTMonitoringWidgetProvider.decorator);
        IoTMonitoringWidgetProvider.decorator = undefined;
      }

      if (!IoTMonitoringWidgetProvider.decorator)
        IoTMonitoringWidgetProvider.decorator = new SmartDeviceDecorator(selectedStory?.bottomElevation, selectedStory?.topElevation);

      IModelApp.viewManager.addDecorator(IoTMonitoringWidgetProvider.decorator);
    }
  };

  public provideWidgets(_stageId?: string, _stageUsage?: string, location?: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<AbstractWidgetProps> {
    const widgets: AbstractWidgetProps[] = [];
    if (location === StagePanelLocation.Right && _section === StagePanelSection.Start) {
      if (getConfiguration()?.HeatMap?.Show === "true") {
        widgets.push(
          {
            id: "IoTHeatMapWidget",
            label: "IoTHeatMap",
            defaultState: WidgetState.Floating,
            getWidgetContent: () => <IoTHeatMapWidget imodel={ITwinLink.iModel} levelChanged={this.handleLevelChange} />,
          },
        );
      }
      if (getConfiguration()?.chart?.Show === "true") {
        widgets.push(
          {
            id: "IoTChartWidget",
            label: "IoTChart",
            defaultState: WidgetState.Floating,
            getWidgetContent: () => <IoTChartWidget />,
          },
        );
      }
      widgets.push(
        {
          id: "Devices",
          label: "IoT Devices",
          defaultState: WidgetState.Floating,
          getWidgetContent: () => <Provider store={ITwinViewerApp.store}><IoTDeviceListWidget imodel={ITwinLink.iModel} levelChanged={this.handleLevelChange} /></Provider>,
        },
      );
      if (getConfiguration()?.Logs?.Show === "true") {
        widgets.push(
          {
            id: "Logs",
            label: "IoTLogs",
            defaultState: WidgetState.Floating,
            getWidgetContent: () => <IoTLogsWidget />,
          },
        );
      }

    }
    return widgets;
  }
}
