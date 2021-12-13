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
import IVisualHost = powerbi.extensibility.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IColorPalette = powerbi.extensibility.IColorPalette;

import { VisualSettings } from './settings';
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

import * as d3 from 'd3';
import { color } from 'd3';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import Sunburst from 'sunburst-chart';
// import { mock } from './mock';

type ID = number | null;
type Data = {
    id: ID;
    parent_id: ID;
    label: string;
    value: number;
};

type Node = {
    name: string;
    children: Node[];
    id?: ID;
    parent_id?: ID;
    size?: 1;
    value?: number;
};

const colorDomain = [0, 5, 10];

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
    private host: IVisualHost;
    private div: HTMLElement;
    private visualSettings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
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

        // @ts-expect-error
        const colorPalette: IColorPalette = this.host.colorPalette;

        const dataView: DataView = options.dataViews[0];
        const {
            viewport: { width, height },
        } = options;
        const {
            table: { columns, rows },
        } = dataView;
        const roles: string[] = columns.map(
            ({ roles }) => Object.keys(roles)[0],
        );

        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        console.log(this.visualSettings);
        const { lowColor, midColor, highColor } =
            this.visualSettings.conditionalColor;

        // @ts-expect-error
        const colorBuilder: ScaleLinear<number, string> = scaleLinear()
            .domain(colorDomain)
            // @ts-expect-error
            .range<string>([lowColor, midColor, highColor]);

        const data: Data[] = rows
            .map(
                (row) =>
                    <Data>(
                        (<unknown>(
                            Object.fromEntries(roles.map((k, i) => [k, row[i]]))
                        ))
                    ),
            )
            .map((row) => row);

        const dataNodes = buildTree(data);
        const dataRoot = transformNode(dataNodes[0]);

        this.div.replaceChildren();

        Sunburst()
            .data(dataRoot)
            .width(width)
            .height(height)
            .size('size')
            .label('label')
            .color((d: Node) => color(colorBuilder(d.value)).formatHex())
            .labelOrientation('angular')(this.div);

        // setTimeout(
        //     () =>
        //         document
        //             .querySelectorAll('.sunburst-viz .angular-label')
        //             .forEach((el: HTMLElement) => (el.style.fontSize = '1px')),
        //     0,
        // );

        this.events.renderingFinished(options);
    }
}
