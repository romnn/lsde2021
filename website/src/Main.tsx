import React from "react";
import WorldMap from "./Map";
import TopicBarPlot from "./TopicBarPlot";
import Timeline from "./Timeline";
import "./App.sass";

enum TagType {
  CountryStringency,
  TopicAttention,
  CountryTotal,
}

type Tag = {
  typ: TagType;
  title: string;
};

type MainProps = {};
type MainState = {
  activeTags: Tag[];
};

// <button
//             type="button"
//             className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
//             id="menu-button"
//             aria-expanded="true"
//             aria-haspopup="true"
//           >
//             Options
//             <svg
//               className="-mr-1 ml-2 h-5 w-5"
//               xmlns="http://www.w3.org/2000/svg"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//               aria-hidden="true"
//             >
//               <path
//                 fill-rule="evenodd"
//                 d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                 clip-rule="evenodd"
//               />
//             </svg>
//           </button>

export default class Main extends React.Component<MainProps, MainState> {
  constructor(props: MainProps) {
    super(props);
    this.state = {
      activeTags: [
        { typ: TagType.CountryStringency, title: "Stringency:Germany" },
        { typ: TagType.CountryStringency, title: "Stringency:UK" },
        { typ: TagType.CountryStringency, title: "Stringency:UK" },
        { typ: TagType.CountryStringency, title: "Stringency:UK" },
        { typ: TagType.CountryStringency, title: "Stringency:UK" },
      ],
    };
  }

  render() {
    const tags = this.state.activeTags.map((tag) => {
      const tagColor = "bg-blue-200 text-blue-700";
      return (
        <div
          className={
            "text-xs inline-flex opacity-75 hover:opacity-100 cursor-pointer items-center font-bold leading-sm uppercase px-3 py-1 m-1 rounded-full " +
            tagColor
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {tag.title}
        </div>
      );
    });

    // <WorldMap />
    //           <TopicBarPlot />

    return (
      <div className="Main">
        <div className="flex">
          <div className="tags">{tags}</div>
        </div>
        <div className="flex">
          <div className="w-3/4 inline-block">
            <Timeline />
          </div>
          <div className="w-1/4 inline-block">
            <input
              className="focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 focus:outline-none w-full text-sm text-black placeholder-gray-500 border border-gray-200 rounded-md py-2 pl-1"
              type="text"
              aria-label="Filter projects"
              placeholder="Filter projects"
            />
          </div>
        </div>
      </div>
    );
  }
}
