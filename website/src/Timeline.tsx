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
    console.log("update timeline");
    const bbox = this.container?.node()?.getBoundingClientRect();
    const width = bbox?.width ?? 0;

    this.svg.attr("width", width).attr("height", this.height);
    this.bounds.attr(
      "transform",
      `translate(${this.margin.left}, ${this.margin.top})`
    );
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

    type ChangepointGraph = { date: Date; id: string };
    type StringencyGraph = {
      id: string;
      stringency: {
        date: Date;
        value: number;
        notes: string[];
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
            notes: d.Notes,
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

    this.listeningRect
      .on("click", (event, d) => {
        // toggle hovering to be able to read about restrictions
        this.hoverEnabled = !this.hoverEnabled;
      })
      .on("mousemove", (event, d) => {
        if (!this.hoverEnabled) return;
        const [mouseX, mouseY] = d3.pointer(event);
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
        const stringencyWithNotes = firstStringency.stringency.filter(
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

    this.bounds.append("g").attr("class", "xAxis");

    this.bounds.append("g").attr("class", "yAxisStringency");
    this.bounds.append("g").attr("class", "yAxisPageViews");

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
      .attr("class", "hoverline")
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
              // todo
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
