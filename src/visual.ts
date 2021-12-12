// babel ^7.6
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// powerbi
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
// import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
// import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
// import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IColorPalette = powerbi.extensibility.IColorPalette;

import Sunburst from 'sunburst-chart';
// import { mock } from './mock';

type ID = number | null;
type Data = {
    id: ID;
    parent: ID;
    name: string;
};

type Node = {
    name: string;
    children: Node[];
    id?: ID;
    parent?: ID;
    value?: number;
};

const buildTree = (nodes: Data[], parent: ID = null): Node[] => {
    return nodes
        .filter((node: Data) => node.parent === parent)
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
    ...(!(node.children.length > 0) && { value: 1 }),
});

export class Visual implements IVisual {
    private events: IVisualEventService;
    private host: IVisualHost;
    private div: HTMLElement;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.div = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        // @ts-expect-error
        const colorPalette: IColorPalette = this.host.colorPalette;

        this.div.replaceChildren();

        const {
            viewport: { width, height },
        } = options;
        const dataView: DataView = options.dataViews[0];
        const {
            table: { columns, rows },
        } = dataView;
        const roles: string[] = columns.map(
            ({ roles }) => Object.keys(roles)[0],
        );

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

        Sunburst()
            // .data(mock)
            .data(dataRoot)
            .width(width)
            .height(height)
            .color((d) => colorPalette.getColor(d.name).value)
            .labelOrientation('angular')(this.div);

        setTimeout(
            () =>
                document
                    .querySelectorAll('.sunburst-viz .angular-label')
                    .forEach((el: HTMLElement) => (el.style.fontSize = '1px')),
            0,
        );

        this.events.renderingFinished(options);
    }
}
