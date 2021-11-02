import React from "react";
import PlotChart from "../components/PlotChart";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function HomePage() {
  return (
    <div class="bg-gray-200 flex flex-col h-screen justify-between">
      <Header />
      <PlotChart />
      <Footer />
    </div>
  );
}
