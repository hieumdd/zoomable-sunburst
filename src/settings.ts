'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class ConditionalColorSettings {
    public lowColor: string = '#166534';
    public midColor: string = '#ffffff';
    public highColor: string = '#991b1b';
}

export class VisualSettings extends DataViewObjectsParser {
    public conditionalColor: ConditionalColorSettings =
        new ConditionalColorSettings();
}
