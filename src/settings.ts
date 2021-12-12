'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: dataPointSettings = new dataPointSettings();
}

export class dataPointSettings {
    // Default color
    public defaultColor = '';
    // Show all
    public showAllDataPoints = true;
    // Fill
    public fill = '';
    // Color saturation
    public fillRule = '';
    // Text Size
    public fontSize = 12;
}
