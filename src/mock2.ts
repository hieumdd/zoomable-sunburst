export const data = {
  name: "main",
  color: "magenta",
  children: [
    {
      name: "a",
      color: "yellow",
      size: 1,
    },
    {
      name: "b",
      color: "red",
      children: [
        {
          name: "ba",
          color: "orange",
          size: 1,
        },
        {
          name: "bb",
          color: "blue",
          children: [
            {
              name: "bba",
              color: "green",
              size: 1,
            },
            {
              name: "bbb",
              color: "pink",
              size: 1,
            },
          ],
        },
      ],
    },
  ],
};
