import React from "react";
import WorldMap from "./Map";
import TopicBarPlot from "./TopicBarPlot";
import Timeline from "./Timeline";
import "./App.sass";

// <header className="App-header">
//         <input
//           className="focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 focus:outline-none w-full text-sm text-black placeholder-gray-500 border border-gray-200 rounded-md py-2 pl-10"
//           type="text"
//           aria-label="Filter projects"
//           placeholder="Filter projects"
//         />
//       </header>

type MainProps = {};
type MainState = {};

export default class Main extends React.Component<MainProps, MainState> {
  state: MainState = {};

  render() {
    return (
      <div className="Main">
        <div className="flex mb-4">
          <div className="w-3/4 bg-gray-400 h-12">
            <Timeline />
            <WorldMap />
            <TopicBarPlot />
          </div>
          <div className="w-1/4 bg-red-500 h-12"></div>
        </div>
      </div>
    );
  }
}
