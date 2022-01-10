// babel ^7.6
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// powerbi
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualEventService = powerbi.extensibility.IVisualEventService;

import { VisualSettings } from './settings';
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

import powerbiVisualsApi from 'powerbi-visuals-api';
import VisualObjectInstance = powerbi.VisualObjectInstance;
import { dataViewWildcard } from 'powerbi-visuals-utils-dataviewutils';
import VisualEnumerationInstanceKinds = powerbiVisualsApi.VisualEnumerationInstanceKinds;

import { min, max, zip } from 'lodash';
import { color } from 'd3-color';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import Sunburst from 'sunburst-chart';

type ID = string | number | null;
type Data = {
    id: ID;
    parent_id: ID;
    label: string;
    value: number;
    size: 1;
};

type Node = {
    label: string;
    children: Node[];
    id?: ID;
    parent_id?: ID;
    size: 1;
    value?: number;
};

const buildTree = (nodes: Data[], parent_id: ID = null): Node[] => {
    return nodes
        .filter((node: Data) => node.parent_id === parent_id)
        .reduce(
            (tree, node) => [
                ...tree,
                {
                    ...node,
                    children: buildTree(nodes, node.id),
                },
            ],
            [],
        );
};

export class Visual implements IVisual {
    private events: IVisualEventService;
    private div: HTMLElement;
    private visualSettings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.div = options.element;
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions,
    ): VisualObjectInstanceEnumeration {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        if (!this.visualSettings || !this.visualSettings.arc) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'arc':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        arcColor: this.visualSettings.arc.arcColor,
                    },
                    altConstantValueSelector: null,
                    selector: dataViewWildcard.createDataViewWildcardSelector(
                        dataViewWildcard.DataViewWildcardMatchingOption
                            .InstancesAndTotals,
                    ),
                    propertyInstanceKind: {
                        fill: VisualEnumerationInstanceKinds.ConstantOrRule,
                    },
                });
                break;
        }
        console.log(objectEnumeration);
        return objectEnumeration;
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        const dataView: DataView = options.dataViews[0];
        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        const { fontSize } = this.visualSettings.labelText;
        const { viewport } = options;
        const { width, height } = viewport;

        const { categories, values } = dataView.categorical;

        const staticData: Data[] = zip(
            ...[...categories, ...values]
                .map(({ source: { roles }, values }) => [
                    Object.keys(roles)[0],
                    values,
                ])
                .map(([roles, values]: [string, powerbi.PrimitiveValue[]]) =>
                    values.map((value) => ({ [roles]: value })),
                ),
        ).map((values: Object[]) =>
            values.reduce((acc, cur) => ({ ...acc, ...cur })),
        );

        // // @ts-expect-error
        // const colorBuilder: ScaleLinear<number, string> = scaleLinear()
        //     .domain([minVal, (minVal + maxVal) / 2, maxVal])
        //     // @ts-expect-error
        //     .range([lowColor, midColor, highColor]);

        // const dynamicData = staticData.map((point) => ({
        //     ...point,
        //     color:
        //         point.value !== undefined
        //             ? color(colorBuilder(point.value)).formatHex()
        //             : '#333333',
        // }));

        // const data = buildTree(dynamicData)[0];

        // this.div.replaceChildren();

        // Sunburst()
        //     .data(data)
        //     .width(width)
        //     .height(height)
        //     .size('size')
        //     .label('id')
        //     .showLabels(false)
        //     .tooltipTitle(({ label }: Node) => label)
        //     .tooltipContent(({ value }: Node) =>
        //         value !== undefined ? value.toString() : 'null',
        //     )
        //     .radiusScaleExponent(1)
        //     .color('color')
        //     // .strokeColor(() => '#333333')
        //     .labelOrientation('angular')(this.div);

        // setTimeout(() => {
        //     document
        //         .querySelectorAll<HTMLElement>('.sunburst-viz .angular-label')
        //         .forEach((el) => (el.style.fontSize = `${fontSize}px`));
        //     document.querySelector<HTMLElement>(
        //         '.sunburst-tooltip',
        //     ).style.maxWidth = '900px';
        //     document
        //         .querySelectorAll<HTMLElement>('.main-arc')
        //         .forEach((el) => (el.style.strokeWidth = '0.5px'));
        // });

        this.events.renderingFinished(options);
    }
}
