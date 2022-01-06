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

import { min, max } from 'lodash';
import { color } from 'd3-color';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import Sunburst from 'sunburst-chart';

type ID = string | number | null;
type Data = {
    id: ID;
    parent_id: ID;
    label: string;
    value: number;
};

type Node = {
    label: string;
    children: Node[];
    id?: ID;
    parent_id?: ID;
    size?: 1;
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

const transformNode = (node: Node): Node => ({
    ...node,
    children: node.children.map((child) => transformNode(child)),
    ...(!(node.children.length > 0) && { size: 1 }),
});

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
        const settings: VisualSettings =
            this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        return VisualSettings.enumerateObjectInstances(settings, options);
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        const dataView: DataView = options.dataViews[0];
        const { table } = dataView;
        const { columns, rows } = table;
        const { viewport } = options;
        const { width, height } = viewport;

        const roles = columns
            .map(({ roles }) => Object.entries(roles))
            .map(([col, _]) => col)
            .map(([col, _]) => col);

        const data: Data[] = rows.map(
            (row) => <Data>Object.fromEntries(roles.map((k, i) => [k, row[i]])),
        );

        const dataNodes = buildTree(data);
        const dataRoot = transformNode(dataNodes[0]);

        const [minVal, maxVal] = [min, max].map((fn) =>
            fn(data.map((i) => i.value)),
        );
        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        const { lowColor, midColor, highColor } = this.visualSettings.arcColor;
        const { fontSize } = this.visualSettings.labelText;
        // @ts-expect-error
        const colorBuilder: ScaleLinear<number, string> = scaleLinear()
            .domain([minVal, (minVal + maxVal) / 2, maxVal])
            // @ts-expect-error
            .range([lowColor, midColor, highColor]);

        this.div.replaceChildren();

        Sunburst()
            .data(dataRoot)
            .width(width)
            .height(height)
            .size('size')
            .label('id')
            .showLabels(false)
            .tooltipContent(({ label }: Node) => label)
            .radiusScaleExponent(1)
            .color(({ value }: Node) => color(colorBuilder(value)).formatHex())
            .strokeColor(() => '#333333')
            .labelOrientation('angular')(this.div);

        setTimeout(() => {
            document
                .querySelectorAll<HTMLElement>('.sunburst-viz .angular-label')
                .forEach((el) => (el.style.fontSize = `${fontSize}px`));
            document.querySelector<HTMLElement>(
                '.sunburst-tooltip',
            ).style.maxWidth = '900px';
            document
                .querySelectorAll<HTMLElement>('.main-arc')
                .forEach((el) => (el.style.strokeWidth = '0.5px'));
        });

        this.events.renderingFinished(options);
    }
}
