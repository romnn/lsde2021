import React from "react";
import * as d3 from "d3";
import { connect, ConnectedProps } from "react-redux";
import { Action } from "./store/actions";
import { Tag, TagType } from "./store/reducers/tags";
import { RootState } from "./store";
import { isSameDate } from "./utils";

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
  country: Country;
  changepoints: Changepoints;
  stringency: Stringency[];
};

type CountryTopicAttention = {
  country: Country;
  traffic: {
    date: string;
    page_views: number;
  };
};

const mapState = (state: RootState) => ({
  activeTags: state.tags.activeTags,
  currentChangepoint: state.changepoints?.changepoint,
});

const mapDispatch = {
  selectChangepoint: (changepoint: Date | undefined) => ({
    type: Action.SelectChangepoint,
    payload: {
      changepoint,
    },
  }),
  incrementLoading: () => ({
    type: Action.IncrementLoading,
  }),
  decrementLoading: () => ({
    type: Action.DecrementLoading,
  }),
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface TimelineProps extends PropsFromRedux {}

type TimelineState = {
  stringencies: Map<string, CountryStringency>;
  topics: Map<string, CountryTopicAttention>;
  notes: string[];
};

class Timeline extends React.Component<TimelineProps, TimelineState> {
  container!: d3.Selection<HTMLDivElement, any, HTMLElement, any>;
  svg!: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
  bounds!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  listeningRect!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
  xScale!: d3.ScaleTime<number, number>;
  xAxis!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  yAxisStringency!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  yAxisPageViews!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  yScaleStringency!: d3.ScaleLinear<number, number>;
  yScalePageViews!: d3.ScaleLinear<number, number>;
  hoverLine!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
  hoverLabel!: d3.Selection<SVGTextElement, any, HTMLElement, any>;

  hoverEnabled: boolean = true;
  margin = { top: 10, right: 10, bottom: 35, left: 30 };
  height = 300;

  constructor(props: TimelineProps) {
    super(props);
    this.state = {
      stringencies: new Map<string, CountryStringency>(),
      topics: new Map<string, CountryTopicAttention>(),
      notes: [],
    };
  }

  update = (animated: boolean = false) => {
    console.log("update");
    const bbox = this.container?.node()?.getBoundingClientRect();
    const width = bbox?.width ?? 0;

    this.svg.attr("width", width).attr("height", this.height);
    this.bounds.attr(
      "transform",
      `translate(${this.margin.left}, ${this.margin.top})`
    );

    type ChangepointGraph = { date: Date; id: string };
    type StringencyGraph = {
      id: string;
      stringency: {
        date: Date;
        value: number;
      }[];
      changepoints: ChangepointGraph[];
    };

    const stringencies: StringencyGraph[] = Array.from(
      this.state.stringencies.entries()
    ).map(([tag, s]) => {
      return {
        id: tag,
        stringency: s.stringency.map((d) => {
          return {
            date: new Date(d?.Date),
            value: Number(d.StringencyIndex),
          };
        }),
        changepoints: s.changepoints.map((d) => {
          return { date: new Date(d), id: tag };
        }),
      };
    });

    const color = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(stringencies.map((s) => s.id));

    const xExtent: [Date, Date] = [
      d3.min(stringencies, (s) => d3.min(s.stringency, (d) => d.date)),
      d3.max(stringencies, (s) => d3.max(s.stringency, (d) => d.date)),
    ] as [Date, Date];

    const yExtentStringency: [number, number] = [
      d3.min(stringencies, (s) => d3.min(s.stringency, (d) => d.value)),
      d3.max(stringencies, (s) => d3.max(s.stringency, (d) => d.value)),
    ] as [number, number];

    const xScale = d3
      .scaleTime()
      .range([0, width - this.margin.left - this.margin.right])
      .domain(xExtent);

    const yScaleStringency = d3
      .scaleLinear<number>()
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .domain(yExtentStringency);

    this.bounds
      .selectAll<SVGGElement, any>(".xAxis")
      .attr(
        "transform",
        `translate(0, ${this.height - this.margin.bottom - this.margin.top})`
      )
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    this.bounds
      .selectAll<SVGGElement, any>(".yAxisStringency")
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisLeft(yScaleStringency))
      .selectAll("text")
      .style("text-anchor", "end");

    // console.log(stringencies.map((s) => s.id));

    const stringenciesProj = this.bounds
      .selectAll<SVGGElement, StringencyGraph>(".stringency")
      .data(stringencies, (s) => s.id);

    stringenciesProj.exit().remove();
    const stringenciesProjContainer = stringenciesProj
      .enter()
      .append("g")
      .attr("class", (s) => `stringency ${s.id}`);

    stringenciesProjContainer.append("path").attr("class", "line");

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScaleStringency(d.value));

    const lineID = (title: string) => {
      return title.toLowerCase().replaceAll(":", "-");
    };

    this.bounds
      .selectAll<SVGPathElement, StringencyGraph>(".line")
      .attr("stroke-dasharray", "3, 3")
      .attr("fill", "none")
      .attr("id", (d, i) => lineID(d.id))
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("d", (d, i) => {
        return line(d.stringency);
      })
      .style("stroke", (d) => color(d.id));

    const changepoints = stringenciesProjContainer
      .append("g")
      .attr("class", "changepoints")
      .selectAll<SVGRectElement, ChangepointGraph>(".changepoint")
      .data<ChangepointGraph>((d) => d.changepoints);

    changepoints.exit().remove();
    changepoints.enter().append("rect").attr("class", "changepoint");

    this.bounds
      .selectAll<SVGRectElement, ChangepointGraph>(".changepoint")
      .attr("width", "5px")
      .attr("cursor", "pointer")
      .attr("fill", (d) => color(d.id))
      .attr("opacity", "0.1")
      .attr("height", this.height - this.margin.top - this.margin.bottom)
      // .attr("y", (d) => {
      //   const cpStringency = data.stringency.filter((s) =>
      //     sameDate(new Date(d), xAccessor(s))
      //   );
      //   return this.yScale(yAccessor(cpStringency[0]));
      // })
      .attr("x", (d) => {
        return xScale(d.date);
      })
      .on("click", (event, d) => {
        const current = d3.select(event.currentTarget);
        if (
          this.props.currentChangepoint != undefined &&
          !isSameDate(d.date, this.props.currentChangepoint)
        ) {
          // must deselect old one
          d3.selectAll<SVGRectElement, StringencyGraph>(".changepoint").attr(
            "opacity",
            0.1
          );
        }
        const alreadySelected = isSameDate(
          d.date,
          this.props.currentChangepoint
        );
        current
          .classed("selected", !alreadySelected)
          .attr("opacity", (d) => (alreadySelected ? 0.1 : 0.5));
        this.props.selectChangepoint(alreadySelected ? undefined : d.date);
      })
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        d3.select<SVGRectElement, any>(event.currentTarget).attr(
          "opacity",
          (d) => (d.date === this.props.currentChangepoint ? 0.5 : 0.1)
        );
      });

    d3.selectAll<SVGPathElement, StringencyGraph>(".line").each((d, i) => {
      var totalLength =
        d3
          .select<SVGPathElement, StringencyGraph>("#" + lineID(d.id))
          ?.node()
          ?.getTotalLength() ?? width;

      d3.selectAll("#" + lineID(d.id))
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(animated ? 1000 : 0)
        .delay(animated ? 100 * (i + 0) : 0)
        .ease(d3.easeQuad)
        .attr("stroke-dashoffset", 0);
    });

    return;

    const flatX: Date[] = [];
    const flatStringencyY: number[] = [];

    // define accessors
    const xAccessorStringency = (d: Stringency): Date | null => {
      return new Date(d?.Date);
    };
    const yAccessorStringency = (d: Stringency) => Number(d.StringencyIndex);

    for (let [tag, s] of this.state.stringencies.entries()) {
      flatX.push(
        ...s.stringency.map(
          (d) => xAccessorStringency(d) ?? new Date(2020, 1, 1)
        )
      );

      flatStringencyY.push(...s.stringency.map((d) => yAccessorStringency(d)));
    }

    // compute the extents for x and y
    const extentX = d3.extent(flatX) as [Date, Date];
    this.xScale.domain(extentX);

    this.svg
      .selectAll<SVGGElement, any>(".xAxis")
      .transition()
      .duration(100)
      .call(d3.axisBottom(this.xScale))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    const yDomainStringency = [0, d3.max(flatStringencyY) ?? 0];
    this.yScaleStringency.domain(yDomainStringency);
    this.yAxisStringency.call(d3.axisLeft(this.yScaleStringency));

    // set the colour scale
    // var color = d3.scaleOrdinal(d3.schemeCategory10);

    for (let [tag, s] of this.state.stringencies.entries()) {
      // update the stringency
      const line = d3
        .line<Stringency>()
        .curve(d3.curveBasis)
        // .x(0).y(0);
        .x((d) => {
          return this.xScale(xAccessorStringency(d) ?? new Date(2020, 1, 1));
        })
        .y((d) => {
          return this.yScaleStringency(yAccessorStringency(d) ?? 0);
        });

      const path = this.bounds
        .append("path")
        .attr("class", "line")
        .datum(s.stringency)
        .attr("id", tag)
        .attr("fill", "none")
        .attr("stroke", color(tag))
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3, 3")
        .attr("data-legend", tag)
        .attr("d", line);

      this.bounds
        .selectAll(".line")
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // add a legend
      this.bounds
        .append("text")
        // .attr("x", (legendSpace/2)+i*legendSpace)  // space legend
        // .attr("y", height + (margin.bottom/2)+ 5)
        .attr("class", "legend")
        .style("fill", color(tag))
        .text(tag);

      // update the changepoints
      const changepointLines = this.bounds
        .selectAll<SVGRectElement, any>(".changepoint")
        .data<string>(s.changepoints)
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
          return this.xScale(new Date(d ?? ""));
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
          // this.props.selectChangepoint(alreadySelected ? undefined : d);
        })
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("opacity", 0.5);
        })
        .on("mouseout", (event, d) => {
          d3.select(event.currentTarget).attr("opacity", (d) =>
            d === this.props.currentChangepoint ? 0.5 : 0.1
          );
        });

      //
      // const yDomain = [
      // 0,
      // d3.max(data.stringency, (d) => {
      //   return yAccessor(d);
      // }) ?? 0,
      // ];
    }

    // const legend = svg
    //   .append("g")
    //   .attr("class", "legend")
    //   .attr("transform", "translate(50,30)")
    //   .style("font-size", "12px")
    //   .call(d3.legend);

    // const extent = d3.extent(flatX) as [Date, Date];
    // const extent = d3.extent(s.stringency, (d) => {
    //   return xAccessor(d);
    // }) as [Date, Date];

    this.listeningRect.on("click", (event, d) => {
      // toggle hovering to be able to read about restrictions
      this.hoverEnabled = !this.hoverEnabled;
    });

    this.listeningRect.on("mousemove", (event, d) => {
      if (!this.hoverEnabled) return;
      const [mouseX, mouseY] = d3.pointer(event);
      const hoveredDate: Date = this.xScale.invert(mouseX);
      this.hoverLabel.text(d3.timeFormat("%B %d, %Y")(hoveredDate));

      if (this.state.stringencies.size !== 1) return;

      const getDistanceFromHoveredDate = (d: Stringency): number =>
        Math.abs(
          (xAccessorStringency(d)?.getTime() ?? 0) - hoveredDate.getTime()
        );

      // we choose the first one
      const firstStringency: Stringency[] = this.state.stringencies
        .values()
        .next().value.stringency;
      const closestIndex: number | undefined = d3.leastIndex<Stringency>(
        firstStringency,
        (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      if (closestIndex !== undefined) {
        const closestDataPoint = firstStringency[closestIndex];
        const closestXValue = xAccessorStringency(closestDataPoint);
        if (closestXValue !== null) {
          this.hoverLine.attr("x", this.xScale(closestXValue));
        }
      }

      const stringencyWithNotes = firstStringency.filter(
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
                return stripped;
              }) ?? []
            ),
          ],
        });
      }
    });
  };

  addTimeline = () => {
    this.container = d3.select<HTMLDivElement, any>("#timeline-container");
    this.svg = this.container.append("svg").attr("x", 0).attr("y", 0);
    this.bounds = this.svg.append("g");

    this.xScale = d3.scaleTime();
    this.xAxis = this.bounds.append("g").attr("class", "xAxis");

    this.yScaleStringency = d3.scaleLinear<number>();
    this.yScalePageViews = d3.scaleLinear<number>();
    this.yAxisStringency = this.bounds
      .append("g")
      .attr("class", "yAxisStringency");
    this.yAxisPageViews = this.bounds
      .append("g")
      .attr("class", "yAxisPageViews");

    this.bounds
      .append("text")
      .attr("class", "yLabelStringency")
      .attr("text-anchor", "end")
      .attr("y", 0)
      .attr("dy", "1em")
      .attr("transform", "rotate(-90)")
      .text("stringency index");

    this.listeningRect = this.bounds
      .append("rect")
      .attr("class", "listening-rect")
      .attr("fill", "transparent");

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

    const resize = () => {
      this.update();
      return;
      const bbox = this.container?.node()?.getBoundingClientRect();

      const width = bbox?.width ?? 0;
      this.svg.attr("width", width).attr("height", this.height);

      this.bounds.attr(
        "transform",
        `translate(${this.margin.left}, ${this.margin.top})`
      );
      this.xAxis.attr(
        "transform",
        `translate(0, ${this.height - this.margin.bottom - this.margin.top})`
      );
      this.xScale.range([0, width - this.margin.left - this.margin.right]);
      this.yScaleStringency.range([
        this.height - this.margin.top - this.margin.bottom,
        0,
      ]);
      this.yScalePageViews.range([
        this.height - this.margin.top - this.margin.bottom,
        0,
      ]);

      // const test = this.bounds.selectAll(".changepoint");
      const test = this.svg.selectAll(".changepoint");
      console.log(test);
      // .attr("height", height - margin.top - margin.bottom);
      // .select("rect")
      // console.log(test.length);

      this.listeningRect
        .attr("width", width - this.margin.left - this.margin.right)
        .attr("height", this.height - this.margin.top - this.margin.bottom);

      this.hoverLabel
        .attr("x", width - this.margin.top - this.margin.bottom - 50)
        .attr("y", this.height - this.margin.top - this.margin.bottom - 50);
      this.hoverLine.attr(
        "height",
        this.height - this.margin.top - this.margin.bottom
      );
    };

    d3.select(window).on("resize", resize);
    resize();
  };

  loadData<D>(tag: Tag): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this.props.incrementLoading();
      d3.json<D>(tag.url)
        .then((data) => {
          if (data === undefined) return reject();
          resolve(data);
        })
        .finally(() => this.props.decrementLoading());
    });
  }

  componentDidUpdate(prevProps: TimelineProps, prevState: TimelineState) {
    if (this.props.activeTags !== prevProps.activeTags) {
      console.log("data changed");
      // const add = this.props.activeTags.filter(
      //   (t) => !(this.state.stringencies.has(t.title) || )
      // );
      const removeStringencies = Array.from(
        this.state.stringencies.keys()
      ).filter((s) => !this.props.activeTags.map((t) => t.title).includes(s));

      const removeTopics = Array.from(this.state.topics.keys()).filter(
        (s) => !this.props.activeTags.map((t) => t.title).includes(s)
      );

      if (removeStringencies.length + removeTopics.length > 0) {
        this.setState((state) => {
          removeStringencies.forEach((t) => state.stringencies.delete(t));
          removeTopics.forEach((t) => state.topics.delete(t));
          return state;
        });
        this.update(true);
      }

      for (let tag of this.props.activeTags) {
        switch (tag.typ) {
          case TagType.CountryStringency:
            if (!(tag.title in this.state.topics)) {
              // load the stringency
              this.loadData<CountryStringency>(tag).then((data) => {
                this.setState((state) => {
                  state.stringencies.set(tag.title, data);
                  return state;
                });
                this.update(true);
              });
            }
            break;
          case TagType.CountryTotal:
            if (!(tag.title in this.state.topics)) {
              // load the total traffic
              this.loadData<CountryTopicAttention>(tag).then((data) => {
                this.setState((state) => {
                  state.topics.set(tag.title, data);
                  return state;
                });
                this.update();
              });
            }
            break;
          case TagType.CountryTopicAttention:
            if (!(tag.title in this.state.topics)) {
              // load the topic attention
              this.update();
            }
            break;
          default:
            break;
        }
      }
    }
  }

  componentDidMount() {
    this.addTimeline();
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
