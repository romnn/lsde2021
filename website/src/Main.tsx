import React from "react";
import { Route, Link } from "react-router-dom";
import WorldMap from "./Map";
import TopicBarPlot from "./TopicBarPlot";
import Timeline from "./Timeline";
import { connect, ConnectedProps } from "react-redux";
import { TagType, Tag } from "./store/reducers/tags";
import { Action } from "./store/actions";
import { RootState } from "./store";
import { shuffleArray } from "./utils";
import LANGUAGE_COUNTRIES from "./data/languages_countries.json";
import SELECTED_TOPICS from "./data/selected_topics.json";
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
    const map = new Map();
    LANGUAGE_COUNTRIES.forEach((lc) => {
      const country = lc.country.toLowerCase();
      const group = lc.group.toLowerCase();
      const base = `data/${group}/${country}`;

      let title = `${country.toUpperCase().replaceAll(" ", "-")}:STRINGENCY`;
      if (!map.has(title)) {
        availableTags.push({
          typ: TagType.CountryStringency,
          country: lc.country,
          lang: lc.group,
          iso3: lc.iso3,
          url: `${base}/stringency_changepoints.json`,
          title,
        });
        map.set(title, true);
      }
      title = `${country
        .toUpperCase()
        .replaceAll(" ", "-")
        .toUpperCase()}:TOTAL`;
      if (!map.has(title)) {
        availableTags.push({
          typ: TagType.CountryTotal,
          country: lc.country,
          lang: lc.group,
          iso3: lc.iso3,
          url: `${base}/total.json`,
          title,
        });
        map.set(title, true);
      }
      SELECTED_TOPICS.forEach((topic) => {
        title = `${country
          .toUpperCase()
          .replaceAll(" ", "-")}:TOPIC:${topic.toUpperCase()}`;
        if (!map.has(title)) {
          availableTags.push({
            typ: TagType.CountryTopicAttention,
            country: lc.country,
            lang: lc.group,
            iso3: lc.iso3,
            url: `${base}/topics/${topic.toLowerCase()}.json`,
            title,
          });
          map.set(title, true);
        }
      });
    });
    // console.log(availableTags);
    shuffleArray(availableTags);
    this.state = {
      availableTags,
      searchText: "",
    };
  }

  handleUpdateSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchText: event.target.value });
  };

  componentDidMount() {
    const initialSelection = ["ITALY:STRINGENCY", "ITALY:TOPIC:MEDICINE"];
    // const initialSelection = ["GERMANY:STRINGENCY", "ITALY:TOPIC:MEDICINE"];
    this.state.availableTags
      .filter((t) => initialSelection.includes(t.title))
      .filter((t) => !this.props.activeTags.some((tt) => t.title === tt.title))
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
      if (!words[0]) return 0;
      if (words.length === 1) return words[0].length;

      let i = 0;
      let done = false;
      // avoid unsafe use of variable i by using a for loop
      while (words[0][i]) {
        for (let w of words) {
          if (w[i] !== words[0][i]) {
            done = true;
            break;
          }
        }
        if (done) break;
        i++;
      }

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
      .replaceAll(":", " ")
      .split(" ")
      .filter((s) => s.length > 0);

    const availableTags: [Tag, number][] = this.state.availableTags
      .filter((t) => {
        return !this.props.activeTags.map((tt) => tt.title).includes(t.title);
      })
      .map((t) => {
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
      .slice(0, 8)
      .map(([tag, _]) => {
        return (
          <div
            key={tag.title}
            onClick={() => this.props.addTag(tag)}
            className={
              "text-xs inline-flex opacity-75 hover:opacity-100 cursor-pointer items-center font-normal leading-sm max-w-full break-all uppercase pl-1 pr-2 py-1 m-1 rounded-full " +
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

    const tabStyle = "font-semibold bg-white inline-block py-1 px-2 ";
    const selectedTabStyle =
      tabStyle +
      "cursor-pointer text-gray-800 border-l border-t border-r rounded-t";
    // const unselectedTabStyle =
    //   tabStyle + "cursor-pointer text-gray-300 hover:text-gray-800";
    const disabledTabStyle =
      tabStyle + " text-gray-200 cursor-default hover:text-gray-200";

    return (
      <div className="Main">
        <div className="flex">
          <div className="tags">{activeTags}</div>
        </div>
        <div className="flex">
          <div className="w-3/4 inline-block">
            <Timeline />
          </div>
          <div className="w-1/4 inline-block px-2 py-1">
            <input
              className="focus:border-light-blue-500 focus:ring-1 focus:ring-light-blue-500 focus:outline-none w-full text-sm text-black placeholder-gray-500 border border-gray-200 rounded-md py-2 pl-1"
              type="text"
              value={this.state.searchText}
              onChange={this.handleUpdateSearchText}
              aria-label="Search"
              placeholder="Search"
            />
            <div>
              <div className="tags overflow-y-scroll">
                {scoredAvailableTags}
              </div>
            </div>
          </div>
        </div>

        <ul className="flex border-b">
          <li className="-mb-px ml-2">
            <Link className={selectedTabStyle} to="/">
              Attention Shift
            </Link>
          </li>

          <li className="ml-2">
            <Link
              onClick={(event) => event.preventDefault()}
              className={disabledTabStyle}
              to="/map"
            >
              Map
            </Link>
          </li>
        </ul>
        <div className="tabContent mb-5">
          <Route exact path="/map" component={WorldMap} />
          <Route exact path="/" component={TopicBarPlot} />
        </div>
      </div>
    );
  }
}

export default connector(Main);
