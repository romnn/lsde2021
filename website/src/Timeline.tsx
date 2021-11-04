import React from "react";
import * as d3 from "d3";
// import DSVRowArray from

type TimelineProps = {};

type TimelineState = {
  loading: boolean;
  data: string[];
};

type TestCols = "date" | "value";
type Data = d3.DSVRowString<TestCols>;

export default class Timeline extends React.Component<
  TimelineProps,
  TimelineState
> {
  container!: d3.Selection<HTMLDivElement, any, HTMLElement, any>;
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
  bounds!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  xAxis!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  yAxis!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  // xScale!: d3.ScaleTime<Date, Date>;
  xScale!: d3.ScaleTime<number, number>;
  yScale!: d3.ScaleLinear<number, number>;
  hoverLine!: d3.Selection<SVGRectElement, any, HTMLElement, any>;

  constructor(props: TimelineProps) {
    super(props);
    this.state = {
      loading: true,
      data: [],
    };
  }

  update = (data: d3.DSVRowArray<TestCols>) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };
    const width = 460; //  - margin.left - margin.right;
    const height = 400; // - margin.top - margin.bottom;

    const xAccessor = (d: Data) => d3.timeParse("%Y-%m-%d")(d?.date ?? "");
    const yAccessor = (d: Data) => Number(d?.value) ?? 0;

    const extent = d3.extent(data, (d) => {
      return xAccessor(d);
    }) as [Date, Date];

    // X axis
    // this.xScale = d3
    //   .scaleTime()
    this.xScale.domain(extent);
    // .range([0, width - margin.left - margin.right]);

    // const xAxis = this.bounds
    //   .append("g")
    this.xAxis
      // .attr(
      //   "transform",
      //   `translate(0, ${height - margin.bottom - margin.top})`
      // )
      .call(d3.axisBottom(this.xScale))
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
    // const y = d3
    //   .scaleLinear<number>()
    //   .domain(yDomain)
    //   .range([height - margin.top - margin.bottom, 0]);
    this.yScale.domain(yDomain);
    // const yAxis = this.bounds.append("g").call(d3.axisLeft(y));
    this.yAxis.call(d3.axisLeft(this.yScale));

    const path = this.bounds
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
            return this.xScale(xAccessor(d) ?? new Date(2020, 1, 1));
          })
          .y((d) => {
            return this.yScale(yAccessor(d) ?? 0);
          })
      );

    // this.hoverLine = this.bounds
    //   .append("g")
    //   .append("rect")
    //   .attr("class", "dotted")
    //   .attr("stroke-width", "1px")
    //   .attr("width", ".5px");
    // this.hoverLine
    //   .attr("height", height - margin.top - margin.bottom);

    const changepointLines = this.bounds
      .selectAll(".changepoint")
      .data(data.slice(0, 10))
      .enter()
      .append("g")
      .classed("changepoint", true);

    changepointLines
      .append("rect")
      .attr("class", "changepoint")
      .attr("stroke-width", "2px")
      .attr("width", "1px")
      .attr("fill", "red")
      .attr("height", height - margin.top - margin.bottom)
      .attr("x", (d) => {
        // console.log(d);
        return this.xScale(xAccessor(d) ?? new Date(2020, 1, 1));
      });

    // setup interactions
    const listeningRect = this.bounds
      .append("rect")
      .attr("class", "listening-rect")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .on("mousemove", (event, d) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const hoveredDate: Date = this.xScale.invert(mouseX);

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
            this.hoverLine.attr("x", this.xScale(closestXValue));
          }
        }
      });
  };

  addTimeline = () => {
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };
    // const width = 460; //  - margin.left - margin.right;
    const height = 400; // - margin.top - margin.bottom;

    this.container = d3.select<HTMLDivElement, any>("#timeline-container");
    this.svg = this.container.append("svg").attr("x", 0).attr("y", 0);
    // this.svg = d3.select<SVGSVGElement, any>("#timeline").append("svg");
    //
    this.bounds = this.svg.append("g");

    this.xScale = d3.scaleTime();
    this.xAxis = this.bounds.append("g");
    // const yDomain = [
    //   0,
    //   d3.max(data, (d) => {
    //     return yAccessor(d);
    //   }) ?? 0,
    // ];
    this.yScale = d3.scaleLinear<number>();
    // .domain(yDomain)
    // .range([height - margin.top - margin.bottom, 0]);
    this.yAxis = this.bounds.append("g");
    // .call(d3.axisLeft(y));

    this.hoverLine = this.bounds
      .append("g")
      .append("rect")
      .attr("class", "dotted")
      .attr("stroke-width", "1px")
      .attr("width", ".5px");

    // .attr(
    //   "transform",
    //   `translate(0, ${height - margin.bottom - margin.top})`
    // )
    // .call(d3.axisBottom(x))
    // .selectAll("text")
    // .attr("transform", "translate(-10,0)rotate(-45)")
    // .style("text-anchor", "end");

    const resize = () => {
      // d3 .select<HTMLDivElement, any>("#timeline-container")
      const bbox = this.container?.node()?.getBoundingClientRect();

      const width = bbox?.width ?? 0;
      // const height = bbox?.height ?? 0;
      this.svg.attr("width", width).attr("height", height);

      this.bounds.attr("transform", `translate(${margin.left}, ${margin.top})`);
      this.xAxis.attr(
        "transform",
        `translate(0, ${height - margin.bottom - margin.top})`
      );
      this.xScale.range([0, width - margin.left - margin.right]);
      this.yScale.range([height - margin.top - margin.bottom, 0]);

      this.hoverLine.attr("height", height - margin.top - margin.bottom);
    };

    d3.select(window).on("resize", resize);
    resize();
  };

  componentDidMount() {
    this.addTimeline();
    d3.csv<TestCols>(
      "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv"
    ).then((data: d3.DSVRowArray<TestCols>) => {
      this.update(data);
    });
  }

  render() {
    // <div className="flex justify-center items-center bg-green-300">
    //           </div>
    return (
      <div className="Timeline">
        <div className="" id="timeline-container"></div>
      </div>
    );
  }
}
