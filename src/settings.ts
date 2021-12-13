'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class ArcColorSettings {
    public lowColor: string = '#166534';
    public midColor: string = '#ffffff';
    public highColor: string = '#991b1b';
}

export class LabelTextSettings {
    public fontSize: number = 20;
}

export class VisualSettings extends DataViewObjectsParser {
    public arcColor: ArcColorSettings = new ArcColorSettings();
    public labelText: LabelTextSettings = new LabelTextSettings();
}
