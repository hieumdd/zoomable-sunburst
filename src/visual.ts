"use strict";


import "core-js/stable";
import "regenerator-runtime/runtime";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.IVisualHost;
import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

import Sunburst from "sunburst-chart";
import { data } from "./mock";

export class Visual implements IVisual {
  private host: IVisualHost;
  private div: HTMLElement;

  constructor(options: VisualConstructorOptions) {
    this.div = options.element;
  }

  public update(options: VisualUpdateOptions) {
    Sunburst().data(data)(this.div);
  }
}
