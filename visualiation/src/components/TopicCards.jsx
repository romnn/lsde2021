import React, { Fragment } from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export default function TopicCards(props) {
  return (
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 py-12">
      <div class="text-center pb-12">
        <h1 class="font-bold text-3xl md:text-4xl lg:text-5xl font-heading  text-blue-300">
          {props.header}
        </h1>
        {props.trend ? (
          <TrendingUpIcon fontSize="large" />
        ) : (
          <TrendingDownIcon fontSize="large" />
        )}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="w-full bg-white rounded-lg sahdow-lg overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-2/5 h-80">
            <img
              class="object-center object-cover w-full h-full"
              src={props.image1}
              alt="health"
            />
          </div>
          <div class="w-full md:w-3/5 text-left p-6 md:p-4 space-y-2 bg-white-200">
            <p class="text-xl text-gray-700 font-bold">{props.title1}</p>
            <p class="text-base text-gray-400 font-normal">
              Pages: Mask, COVID19
            </p>
          </div>
        </div>
        <div class="w-full bg-white rounded-lg sahdow-lg overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-2/5 h-80">
            <img
              class="object-center object-cover w-full h-full"
              src={props.image2}
              alt="tech"
            />
          </div>
          <div class="w-full md:w-3/5 text-left p-4 md:p-4 space-y-2 bg-white-200">
            <p class="text-xl text-gray-700 font-bold">{props.title2}</p>
            <p class="text-base text-gray-400 font-normal">
              Pages: Monitor, RAM, GPU
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
