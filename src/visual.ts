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
import { VisualSettings } from './settings';

import { dataViewWildcard } from 'powerbi-visuals-utils-dataviewutils';
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;

import { zip } from 'lodash';
import { scaleLinear } from 'd3-scale';
import Sunburst from 'sunburst-chart';

type GradientColor = {
    color: string;
    value: number;
};

type GradientOptions = {
    min: GradientColor;
    max: GradientColor;
    mid?: GradientColor;
};

type MetaData = powerbi.DataViewMetadata & {
    objectsRules: {
        arc: {
            arcColor: {
                gradient: {
                    options: {
                        [key: string]: GradientOptions;
                    };
                };
            };
        };
    };
};

type ColorBuilder = (value: number) => string;

type ID = string | number | null;

type Data = {
    id: ID;
    label: string;
    color: string;
    size: 1;
    parent_id?: ID;
    value?: number;
};

type Node = {
    id: ID;
    label: string;
    color: string;
    children: Node[];
    size: 1;
    parent_id?: ID;
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

const gradient = (domain: any[], range: number[], value: number): string =>
    // @ts-expect-error
    scaleLinear().domain(domain).range(range)(value);

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

        // switch (objectName) {
        //     case 'arc':
        //         objectEnumeration.push({
        //             objectName: objectName,
        //             properties: {
        //                 arcColor: this.settings.arc.arcColor,
        //             },
        //             propertyInstanceKind: {
        //                 arcColor: VisualEnumerationInstanceKinds.ConstantOrRule,
        //             },
        //             altConstantValueSelector: null,
        //             selector: dataViewWildcard.createDataViewWildcardSelector(
        //                 dataViewWildcard.DataViewWildcardMatchingOption
        //                     .InstancesAndTotals,
        //             ),
        //         });
        //         break;
        // }
        return objectEnumeration;
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        this.settings = VisualSettings.parse<VisualSettings>(dataView);

        const {
            viewport: { width, height },
        } = options;

        const { categories = [], values = [] } = dataView.categorical;

        const columnsData = [...categories, ...values]
            .map(({ source: { roles }, objects, values }) => [
                Object.keys(roles)[0],
                objects || [...Array(values.length)],
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
                        color: object
                            ? object.arc.arcColor.solid.color
                            : undefined,
                    })),
            );

        const colorBuilder = this.colorBuilder(<MetaData>dataView.metadata);

        const dataRaw: Data[] = zip(...columnsData).map((values) =>
            values.reduce((acc, cur) => ({
                ...acc,
                ...cur,
                size: 1,
                color: cur.color || acc.color || colorBuilder(cur.value),
            })),
        );

        const data = buildTree(dataRaw)[0];

        this.div.replaceChildren();

        Sunburst()
            .data(data)
            .width(width)
            .height(height)
            .size('size')
            .label('id')
            .color('color')
            .showLabels(false)
            .tooltipTitle(({ label }: Node) => label)
            .tooltipContent(({ value }: Node) =>
                value !== undefined && value !== null
                    ? value.toString()
                    : 'null',
            )
            .radiusScaleExponent(1)
            .labelOrientation('angular')(this.div);

        setTimeout(() => {
            document.querySelector<HTMLElement>(
                '.sunburst-tooltip',
            ).style.maxWidth = '900px';
            document
                .querySelectorAll<HTMLElement>('.main-arc')
                .forEach((el) => (el.style.strokeWidth = '0.5px'));
        });
    }

    private colorBuilder(metadata: MetaData): ColorBuilder {
        if (metadata.objectsRules) {
            const options = Object.values(
                metadata.objectsRules.arc.arcColor.gradient.options,
            )[0];

            const gradientBuilder = (attr: string) =>
                ['min', 'mid', 'max']
                    .map((x) => options[x])
                    .filter((x: GradientColor) => x !== undefined)
                    .map((x: GradientColor) => x[attr]);

            return (value) =>
                value
                    ? gradient(
                          gradientBuilder('color'),
                          gradientBuilder('value'),
                          value,
                      )
                    : this.settings.arc.arcColor;
        } else {
            return (_: number) => this.settings.arc.arcColor;
        }
    }
}
