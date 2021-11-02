import React from "react";
import covid from "../images/covid19.jpeg";
import vu from "../images/VU.png";

export default function Header(props) {
  return (
    <div class="bg-blue-300 p-4 flex justify-between">
      <a href="/">
        {" "}
        <img src={covid} alt="Covid" class="rounded-full max-h-20" />{" "}
      </a>
      <a href="https://vu.nl">
        {" "}
        <img src={vu} alt="VU" class="rounded-full max-h-20" />{" "}
      </a>
    </div>
  );
}
