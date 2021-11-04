import React from "react";
import * as d3 from "d3";
import { connect, ConnectedProps } from "react-redux";
import { Action } from "./store/actions";
import { RootState } from "./store";

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

type Changepoints = string[];

type CountryStringency = {
  changepoints: Changepoints;
  country: Country;
  stringency: Stringency[];
};

type CountryTopicAttention = {
  // todo
};

const mapState = (state: RootState) => ({
  currentChangepoint: state.changepoints?.changepoint,
});

const mapDispatch = {
  selectChangepoint: (changepoint: string | undefined) => ({
    type: Action.SelectChangepoint,
    payload: {
      changepoint,
    },
  }),
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface TimelineProps extends PropsFromRedux {}

type TimelineState = {
  loading: boolean;
  stringencies: { [key: Tag]: CountryStringency };
  topics: { [key: Tag]: CountryTopicAttention };
  notes: string[];
};

const sameDate = (d1: Date | null, d2: Date | null): boolean => {
  if (d1 === null || d2 === null) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

class Timeline extends React.Component<TimelineProps, TimelineState> {
  container!: d3.Selection<HTMLDivElement, any, HTMLElement, any>;
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
  bounds!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  listeningRect!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
  xAxis!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  yAxis!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  xScale!: d3.ScaleTime<number, number>;
  yScale!: d3.ScaleLinear<number, number>;
  hoverLine!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
  hoverLabel!: d3.Selection<SVGTextElement, any, HTMLElement, any>;
  hoverEnabled: boolean = true;

  constructor(props: TimelineProps) {
    super(props);
    this.state = {
      loading: true,
      data: [],
      notes: [],
    };
  }

  update = (data: CountryStringency) => {
    // const margin = { top: 10, right: 10, bottom: 10, left: 30 };
    // const width = 460;
    // const height = 300;
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
      .enter();

    changepointLines
      .append("rect")
      .attr("class", "changepoint")
      .attr("width", "5px")
      .attr("cursor", "pointer")
      .attr("fill", "black")
      .attr("opacity", "0.1")
      // .attr("height", 1000)
      // .attr("height", height - margin.top - margin.bottom)
      // .attr("y", (d) => {
      //   const cpStringency = data.stringency.filter((s) =>
      //     sameDate(new Date(d), xAccessor(s))
      //   );
      //   return this.yScale(yAccessor(cpStringency[0]));
      // })
      .attr("x", (d) => {
        return this.xScale(new Date(d));
      })
      .on("click", (event, d: string) => {
        const current = d3.select(event.currentTarget);
        if (
          this.props.currentChangepoint != undefined &&
          d !== this.props.currentChangepoint
        ) {
          // must deselect old one
          changepointLines.selectAll("rect").attr("opacity", "0.1");
        }
        const alreadySelected = d === this.props.currentChangepoint;
        current
          .classed("selected", !alreadySelected)
          .attr("opacity", (d) => (alreadySelected ? 0.1 : 0.5));
        this.props.selectChangepoint(alreadySelected ? undefined : d);
      })
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", (d) =>
          d === this.props.currentChangepoint ? 0.5 : 0.1
        );
      });

    // setup interactions
    // const listeningRect = this.bounds
    //   .append("rect")
    //   .attr("class", "listening-rect")
    //   .attr("width", width - margin.left - margin.right)
    //   .attr("height", height - margin.top - margin.bottom)
    //   .attr("fill", "transparent")

    this.listeningRect.on("click", (event, d) => {
      // toggle hovering to be able to read about restrictions
      this.hoverEnabled = !this.hoverEnabled;
    });

    this.listeningRect.on("mousemove", (event, d) => {
      if (!this.hoverEnabled) return;
      const [mouseX, mouseY] = d3.pointer(event);
      const hoveredDate: Date = this.xScale.invert(mouseX);
      this.hoverLabel.text(d3.timeFormat("%B %d, %Y")(hoveredDate));

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
    const margin = { top: 10, right: 10, bottom: 10, left: 30 };
    const height = 300;

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

    this.hoverLabel = this.bounds.append("svg:text");

    this.hoverLabel
      .text("")
      .style("text-anchor", "end")
      .style("fill", "black")
      .style("font-family", "Arial")
      .style("font-size", 15);

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

      // this.svg
      // const test = this.bounds.selectAll(".changepoint");
      const test = this.svg.selectAll(".changepoint");
      console.log(test);
      // .attr("height", height - margin.top - margin.bottom);
      // .select("rect")
      // console.log(test.length);

      this.listeningRect
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

      this.hoverLabel
        .attr("x", width - margin.top - margin.bottom - 50)
        .attr("y", height - margin.top - margin.bottom - 50);
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
    return (
      <div className="Timeline">
        <div className="" id="timeline-container"></div>
        <div className="notes h-20 px-2 overflow-y-scroll text-gray-500 text-xs">
          {this.state.notes}
        </div>
      </div>
    );
  }
}

export default connector(Timeline);
