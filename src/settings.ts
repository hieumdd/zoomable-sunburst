'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class ArcSetings {
    public arcColor: string = '#991b1b';
    public strokeColor: string = '#000000';
    public strokeWidth: number = 1;
}

export class TooltipSettings {
    public tooltipFontSize: number = 16;
}

export class VisualSettings extends DataViewObjectsParser {
    public arc: ArcSetings = new ArcSetings();
    public tooltip: TooltipSettings = new TooltipSettings();
}
