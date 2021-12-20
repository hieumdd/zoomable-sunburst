'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class ArcColorSettings {
    public lowColor: string = '#991b1b';
    public midColor: string = '#ffffff';
    public highColor: string = '#166534';
}

export class LabelTextSettings {
    public fontSize: number = 20;
}

export class VisualSettings extends DataViewObjectsParser {
    public arcColor: ArcColorSettings = new ArcColorSettings();
    public labelText: LabelTextSettings = new LabelTextSettings();
}
