export const mock = {
    name: 'root',
    children: [
        {
            name: 'leafA',
            value: 3,
        },
        {
            name: 'nodeB',
            children: [
                {
                    name: 'leafBA',
                    value: 5,
                },
                {
                    name: 'leafBB',
                    value: 1,
                },
            ],
        },
    ],
};
