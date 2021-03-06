import React from "react";
import * as d3 from "d3";
import { connect, ConnectedProps } from "react-redux";
import { Action } from "./store/actions";
import { Tag, TagType } from "./store/reducers/tags";
import { RootState } from "./store";
import { isSameDate, Country } from "./utils";

// raw stringency JSON type
type Stringency = {
  Date: string;
  StringencyIndex: number;
  Notes: string[];
};

// raw pageview JSON type
type Pageview = {
  date: string;
  views: string;
};

type CountryStringency = {
  country: Country;
  changepoints: string[];
  stringency: Stringency[];
};

type CountryTopicAttention = {
  country: Country;
  traffic: Pageview[];
};

const mapState = (state: RootState) => ({
  activeTags: state.tags.activeTags,
  currentChangepoint: state.changepoints?.changepoint,
});

const mapDispatch = {
  selectChangepoint: (payload: {
    changepoint: Date | undefined;
    tag: Tag | undefined;
  }) => ({
    type: Action.SelectChangepoint,
    payload,
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
  content!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  interaction!: d3.Selection<SVGGElement, any, HTMLElement, any>;
  ui!: d3.Selection<SVGGElement, any, HTMLElement, any>;

  hoverLine!: d3.Selection<SVGRectElement, any, HTMLElement, any>;
  hoverLabel!: d3.Selection<SVGTextElement, any, HTMLElement, any>;

  hoverEnabled: boolean = true;
  margin = { top: 10, right: 60, bottom: 35, left: 30 };
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
    console.log("update timeline");
    const bbox = this.container?.node()?.getBoundingClientRect();
    const width = bbox?.width ?? 0;

    this.svg.attr("width", width).attr("height", this.height);
    this.bounds.attr(
      "transform",
      `translate(${this.margin.left}, ${this.margin.top})`
    );
    this.svg
      .select(".listeningRect")
      .attr("width", width - this.margin.left - this.margin.right)
      .attr("height", this.height - this.margin.top - this.margin.bottom);

    this.hoverLabel
      .attr("x", width - this.margin.left - this.margin.right - 10)
      .attr("y", this.height - this.margin.top - this.margin.bottom - 10);

    this.hoverLine.attr(
      "height",
      this.height - this.margin.top - this.margin.bottom
    );

    // data types
    type ChangepointGraph = { date: Date; id: string };

    type TimeSeriesDatapoint = {
      date: Date;
      value: number;
    };

    interface StringencyGraphValue extends TimeSeriesDatapoint {
      notes: string[];
    }

    type Graph = {
      id: string;
      values: TimeSeriesDatapoint[];
    };

    interface StringencyGraph extends Graph {
      values: StringencyGraphValue[];
      changepoints: ChangepointGraph[];
    }

    interface PageviewGraph extends Graph {}

    const stringencies: StringencyGraph[] = Array.from(
      this.state.stringencies.entries()
    ).map(([tag, s]) => {
      return {
        id: tag,
        values: s.stringency.map((d) => {
          return {
            date: new Date(d.Date),
            value: Number(d.StringencyIndex),
            notes: d.Notes,
          };
        }),
        changepoints: s.changepoints.map((d) => {
          return { date: new Date(d), id: tag };
        }),
      };
    });

    const pageviews: PageviewGraph[] = Array.from(
      this.state.topics.entries()
    ).map(([tag, t]) => {
      return {
        id: tag,
        values: t.traffic.map((t) => {
          return { date: new Date(t.date), value: Number(t.views) };
        }),
      };
    });

    this.ui
      .select(".yLabelStringency")
      .attr("opacity", stringencies.length > 0 ? 1 : 0);

    this.ui
      .select(".yLabelPageviews")
      .attr("opacity", pageviews.length > 0 ? 1 : 0)
      .attr(
        "transform",
        `translate(${
          width - this.margin.left - this.margin.right - 10
        },0)rotate(-90)`
      );

    const color = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain([...stringencies, ...pageviews].map((s) => s.id));

    const combinedData = [...stringencies, ...pageviews];
    const xExtent = [
      d3.min(combinedData, (s) => d3.min(s.values, (d) => d.date)),
      d3.max(combinedData, (s) => d3.max(s.values, (d) => d.date)),
    ] as [Date, Date];

    const xScale = d3
      .scaleTime()
      .range([0, width - this.margin.left - this.margin.right])
      .domain(xExtent);

    this.ui
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

    // compute the total y domain (stringency and pageviews separately)
    const yExtentStringency = [
      d3.min(stringencies, (s) => d3.min(s.values, (d) => d.value)),
      d3.max(stringencies, (s) => d3.max(s.values, (d) => d.value)),
    ] as [number, number];

    const yScaleStringency = d3
      .scaleLinear<number>()
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .domain(yExtentStringency);

    this.ui
      .selectAll<SVGGElement, any>(".yAxisStringency")
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisLeft(yScaleStringency))
      .selectAll("text")
      .style("text-anchor", "end");

    const yExtentPageviews = [
      d3.min(pageviews, (s) => d3.min(s.values, (d) => d.value)),
      d3.max(pageviews, (s) => d3.max(s.values, (d) => d.value)),
    ] as [number, number];

    const yScalePageviews = d3
      .scaleLinear<number>()
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .domain(yExtentPageviews);

    this.ui
      .selectAll<SVGGElement, any>(".yAxisPageviews")
      .attr(
        "transform",
        `translate(${width - this.margin.left - this.margin.right}, 0)`
      )
      .transition()
      .duration(animated ? 100 : 0)
      .call(d3.axisRight(yScalePageviews))
      .selectAll("text")
      .style("text-anchor", "start");

    const stringenciesProj = this.content
      .selectAll<SVGGElement, StringencyGraph>(".stringency")
      .data(stringencies, (s) => s.id);

    stringenciesProj.exit().remove();
    const stringenciesProjContainer = stringenciesProj
      .enter()
      .append("g")
      .attr("class", (s) => `stringency ${s.id}`);

    stringenciesProjContainer.append("path").attr("class", "stringencyLine");

    const lineID = (title: string) => {
      return title.toLowerCase().replaceAll(":", "-");
    };

    // render topics
    const pageviewsProj = this.content
      .selectAll<SVGGElement, PageviewGraph>(".pageviews")
      .data(pageviews, (s) => s.id);

    pageviewsProj.exit().remove();
    const pageviewsProjContainer = pageviewsProj
      .enter()
      .append("g")
      .attr("class", (s) => `pageviews ${s.id}`);

    pageviewsProjContainer.append("path").attr("class", "pageviewLine");

    // plot lines for stringencies
    const stringencyLine = d3
      .line<TimeSeriesDatapoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScaleStringency(d.value));

    this.content
      .selectAll<SVGPathElement, Graph>(".stringencyLine")
      .attr("stroke-dasharray", "3, 3")
      .attr("fill", "none")
      .attr("id", (d, i) => lineID(d.id))
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("d", (d, i) => {
        return stringencyLine(d.values);
      })
      .style("stroke", (d) => color(d.id));

    // plot lines for pageviews
    const pageviewLine = d3
      .line<TimeSeriesDatapoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScalePageviews(d.value));

    this.content
      .selectAll<SVGPathElement, Graph>(".pageviewLine")
      .attr("fill", "none")
      .attr("id", (d, i) => lineID(d.id))
      .attr("stroke-width", 1)
      .attr("stroke-linecap", "round")
      .attr("d", (d, i) => {
        return pageviewLine(
          d.values.sort((x, y) => {
            return d3.ascending(x.date, y.date);
          })
        );
      })
      .style("stroke", (d) => color(d.id));

    const changepoints = this.interaction
      .selectAll<SVGRectElement, ChangepointGraph>(".changepoint")
      .data(stringencies.map((s) => s.changepoints).flat());

    changepoints.exit().remove();
    changepoints.enter().append("rect").attr("class", "changepoint");

    this.interaction
      .selectAll<SVGRectElement, ChangepointGraph>(".changepoint")
      .attr("width", "5px")
      .attr("cursor", "pointer")
      .attr("fill", (d) => color(d.id))
      .attr("opacity", "0.1")
      .attr("height", this.height - this.margin.top - this.margin.bottom)
      .attr("x", (d) => {
        return xScale(d.date);
      })
      .on("click", (event, d) => {
        const current = d3.select(event.currentTarget);
        if (
          this.props.currentChangepoint !== undefined &&
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

        this.props.selectChangepoint({
          changepoint: alreadySelected ? undefined : d.date,
          tag: alreadySelected
            ? undefined
            : this.props.activeTags.find((t) => t.title === d.id),
        });
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

    // plot legend for both pageviews and stringencies
    const labels = this.ui
      .selectAll<SVGGElement, { id: string }>(".legend")
      .data(combinedData, (s) => s.id);

    labels.exit().remove();
    labels
      .enter()
      .append("text")
      .attr("class", (s) => `legend legend-${s.id}`);

    this.ui
      .selectAll<SVGTextElement, { id: string }>(".legend")
      .attr("text-anchor", "start")
      .style("font-size", "10px")
      .attr("fill", (d) => color(d.id))
      .attr("x", this.margin.left + 10)
      .attr("y", (d, i) => this.margin.top + 5 + 15 * i)
      .text((d) => d.id);

    // animate to show pageview and stringency graphs
    this.content.selectAll<SVGPathElement, Graph>(".line").each((d, i) => {
      var totalLength =
        d3
          .select<SVGPathElement, Graph>("#" + lineID(d.id))
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

    this.svg
      .select(".listeningRect")
      .on("click", (event, d) => {
        // toggle hovering to be able to read about restrictions
        this.hoverEnabled = !this.hoverEnabled;
      })
      .on("mousemove", (event, d) => {
        if (!this.hoverEnabled) return;
        const mouseX = d3.pointer(event)[0];
        const hoveredDate: Date = xScale.invert(mouseX);
        this.hoverLabel.text(d3.timeFormat("%B %d, %Y")(hoveredDate));
        this.hoverLine.attr("x", xScale(hoveredDate));

        // only show detailed stringency events if one is plotted
        if (stringencies.length !== 1) {
          this.setState({
            notes: [],
          });
          return;
        }

        const dist = (d: { date: Date }): number =>
          Math.abs((d.date?.getTime() ?? 0) - hoveredDate.getTime());
        const firstStringency: StringencyGraph = stringencies[0];
        const stringencyWithNotes = firstStringency.values.filter(
          (s) => s.notes.length > 0
        );
        const closestIndexWithNotes: number | undefined = d3.leastIndex(
          stringencyWithNotes,
          (a, b) => dist(a) - dist(b)
        );
        if (closestIndexWithNotes !== undefined) {
          const closestDataPoint = stringencyWithNotes[closestIndexWithNotes];
          this.setState({
            notes: [
              ...new Set(
                closestDataPoint?.notes.map((n) => {
                  const stripped = n.replace(
                    /(\(?\s*(Sources?:\s*)?(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)\s*)+\)?)/gim,
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

    // static graphs
    this.content = this.bounds.append("g");

    // readable ui code, legends
    this.ui = this.bounds.append("g");

    // for controlling the hover effects
    this.bounds
      .append("rect")
      .attr("class", "listeningRect")
      .attr("fill", "transparent");

    // changepoints must be selecable
    this.interaction = this.bounds.append("g");

    this.ui.append("g").attr("class", "xAxis");
    this.ui.append("g").attr("class", "yAxisStringency");
    this.ui.append("g").attr("class", "yAxisPageviews");

    this.ui
      .append("text")
      .attr("class", "yLabelStringency")
      .attr("text-anchor", "end")
      .attr("transform", "translate(15,0)rotate(-90)")
      .text("stringency index");

    this.ui
      .append("text")
      .attr("class", "yLabelPageviews")
      .attr("text-anchor", "end")
      .text("pageviews");

    this.hoverLine = this.ui
      .append("g")
      .append("rect")
      .attr("class", "hoverline")
      .attr("stroke-width", "1px")
      .attr("width", ".5px");

    this.hoverLabel = this.ui.append("svg:text");

    this.hoverLabel
      .text("")
      .style("text-anchor", "end")
      .style("fill", "black")
      .style("font-size", 15);

    const resize = () => {
      this.update();
    };
    window.addEventListener("resize", resize);
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
      console.log("tags changed");
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
              this.loadData<CountryTopicAttention>(tag).then((data) => {
                this.setState((state) => {
                  state.topics.set(tag.title, data);
                  return state;
                });
                this.update(true);
              });
            }
            break;
          case TagType.CountryTopicAttention:
            if (!(tag.title in this.state.topics)) {
              this.loadData<CountryTopicAttention>(tag).then((data) => {
                this.setState((state) => {
                  state.topics.set(tag.title, data);
                  return state;
                });
                this.update(true);
              });
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
    this.update(true);
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
