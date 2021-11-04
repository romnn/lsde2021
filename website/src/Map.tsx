import React from "react";
import * as d3 from "d3";
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

type Cols =
  | "ISO3"
  | "Name"
  | "1995"
  | "1996"
  | "1997"
  | "1998"
  | "1999"
  | "2000"
  | "2001"
  | "2002"
  | "2003"
  | "2004"
  | "2005"
  | "2006"
  | "2007"
  | "2008"
  | "2009"
  | "2010"
  | "2011"
  | "2012"
  | "2013"
  | "2014"
  | "2015"
  | "2016"
  | "2017";

type WorldMapState = {
  data: d3.DSVRowArray<Cols> | undefined;
};

export default class WorldMap extends React.Component<
  WorldMapProps,
  WorldMapState
> {
  state: WorldMapState = {
    data: undefined,
  };

  loadData = () => {
    d3.csv<Cols>("maptest.csv").then((data) => {
      console.log(data);
      this.setState({
        data,
      });
    });
  };

  componentDidMount() {
    this.loadData();
  }

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
          {(this.state.data?.length ?? 0) > 0 && (
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const d = this.state.data?.find(
                    (s) => s.ISO3 === geo.properties.ISO_A3
                  );
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={d ? colorScale(Number(d["2017"])) : "#F5F4F6"}
                    />
                  );
                })
              }
            </Geographies>
          )}
        </ComposableMap>
      </div>
    );
  }
}
