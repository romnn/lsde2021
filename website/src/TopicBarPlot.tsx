import React from "react";
import * as d3 from "d3";

type TopicBarPlotProps = {};

type TopicBarPlotState = {
  data: string[];
};

type TestCols = "Country" | "Value";

export default class TopicBarPlot extends React.Component<
  TopicBarPlotProps,
  TopicBarPlotState
> {
  svg!: d3.Selection<SVGGElement, any, HTMLElement, any>;

  constructor(props: TopicBarPlotProps) {
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

  addBarPlot = () => {
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    this.svg = d3
      .select<SVGGElement, any>("#barplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv<TestCols>(
      "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/7_OneCatOneNum_header.csv"
    ).then((data) => {
      console.log(data);

      // X axis
      const x = d3.scaleLinear().domain([0, 13000]).range([0, width]);
      this.svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      // Y axis
      const y = d3
        .scaleBand()
        .range([0, height])
        .domain(data.map((d) => d?.Country ?? "test"))
        .padding(0.1);
      this.svg.append("g").call(d3.axisLeft(y));

      //Bars
      this.svg
        .selectAll("myRect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", (d) => y(d?.Country ?? "test") ?? 0)
        .attr("width", (d) => x(Number(d?.Value) ?? 0))
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2");
    });
  };

  componentDidMount() {
    this.addBarPlot();
  }

  render() {
    return (
      <div>
        <div className="animate-spin h-5 w-5 mr-3 rounded-full border-b-2 border-gray-900"></div>
        <div id="barplot"></div>
      </div>
    );
  }
}
