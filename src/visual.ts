// babel ^7.6. Required for Sunburst
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// powerbi
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';

// DataView
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;

// Formatting Options
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import { VisualSettings } from './settings';

// Conditional Formatting
import {
    dataRoleHelper,
    dataViewWildcard,
} from 'powerbi-visuals-utils-dataviewutils';
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;

import { zip, sortBy } from 'lodash';
import { HierarchyNode, stratify } from 'd3-hierarchy';
import { scaleLinear } from 'd3-scale';
import { select, pointer } from 'd3-selection';
import Sunburst from 'sunburst-chart';

type GradientColor = {
    color: string;
    value: number;
};

type GradientOptions = {
    min: GradientColor;
    max: GradientColor;
    mid?: GradientColor;
    nullColoringStrategy: {
        strategy: 'noColor' | 'asZero' | 'specificColor';
        color?: string;
    };
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
    labelNames: {
        labelName?: string;
        value?: string;
    }[];
    color: string;
    size: 1;
    parent_id?: ID;
    value?: number;
};

/**
 * D3 Gradient
 * @param domain Gradient domain
 * @param range Value range
 * @param value Value
 * @returns {string} Hex color
 */
const gradient = (domain: any[], range: number[], value: number): string =>
    // @ts-expect-error: ignore
    scaleLinear().domain(domain).range(range)(value);

/**
 * Sort function when null exists
 * @param a {HierarchyNode<Data>} Node
 * @param b {HierarchyNode<Data>} Node
 * @returns {boolean} Sort
 */
const sort = (a: HierarchyNode<Data>, b: HierarchyNode<Data>): number => {
    if (a.data.value && b.data.value) {
        if (a.data.value < b.data.value) {
            return -1;
        } else if (a.data.value > b.data.value) {
            return 1;
        } else if (a.data.value === b.data.value) {
            return 0;
        }
    } else if (a.data.value && !b.data.value) {
        return -1;
    } else if (!a.data.value && b.data.value) {
        return 1;
    } else if (!a.data.value && !b.data.value) {
        return 0;
    }
};

/**
 * Visual Class
 */
export class Visual implements IVisual {
    private div: HTMLElement;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.div = options.element;
    }

    /**
     * Formatting Panes Options
     * @param options Formatting options
     * @returns Object enums
     */
    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions,
    ): VisualObjectInstance[] {
        const objectName = options.objectName;
        const objectEnumeration: VisualObjectInstance[] = [];

        if (!this.settings || !this.settings.arc) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'arc':
                objectEnumeration.push({
                    objectName,
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
            case 'tooltip':
                objectEnumeration.push({
                    objectName,
                    properties: {
                        tooltipFontSize: this.settings.tooltip.tooltipFontSize,
                    },
                    selector: null,
                });
                break;
        }
        return objectEnumeration;
    }

    /**
     * Render
     * @param options Visual Update Options
     */
    public update(options: VisualUpdateOptions) {
        this.div.replaceChildren();
        const dataView: DataView = options.dataViews[0];
        this.settings = VisualSettings.parse<VisualSettings>(dataView);

        // Validation
        if (
            !dataRoleHelper.hasRoleInDataView(dataView, 'id') ||
            !dataRoleHelper.hasRoleInDataView(dataView, 'parent_id')
        ) {
            return;
        }

        const {
            viewport: { width, height },
        } = options;

        const { categories = [], values = [] } = dataView.categorical;

        // Extract columns data
        const columnsData = [...categories, ...values]
            .map(({ source: { roles, displayName }, objects, values }) => [
                Object.keys(roles)[0],
                displayName,
                objects || [...Array(values.length)],
                values,
            ])
            .map(
                ([roles, displayName, objects, values]: [
                    string,
                    string,
                    powerbi.DataViewObjects[],
                    powerbi.PrimitiveValue[],
                ]) =>
                    zip(values, objects).map(([value, object]) => ({
                        [roles]: value,
                        color: object
                            ? // @ts-expect-error: ignore
                              object.arc.arcColor.solid.color
                            : undefined,
                        labelName: roles === 'label' ? displayName : undefined,
                        valueName: roles === 'value' ? displayName : undefined,
                    })),
            );

        // Color Builder Factory
        const colorBuilder = this.colorBuilder(<MetaData>dataView.metadata);

        // Key-Value Factory
        const dataRaw: Data[] = sortBy(
            zip(...columnsData)
                .map((values) =>
                    values.reduce(
                        (acc, cur) => ({
                            ...acc,
                            ...cur,
                            size: 1,
                            labelNames: [
                                ...acc.labelNames,
                                { labelName: cur.labelName, value: cur.label },
                            ],
                            color:
                                cur.color ||
                                acc.color ||
                                colorBuilder(cur.value),
                        }),
                        { labelNames: [], color: undefined },
                    ),
                )
                .map((point: Data) => ({
                    ...point,
                    label: point.labelNames
                        .filter(({ labelName, value }) => labelName && value)
                        .map(({ labelName, value }) => `${labelName}: ${value}`)
                        .join('<br/>'),
                })),
            ({ value }) => value,
        );

        // Node Factory
        const data = stratify<Data>()
            .id(({ id }: Data) => id.toString())
            // @ts-expect-error: ignore
            .parentId(({ parent_id }: Data) => parent_id)(dataRaw);

        // Visual
        Sunburst()
            .data(data)
            .width(width)
            .height(height)
            .showLabels(false)
            .size(({ data: { size } }) => size)
            .color(({ data: { color } }) => color)
            .sort(sort)
            .tooltipTitle(({ data: { label } }) => label)
            .tooltipContent(({ data: { valueName, value } }) =>
                valueName && value ? `${valueName}: ${value}` : '',
            )
            .radiusScaleExponent(1)
            .labelOrientation('angular')(this.div);

        // Post render styles
        const el = select('.sunburst-viz');
        const tooltip = select('.sunburst-tooltip');
        tooltip.style(
            'font-size',
            `${this.settings.tooltip.tooltipFontSize}px`,
        );

        // Tooltip position
        el.on('mousemove', (ev) => {
            const [mouseX, mouseY] = pointer(ev);
            tooltip
                .style('left', `${mouseX}px`)
                .style('top', `${mouseY}px`)
                .style(
                    'transform',
                    `translate(-${(mouseX / width) * 100}%, -${mouseY * 0.5}%)`,
                );
        });
    }

    /**
     * Color builder for Gradient based
     * @param metadata
     * @returns
     */
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

            const {
                nullColoringStrategy: { strategy, color },
            } = options;

            const fallback =
                strategy === 'specificColor'
                    ? color
                    : strategy === 'asZero'
                    ? gradient(
                          gradientBuilder('color'),
                          gradientBuilder('value'),
                          0,
                      )
                    : this.settings.arc.arcColor;

            return (value) =>
                value
                    ? gradient(
                          gradientBuilder('color'),
                          gradientBuilder('value'),
                          value,
                      )
                    : fallback;
        } else {
            return (_: number) => this.settings.arc.arcColor;
        }
    }
}
