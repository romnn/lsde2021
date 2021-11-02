import React from "react";
// import { csv } from "d3-fetch";
import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";

const geoUrl =
  "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const colorScale = scaleLinear<string>()
  .domain([0.29, 0.68])
  .range(["#ffedea", "#ff5233"]);

type WorldMapProps = {};

type WorldMapState = {
  data: string[];
  // data: DSVRowString<string> | undefined;
};

export default class WorldMap extends React.Component<
  WorldMapProps,
  WorldMapState
> {
  state: WorldMapState = {
    data: [],
  };

  increment = (amt: number) => {
    // this.setState((state) => ({
    //   count: state.count + amt,
    // }));
  };

  loadData = () => {
    // csv("vulnerability.csv").then((data) => {
    //   this.setState({
    //     data,
    //   });
    // });
  };

  render() {
    return (
      <div>
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 147,
          }}
        >
          <Sphere id="test" fill="blue" stroke="#E4E5E6" strokeWidth={0.5} />
          <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
          {this.state.data.length > 0 && (
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // const d = this.state.data.find((s) => s.ISO3 === geo.properties.ISO_A3);
                  // return (
                  //   <Geography
                  //     key={geo.rsmKey}
                  //     geography={geo}
                  //     fill={d ? colorScale(d["2017"]) : "#F5F4F6"}
                  //   />
                  // );
                })
              }
            </Geographies>
          )}
        </ComposableMap>
      </div>
    );
  }
}
