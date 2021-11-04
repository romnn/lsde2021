import React from "react";
import * as d3 from "d3";
// import DSVRowArray from

type TimelineProps = {};

type TimelineState = {
  loading: boolean;
  data: string[];
  notes: string[];
};

type Stringency = {
  Date: string;
  StringencyIndex: number;
  Notes: string[];
};

type Country = {
  code: string;
  group: string;
  name: string;
};

type Changepoints = {
  changepoints: string[];
  country: Country;
  stringency: Stringency[];
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
  listeningRect!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
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
      notes: [],
    };
  }

  update = (data: Changepoints) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };
    const width = 460; //  - margin.left - margin.right;
    const height = 400; // - margin.top - margin.bottom;
    // ("%Y-%m-%d")
    const xAccessor = (d: Stringency): Date | null => {
      // console.log(d?.Date);
      // console.log(Object.keys(d[0]));
      // debugger;
      return new Date(d?.Date);
    };
    const yAccessor = (d: Stringency) => Number(d.StringencyIndex);

    const extent = d3.extent(data.stringency, (d) => {
      return xAccessor(d);
    }) as [Date, Date];
    console.log(extent);

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
      d3.max(data.stringency, (d) => {
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
      .datum(data.stringency)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line<Stringency>()
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
      .data(data.changepoints)
      .enter()
      .append("g")
      .classed("changepoint", true);

    changepointLines
      // .append("path")
      // .style("stroke-dasharray", ("3, 3"))
      // .attr(
      //   "d",
      //   d3
      //     .line<Changepoint>()
      //     .x((d) => {
      //       return this.xScale(xAccessor(d) ?? new Date(2020, 1, 1));
      //     })
      //     .y((d) => {
      //       return this.yScale(yAccessor(d) ?? 0);
      //     })
      // );
      .append("rect")
      .attr("class", "changepoint")
      .attr("width", "5px")
      .attr("cursor", "pointer")
      .attr("fill", "black")
      .attr("opacity", "0.1")
      .attr("height", height - margin.top - margin.bottom)
      // .attr("height", (d) => this.yScale(height - margin.top - margin.bottom)
      .attr("x", (d) => {
        return this.xScale(new Date(d));
      })
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("fill", "orange")
          .attr("opacity", "0.8");
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("fill", "black")
          .attr("opacity", "0.1");
      });

    // setup interactions
    // const listeningRect = this.bounds
    //   .append("rect")
    //   .attr("class", "listening-rect")
    //   .attr("width", width - margin.left - margin.right)
    //   .attr("height", height - margin.top - margin.bottom)
    //   .attr("fill", "transparent")
    this.listeningRect.on("mousemove", (event, d) => {
      const [mouseX, mouseY] = d3.pointer(event);
      const hoveredDate: Date = this.xScale.invert(mouseX);

      const getDistanceFromHoveredDate = (d: Stringency): number =>
        Math.abs((xAccessor(d)?.getTime() ?? 0) - hoveredDate.getTime());

      // const getDistanceFromHoveredDate = (d: Stringency): number =>
      //   Math.abs((xAccessor(d)?.getTime() ?? 0) - hoveredDate.getTime());

      const closestIndex: number | undefined = d3.leastIndex(
        data.stringency,
        (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      if (closestIndex !== undefined) {
        const closestDataPoint = data.stringency[closestIndex];
        const closestXValue = xAccessor(closestDataPoint);
        if (closestXValue !== null) {
          this.hoverLine.attr("x", this.xScale(closestXValue));
        }
      }

      const stringencyWithNotes = data.stringency.filter(
        (d) => d.Notes.length > 0
      );
      const closestIndexWithNotes: number | undefined = d3.leastIndex(
        stringencyWithNotes,
        (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      if (closestIndexWithNotes !== undefined) {
        const closestDataPoint = stringencyWithNotes[closestIndexWithNotes];
        this.setState({
          notes: [
            ...new Set(
              closestDataPoint?.Notes.map((n) => {
                const stripped = n.replace(
                  /(\(?\s*(Sources?:\s*)?(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)\s*)+\)?)/gim,
                  " [...] "
                );
                // console.log(n);
                // console.log(stripped);
                return stripped;
              }) ?? []
            ),
          ],
        });
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

    this.listeningRect = this.bounds
      .append("rect")
      .attr("class", "listening-rect")
      .attr("fill", "transparent");
    // .on("mousemove", (event, d) => {
    //   const [mouseX, mouseY] = d3.pointer(event);
    //   const hoveredDate: Date = this.xScale.invert(mouseX);

    //   const getDistanceFromHoveredDate = (d: Stringency): number =>
    //     Math.abs((xAccessor(d)?.getTime() ?? 0) - hoveredDate.getTime());

    //   const closestIndex: number | undefined = d3.leastIndex(
    //     data.stringency,
    //     (a, b) =>
    //       getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
    //   );
    //   if (closestIndex !== undefined) {
    //     const closestDataPoint = data.stringency[closestIndex];
    //     const closestXValue = xAccessor(closestDataPoint);
    //     if (closestXValue !== null) {
    //       this.hoverLine.attr("x", this.xScale(closestXValue));
    //     }
    //   }
    // });

    // this.changepointLines = this.bounds
    //   .append("g")
    //   .append("rect")
    //   .attr("class", "dotted")
    //   .attr("stroke-width", "1px")
    //   .attr("width", ".5px");

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

      this.listeningRect
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

      this.hoverLine.attr("height", height - margin.top - margin.bottom);
    };

    d3.select(window).on("resize", resize);
    resize();
  };

  componentDidMount() {
    this.addTimeline();
    d3.json<Changepoints>("data/de/Germany/stringency_changepoints.json").then(
      (data) => {
        if (data === undefined) return;
        this.update(data);
      }
    );
    // d3.csv<TestCols>(
    //   "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv"
    // ).then((data: d3.DSVRowArray<TestCols>) => {
    //   this.update(data);
    // });
  }

  render() {
    // <div className="flex justify-center items-center bg-green-300">
    //           </div>
    return (
      <div className="Timeline">
        <div className="" id="timeline-container"></div>
        <div className="notes text-xs">{this.state.notes}</div>
      </div>
    );
  }
}
