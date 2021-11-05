import React from "react";
import * as d3 from "d3";
import { connect, ConnectedProps } from "react-redux";
import { Action } from "./store/actions";
import { RootState } from "./store";

const mapState = (state: RootState) => ({
  currentChangepoint: {
    changepoint: state.changepoints?.changepoint,
    tag: state.changepoints?.tag,
  },
});

const mapDispatch = {
  incrementLoading: () => ({
    type: Action.IncrementLoading,
  }),
  decrementLoading: () => ({
    type: Action.DecrementLoading,
  }),
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

enum AttentionType {
  Increase,
  Decrease,
}

type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type BarPlotProps = {
  id: string;
  color: string;
  typ: AttentionType;
  height: number;
  margins: Margins;
};

type TopicViews = { topic: string; views: number };

type BarPlotState = {
  data: TopicViews[];
};

type TestCols = "Country" | "Value";

class BarPlot extends React.Component<BarPlotProps, BarPlotState> {
  container!: d3.Selection<HTMLDivElement, any, HTMLElement, any>;
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
  bounds!: d3.Selection<SVGGElement, any, HTMLElement, any>;

  constructor(props: BarPlotProps) {
    super(props);
    this.state = {
      data: [],
    };
  }

  update = (animated: boolean = false) => {
    console.log("update barplots");
    const bbox = this.container?.node()?.getBoundingClientRect();
    const width = bbox?.width ?? 0;
    this.svg.attr("width", width).attr("height", this.props.height);
    this.bounds.attr(
      "transform",
      `translate(${this.props.margins.left}, ${this.props.margins.top})`
    );
    this.bounds
      .select(".xLabelBar")
      .attr(
        "x",
        (width - this.props.margins.left - this.props.margins.right) / 2
      )
      .attr("y", this.props.height - this.props.margins.top - 10);

    // calculate extent
    const xExtent = d3.extent(this.state.data, (d) => d.views) as [
      number,
      number
    ];

    // X axis
    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([0, width - this.props.margins.left - this.props.margins.right]);

    this.bounds
      .selectAll<SVGGElement, any>(".xAxis")
      .attr(
        "transform",
        `translate(0, ${
          this.props.height - this.props.margins.bottom - this.props.margins.top
        })`
      )
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    const yScale = d3
      .scaleBand()
      .range([
        0,
        this.props.height - this.props.margins.bottom - this.props.margins.top,
      ])
      .domain(this.state.data.map((d) => d.topic))
      .padding(0.1);

    this.bounds
      .selectAll<SVGGElement, any>(".yAxis")
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("text-anchor", "end");

    //Bars
    const bars = this.bounds
      .selectAll<SVGRectElement, TopicViews>(".bar")
      .data<TopicViews>(this.state.data);

    bars.exit().remove();
    const newBar = bars.enter().append("g").attr("class", "bar");

    newBar.append("rect");
    newBar.append("text");

    const updated = this.bounds.selectAll<SVGRectElement, TopicViews>(".bar");

    updated
      .select("rect")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.topic) ?? 0)
      .attr("fill", this.props.color)
      .attr("height", yScale.bandwidth())
      .attr("width", (d) => 0);

    updated
      .select("text")
      .attr("class", "barLabel")
      .attr("opacity", 0)
      .style("font-size", "12px")
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("x", 0)
      .attr("y", (d) => (yScale(d.topic) ?? 0) + 0.5 * yScale.bandwidth())
      .text("test");

    const animation = this.bounds
      .selectAll<SVGRectElement, TopicViews>(".bar")
      .transition()
      .duration(animated ? 800 : 0)
      .delay((d, i) => (animated ? i * 100 : 0));

    animation.select("rect").attr("width", (d) => Math.abs(xScale(d.views)));

    animation
      .select("text")
      .attr("opacity", (d) => (Math.abs(xScale(d.views)) > 30 ? 1 : 0))
      .attr("x", (d) => Math.abs(xScale(d.views)) - 5);
  };

  addBarPlot = () => {
    this.container = d3.select<HTMLDivElement, any>(
      `#barplot-${this.props.id}-container`
    );

    this.svg = this.container.append("svg");
    this.bounds = this.svg.append("g");

    // add axis
    this.bounds.append("g").attr("class", "xAxis");

    this.bounds
      .append("text")
      .attr("class", "xLabelBar")
      .style("font-size", 15)
      .attr("text-anchor", "middle")
      .text("absolute difference page views");

    this.bounds.append("g").attr("class", "yAxis");

    d3.csv<TestCols>(
      "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/7_OneCatOneNum_header.csv"
    ).then((data) => {
      this.setState({
        data: data.map((d) => {
          return { topic: d.Country ?? "missing", views: Number(d.Value) ?? 0 };
        }),
      });
      this.update(true);
    });

    const resize = () => {
      console.log("bar resize");
      this.update();
    };
    window.addEventListener("resize", resize);
  };

  componentDidMount() {
    this.addBarPlot();
    this.update(true);
  }

  render() {
    return (
      <div>
        <div id={`barplot-${this.props.id}-container`}></div>
      </div>
    );
  }
}

interface TopicAttentionProps extends PropsFromRedux {}

type TopicAttentionState = {};

class TopicAttention extends React.Component<
  TopicAttentionProps,
  TopicAttentionState
> {
  margins = { top: 30, right: 30, bottom: 60, left: 100 };
  height = 400;

  constructor(props: TopicAttentionProps) {
    super(props);
    this.state = {};
  }

  componentDidUpdate(
    prevProps: TopicAttentionProps,
    prevState: TopicAttentionState
  ) {
    if (this.props.currentChangepoint !== prevProps.currentChangepoint) {
      // todo: load data here
      // set the data as prop for the two bar plots
      console.log(
        "would load changepoint",
        this.props.currentChangepoint,
        "here now"
      );
    }
  }

  render() {
    return (
      <div className="flex">
        <div id="barplot-increase-container" className="w-1/2 inline-block">
          <BarPlot
            id="inc"
            height={this.height}
            color="#34D399"
            margins={this.margins}
            typ={AttentionType.Increase}
          />
        </div>
        <div id="barplot-decrease-container" className="w-1/2 inline-block">
          <BarPlot
            id="dec"
            color="#F87171"
            height={this.height}
            margins={this.margins}
            typ={AttentionType.Decrease}
          />
        </div>
      </div>
    );
  }
}

export default connector(TopicAttention);
