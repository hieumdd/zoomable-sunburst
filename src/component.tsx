import * as React from "react";
import Sunburst from "react-d3-zoomable-sunburst";

export interface State {
  data: Object;
  size: number;
}

export const initialState: State = {
  data: {},
  size: 200,
};

export class ZoomableSunburst extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = initialState;
  }

  onSelect(event) {
    console.log(event);
  }

  private static updateCallback: (data: object) => void = null;

  public static update(newState: State) {
    if (typeof ZoomableSunburst.updateCallback === "function") {
      ZoomableSunburst.updateCallback(newState);
    }
  }

  public state: State = initialState;

  public componentWillMount() {
    ZoomableSunburst.updateCallback = (newState: State): void => {
      this.setState(newState);
    };
  }

  public componentWillUnmount() {
    ZoomableSunburst.updateCallback = null;
  }

  render() {
    const { data, size } = this.state;
    const style: React.CSSProperties = { width: size, height: size };
    return (
      // <div>
      //   {JSON.stringify(data)}
      // </div>
      <Sunburst
        data={data}
        scale="exponential"
        tooltip
        tooltipPosition="right"
        keyId="Sunburst"
        value={`minSize`}
        width={style.width}
        height={style.height}
      />
    );
  }
}
