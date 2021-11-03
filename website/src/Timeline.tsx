import React from "react";
import * as d3 from "d3";
// import DSVRowArray from

type TimelineProps = {};

type TimelineState = {
  data: string[];
};

type TestCols = "date" | "value";
type TestCols2 = {
  date: string;
  value: number;
};

export default class Timeline extends React.Component<
  TimelineProps,
  TimelineState
> {
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;

  constructor(props: TimelineProps) {
    super(props);
    this.state = {
      data: [],
    };
  }

  loadData = () => {
    // csv("vulnerability.csv").then((data) => {
    //   this.setState({
    //     data,
    //   });
    // });
  };

  addTimeline = () => {
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    this.svg = d3
      .select<SVGSVGElement, any>("#timeline")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const bounds = this.svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv<TestCols>(
      "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv"
    ).then((data: d3.DSVRowArray<TestCols>) => {
      type Data = d3.DSVRowString<TestCols>;

      const xAccessor = (d: Data) => d3.timeParse("%Y-%m-%d")(d?.date ?? "");
      const yAccessor = (d: Data) => Number(d?.value) ?? 0;

      const extent = d3.extent(data, (d) => {
        return xAccessor(d);
      }) as [Date, Date];

      // X axis
      const x = d3
        .scaleTime()
        .domain(extent)
        .range([0, width - margin.left - margin.right]);
      const xAxis = bounds
        .append("g")
        .attr(
          "transform",
          `translate(0, ${height - margin.bottom - margin.top})`
        )
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      // Y axis
      const yDomain = [
        0,
        d3.max(data, (d) => {
          return yAccessor(d);
        }) ?? 0,
      ];
      const y = d3
        .scaleLinear<number>()
        .domain(yDomain)
        .range([height - margin.top - margin.bottom, 0]);
      const yAxis = bounds.append("g").call(d3.axisLeft(y));

      const path = bounds
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr(
          "d",
          d3
            .line<Data>()
            .x((d) => {
              return x(xAccessor(d) ?? new Date(2020, 1, 1));
            })
            .y((d) => {
              return y(yAccessor(d) ?? 0);
            })
        );

      const xAxisLine = bounds
        .append("g")
        .append("rect")
        .attr("class", "dotted")
        .attr("stroke-width", "1px")
        .attr("width", ".5px")
        .attr("height", height - margin.top - margin.bottom);

      // setup interactions
      const listeningRect = bounds
        .append("rect")
        .attr("class", "listening-rect")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "transparent")
        .on("mousemove", (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event);
          const hoveredDate: Date = x.invert(mouseX);

          const getDistanceFromHoveredDate = (d: Data): number =>
            Math.abs((xAccessor(d)?.getTime() ?? 0) - hoveredDate.getTime());

          const closestIndex: number | undefined = d3.leastIndex(
            data,
            (a, b) =>
              getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
          );
          if (closestIndex !== undefined) {
            const closestDataPoint = data[closestIndex];
            const closestXValue = xAccessor(closestDataPoint);
            if (closestXValue !== null) {
              xAxisLine.attr("x", x(closestXValue));
            }
          }
        });
    });
  };

  componentDidMount() {
    this.addTimeline();
  }

  render() {
    return (
      <div>
        <div className="animate-spin h-5 w-5 mr-3 rounded-full border-b-2 border-gray-900"></div>
        <div id="timeline"></div>
      </div>
    );
  }
}
