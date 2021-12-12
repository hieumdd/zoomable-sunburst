'use strict';

// babel ^7.6
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// powerbi
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.IVisualHost;

import * as d3 from 'd3';
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;
import Sunburst from 'sunburst-chart';
import { mock } from './mock';

type ID = number | null;
type Data = {
    id: ID;
    parent: ID;
    name: string;
};

type Node = {
    id: ID;
    name: string;
    parent: ID;
    children?: Node[];
};

const buildTree = (nodes: Node[], parent: ID = null): Node[] => {
    return nodes
        .filter((node: Node) => node.parent === parent)
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

const transformNode = (node) => {
    if (node.children.length > 0) {
        return {
            name: node.name,
            children: node.children.map((child) => transformNode(child)),
        };
    } else {
        return {
            name: node.name,
            value: 1,
        };
    }
};

const color = d3.scaleOrdinal(d3.schemeAccent);

export class Visual implements IVisual {
    private host: IVisualHost;
    private div: HTMLElement;

    constructor(options: VisualConstructorOptions) {
        this.div = options.element;
    }

    public update(options: VisualUpdateOptions) {
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
        console.log(dataRoot);
        Sunburst()
            // .data(mock)
            .data(dataRoot)
            .width(width)
            .height(height)
            .color((d) => color(d.name))(this.div);
    }
}
