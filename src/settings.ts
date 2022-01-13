'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class ArcSetings {
    public arcColor: string = '#991b1b';
    public objectRules: any = null;
}

export class LabelTextSettings {
    public fontSize: number = 20;
}

export class VisualSettings extends DataViewObjectsParser {
    public arc: ArcSetings = new ArcSetings();
    public labelText: LabelTextSettings = new LabelTextSettings();
}
