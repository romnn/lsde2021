import React from "react";

type AboutProps = {};
type AboutState = {};

export default class About extends React.Component<AboutProps, AboutState> {
  state: AboutState = {};

  render() {
    return (
      <div className="About">
        This is an about page
      </div>
    )
  }
}
