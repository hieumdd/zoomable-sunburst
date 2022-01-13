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

import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { VisualSettings } from './settings';

import { dataViewWildcard } from 'powerbi-visuals-utils-dataviewutils';
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;

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

const gradient = (domain, range) => scaleLinear().domain(domain).range(range);

export class Visual implements IVisual {
    private div: HTMLElement;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.div = options.element;
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions,
    ): VisualObjectInstance[] {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        if (!this.settings || !this.settings.arc) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'arc':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        arcColor: this.settings.arc.arcColor,
                    },
                    propertyInstanceKind: {
                        arcColor: VisualEnumerationInstanceKinds.ConstantOrRule,
                    },
                    altConstantValueSelector: null,
                    selector: dataViewWildcard.createDataViewWildcardSelector(
                        dataViewWildcard.DataViewWildcardMatchingOption
                            .InstancesAndTotals,
                    ),
                });
                break;
        }
        return objectEnumeration;
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        this.settings = VisualSettings.parse<VisualSettings>(dataView);
        console.log(dataView);

        const { fontSize } = this.settings.labelText;
        const {
            viewport: { width, height },
        } = options;

        const { metadata } = dataView;
        const { categories, values } = dataView.categorical;

        const columnsData = [...categories, ...values]
            .map(({ source: { roles }, objects, values }) => [
                Object.keys(roles)[0],
                objects,
                values,
            ])
            .map(
                ([roles, objects, values]: [
                    string,
                    powerbi.DataViewObjects[],
                    powerbi.PrimitiveValue[],
                ]) =>
                    zip(values, objects).map(([value, object]) => ({
                        [roles]: value,
                        color: object ? object.arc.arcColor.solid.color : null,
                    })),
            );


        // ! TODO: WHEN NO GRADIENT
        const gradientOptions: any = Object.values(
            // @ts-expect-error
            metadata.objectsRules?.arc.arcColor.gradient.options,
        )[0];
        const gradientBuilder = (attr) =>
            ['min', 'mid', 'max']
                .map((x) => gradientOptions[x])
                .filter((x) => x !== undefined)
                .map((x) => x[attr]);
        const colorBuilder = gradientOptions
            ? gradient(gradientBuilder('color'), gradientBuilder('value'))
            : (_) => this.settings.arc.arcColor;

        const staticData: Data[] = zip(...columnsData).map((values) =>
            values.reduce((acc, cur) => ({
                ...acc,
                ...cur,
                color: cur.color || acc.color || colorBuilder(cur.value),
            })),
        );

        console.log(staticData);

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
    }
}
