import React from "react";
import * as d3 from "d3";
import { connect, ConnectedProps } from "react-redux";
import { Action } from "./store/actions";
import { RootState } from "./store";
import { isSameDate, Country } from "./utils";

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

type TopicDiff = { topic: string; diff: number };

type Diff = {
  changepoint: Date;
  country: Country;
  topics: TopicDiff[];
};

type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type BarPlotProps = {
  data: TopicDiff[];
  id: string;
  color: string;
  typ: AttentionType;
  height: number;
  margins: Margins;
};

type BarPlotState = {};

class BarPlot extends React.Component<BarPlotProps, BarPlotState> {
  container!: d3.Selection<HTMLDivElement, any, HTMLElement, any>;
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
  bounds!: d3.Selection<SVGGElement, any, HTMLElement, any>;

  constructor(props: BarPlotProps) {
    super(props);
    this.state = {};
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

    const data = this.props.data.sort((x, y) => {
      return d3.descending(x.diff, y.diff);
    });

    // calculate extent
    let xExtent = d3.extent(data, (d) => d.diff) as [number, number];
    if (this.props.typ === AttentionType.Decrease) {
      xExtent = [xExtent[1], xExtent[0]];
    }

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
      .domain(data.map((d) => d.topic))
      .padding(0.1);

    this.bounds
      .selectAll<SVGGElement, any>(".yAxis")
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("text-anchor", "end");

    // Bars
    const bars = this.bounds
      .selectAll<SVGRectElement, TopicDiff>(".bar")
      .data<TopicDiff>(data);

    bars.exit().remove();
    const newBar = bars.enter().append("g").attr("class", "bar");

    newBar.append("rect");
    newBar.append("text");

    const updated = this.bounds.selectAll<SVGRectElement, TopicDiff>(".bar");

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
      .text(""); // todo: show percentual increase?

    const animation = this.bounds
      .selectAll<SVGRectElement, TopicDiff>(".bar")
      .transition()
      .duration(animated ? 800 : 0)
      .delay((d, i) => (animated ? i * 100 : 0));

    animation.select("rect").attr("width", (d) => xScale(d.diff));

    animation
      .select("text")
      .attr("opacity", (d) => (Math.abs(xScale(d.diff)) > 30 ? 1 : 0))
      .attr("x", (d) => xScale(d.diff));
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

    const resize = () => {
      console.log("bar resize");
      this.update();
    };
    window.addEventListener("resize", resize);
  };

  componentDidUpdate(prevProps: BarPlotProps, prevState: BarPlotState) {
    if (
      this.props.data.length !== prevProps.data.length ||
      this.props.data.some(
        (v, i) =>
          v.topic !== prevProps.data[i].topic ||
          v.diff !== prevProps.data[i].diff
      )
    ) {
      this.update(true);
    }
  }

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

type TopicAttentionState = {
  increased: Diff | undefined;
  decreased: Diff | undefined;
};

class TopicAttention extends React.Component<
  TopicAttentionProps,
  TopicAttentionState
> {
  margins = { top: 30, right: 30, bottom: 60, left: 175 };
  height = 400;

  constructor(props: TopicAttentionProps) {
    super(props);
    this.state = {
      increased: undefined,
      decreased: undefined,
    };
  }

  loadData<D>(url: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this.props.incrementLoading();
      d3.json<D>(url)
        .then((data) => {
          if (data === undefined) return reject();
          resolve(data);
        })
        .finally(() => this.props.decrementLoading());
    });
  }

  componentDidUpdate(
    prevProps: TopicAttentionProps,
    prevState: TopicAttentionState
  ) {
    if (
      !isSameDate(
        this.props.currentChangepoint.changepoint,
        prevProps.currentChangepoint.changepoint
      ) ||
      this.props.currentChangepoint.tag?.title !==
        prevProps.currentChangepoint.tag?.title
    ) {
      const { tag, changepoint } = this.props.currentChangepoint;
      if (tag === null || tag === undefined) return;
      if (changepoint === null || changepoint === undefined) return;

      const fmtDate = d3.timeFormat("%Y-%-m-%-d");
      const lang = tag.lang.toLowerCase();
      const country = tag.country.toLowerCase();
      const baseUrl = `data/${lang}/${country}/changepoints`;

      const increasedUrl = `${baseUrl}/did_${fmtDate(
        changepoint
      )}_increased.json`;

      const decreasedUrl = `${baseUrl}/did_${fmtDate(
        changepoint
      )}_decreased.json`;

      this.loadData<Diff>(increasedUrl).then((increased) => {
        this.loadData<Diff>(decreasedUrl).then((decreased) => {
          this.setState((state) => {
            return {
              ...state,
              increased,
              decreased,
            };
          });
        });
      });
    }
  }

  render() {
    return (
      <div className="flex">
        <div id="barplot-increase-container" className="w-1/2 inline-block">
          <BarPlot
            data={this.state.increased?.topics ?? []}
            id="inc"
            height={this.height}
            color="#34D399"
            margins={this.margins}
            typ={AttentionType.Increase}
          />
        </div>
        <div id="barplot-decrease-container" className="w-1/2 inline-block">
          <BarPlot
            data={this.state.decreased?.topics ?? []}
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
