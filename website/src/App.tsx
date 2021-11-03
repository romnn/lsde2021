import React from "react";
import { HashRouter as Router, Route, Link } from "react-router-dom";
import Main from "./Main";
import About from "./About";
import covidLogo from "./images/covid19_2.jpg";
import vuLogo from "./images/VU_2.png";
import "./App.sass";

type AppProps = {};
type AppState = {};

export default class App extends React.Component<AppProps, AppState> {
  state: AppState = {};

  render() {
    return (
      <div className="App">
        <Router>
          <nav className="flex items-center justify-between flex-wrap bg-blue-300 p-2">
            <Link to="/" className="flex items-center flex-shrink-0 text-white mr-6">
              <img className="rounded-full max-h-6 p-0 mr-2" src={covidLogo} />
              <span className="font-semibold text-l tracking-tight text-black">
                COVID-19 Wikipedia Attention
              </span>
            </Link>
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
              <div className="text-sm lg:flex-grow">
                <Link
                  className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
                  to="/about"
                >
                  About
                </Link>
              </div>
              <div className="my-1">
                <a href="https://vu.nl">
                  <img
                    className="inline-block rounded-full max-h-6 p-0 bg-white px-2 mr-3"
                    src={vuLogo}
                  />
                </a>
              </div>
              <div>
                <a
                  href="https://github.com/romnn/lsde2021"
                  className="inline-block text-sm px-4 py-2 leading-none border rounded text-black border-transparent hover:border-white"
                >
                  GitHub
                </a>
              </div>
            </div>
          </nav>

          <Route exact path="/" component={Main} />
          <Route exact path="/about" component={About} />
        </Router>
      </div>
    );
  }
}
