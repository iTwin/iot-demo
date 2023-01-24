import React from "react";
import { Anchor, toaster } from "@itwin/itwinui-react";
import { IotAlertApi } from "./IotAlertApi";
import { Point3d } from "@itwin/core-geometry";
import { func } from "./utils";

export class IotAlert {
    constructor(public elementId: string, public location: Point3d, public label: string) {
    }

    public display() {
        const elementId = this.elementId;
        toaster.setSettings({
            placement: "top",
            order: "descending",
        });
        const alert = toaster.warning(
            <>
                Alert! There is an issue with <Anchor onClick={async () => IotAlertApi.zoomToElements(this.elementId, this.location)}>{this.label}</Anchor>
            </>,
            {
                type: "persisting", link: {
                    title: "Resolve",
                    onClick() {
                        const res = func(elementId);
                        console.log(res);
                    },
                },
            });
        console.log(alert);
    }
}
