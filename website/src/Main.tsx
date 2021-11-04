import React from "react";
import WorldMap from "./Map";
import TopicBarPlot from "./TopicBarPlot";
import Timeline from "./Timeline";
import { connect, ConnectedProps } from "react-redux";
import { TagType, Tag } from "./store/reducers/todos";
import { Action } from "./store/actions";
import { RootState } from "./store";
import "./App.sass";

const mapState = (state: RootState) => ({
  activeTags: state.tags.activeTags,
});

const mapDispatch = {
  addTag: (tag: Tag) => ({
    type: Action.AddTag,
    payload: {
      tag,
    },
  }),
  removeTag: (tag: Tag) => ({
    type: Action.RemoveTag,
    payload: {
      tag,
    },
  }),
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

type MainState = {
  availableTags: Tag[];
  searchText: string;
};

interface MainProps extends PropsFromRedux {}

const tagColor = (typ: TagType): string => {
  let tagColor = "bg-red-200 text-red-700";
  switch (typ) {
    case TagType.CountryTotal:
      tagColor = "bg-gray-200 text-gray-700";
      break;
    case TagType.CountryTopicAttention:
      tagColor = "bg-blue-200 text-blue-700";
      break;
    default:
      break;
  }
  return tagColor;
};

class Main extends React.Component<MainProps, MainState> {
  constructor(props: MainProps) {
    super(props);
    const availableTags: Tag[] = [];
    const languages = { de: ["Germany"] };
    const topics = ["Medicine", "Sports"];

    Object.entries(languages).forEach(([lang, countries]) => {
      availableTags.push(
        ...countries.map((country) => {
          return {
            typ: TagType.CountryStringency,
            title: `${country}:Stringency`,
          };
        })
      );
      availableTags.push(
        ...countries.map((country) => {
          return {
            typ: TagType.CountryTotal,
            title: `${country}:Total`,
          };
        })
      );
      countries.forEach((country) => {
        availableTags.push(
          ...topics.map((topic) => {
            return {
              typ: TagType.CountryTopicAttention,
              title: `${country}:Topic:${topic}`,
            };
          })
        );
      });
    });
    this.state = {
      availableTags,
      searchText: "",
    };
  }

  handleUpdateSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchText: event.target.value });
  };

  componentDidMount() {
    this.state.availableTags
      .filter((t) => t.title === "Germany:Stringency")
      .forEach((t) => {
        console.log("adding", t);
        this.props.addTag(t);
      });
  }

  render() {
    const activeTags = this.props.activeTags.map((tag) => {
      return (
        <div
          key={tag.title}
          onClick={() => this.props.removeTag(tag)}
          className={
            "text-xs inline-flex opacity-75 hover:opacity-100 cursor-pointer items-center font-bold leading-sm uppercase px-3 py-1 m-1 rounded-full " +
            tagColor(tag.typ)
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

    const longestPrefix = (words: string[]): number => {
      // check border cases size 1 array and empty first word)

      if (!words[0]) return 0;
      if (words.length == 1) return words[0].length;
      let i = 0;
      while (words[0][i] && words.every((w) => w[i] === words[0][i])) i++;

      return words[0].substr(0, i).length;
    };

    const searchMatchScorer = (query: string[], tag: string[]): number => {
      let totalScore = 0;
      while (query.length > 0 && tag.length > 0) {
        let maxScore = 0;
        let maxQi = 0;
        let maxTi = 0;
        for (let ti in tag) {
          for (let qi in query) {
            let score = longestPrefix([query[qi], tag[ti]]);
            if (score >= maxScore) {
              maxScore = score;
              maxQi = Number(qi);
              maxTi = Number(ti);
            }
          }
        }
        totalScore += maxScore;
        query.splice(maxQi, 1);
        tag.splice(maxTi, 1);
      }
      return totalScore;
    };

    const searchPrefixes = this.state.searchText
      .toLowerCase()
      .replace(":", " ")
      .split(" ")
      .filter((s) => s.length > 0);
    // console.log(searchPrefixes);

    const availableTags: [Tag, number][] = this.state.availableTags
      .filter((t) => {
        return !this.props.activeTags.map((tt) => tt.title).includes(t.title);
      })
      .map((t) => {
        // const scored = [
        //   t,
        //   searchMatchScorer(
        //     [...searchPrefixes],
        //     t.title.toLowerCase().split(":")
        //   ),
        // ];
        // console.log(scored);
        return [
          t,
          searchMatchScorer(
            [...searchPrefixes],
            t.title.toLowerCase().split(":")
          ),
        ];
      });

    const scoredAvailableTags = availableTags
      .sort(([a, scoreA], [b, scoreB]) => {
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map(([tag, _]) => {
        return (
          <div
            key={tag.title}
            onClick={() => this.props.addTag(tag)}
            className={
              "text-xs inline-flex opacity-75 hover:opacity-100 cursor-pointer items-center font-bold leading-sm uppercase px-3 py-1 m-1 rounded-full " +
              tagColor(tag.typ)
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {tag.title}
          </div>
        );
      });

    return (
      <div className="Main">
        <div className="flex">
          <div className="tags">{activeTags}</div>
        </div>
        <div className="flex">
          <div className="w-3/4 inline-block">
            <Timeline />
            <WorldMap />
            <TopicBarPlot />
          </div>
          <div className="w-1/4 inline-block p-2">
            <input
              className="focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 focus:outline-none w-full text-sm text-black placeholder-gray-500 border border-gray-200 rounded-md py-2 pl-1"
              type="text"
              value={this.state.searchText}
              onChange={this.handleUpdateSearchText}
              aria-label="Search"
              placeholder="Search"
            />
            <div>
              <div className="tags">{scoredAvailableTags}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connector(Main);
