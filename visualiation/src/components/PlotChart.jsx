import React, { useState, Fragment } from "react";
import Switch from "react-switch";
import data from "../data/stringency2020.json";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceDot,
  CartesianGrid,
  Legend,
} from "recharts";
import TopicCards from "../components/TopicCards";
import health from "../images/health.jpg";
import tech from "../images/tech.jpg";
import politics from "../images/politics.jpg";
import history from "../images/history.jpeg";
import spain from "../images/spain.png";
import france from "../images/france.png";
import sweden from "../images/sweden.png";
import italy from "../images/italy.png";
import languagesregression from "../images/languagesregression.png";
import ScrollButton from "../components/scrollButton.jsx";
import eventDictWorld from "../data/eventListWorld.json";
import eventDictGermany from "../data/eventListGermany.json"
import eventDictFrance from "../data/eventListFrance.json";
import eventDictSpain from "../data/eventListSpain.json"
import eventDictNetherlands from "../data/eventListNetherlands.json";
import eventDictSweden from "../data/eventListSweden.json"
import eventDictItaly from "../data/eventListItaly.json"


export default function PlotChart() {
  var dotStyle;

  const [showWorld, setShowWorld] = useState(true);
  const [showGermany, setShowGermany] = useState(false);
  const [showFrance, setShowFrance] = useState(false);
  const [showSpain, setShowSpain] = useState(false);
  const [showItaly, setShowItaly] = useState(false);
  const [showSweden, setShowSweden] = useState(false);
  const [showNetherlands, setShowNetherlands] = useState(false);



  const [event, setEvent] = useState(null);
  const [hover, setHover] = useState(false);
  const [eventName, setEventName] = useState(false);
  const [eventDate, setEventDate] = useState(false);

  const [eventDict, setEventDict] = useState(eventDictWorld)


  hover
    ? (dotStyle = { color: "#ed1212", cursor: "pointer" })
    : (dotStyle = {});


  function handleChangeWorld() {
    setShowFrance(false);
    setShowGermany(false);
    setShowSpain(false);
    setShowSweden(false);
    setShowItaly(false);
    setShowNetherlands(false);

    setShowWorld(!showWorld);


    setEventDict(eventDictWorld);
  }

  function handleChangeGermany() {
    setShowWorld(false);
    setShowFrance(false);
    setShowSpain(false);
    setShowSweden(false);
    setShowItaly(false);
    setShowNetherlands(false);

    setShowGermany(!showGermany);

    setEventDict(eventDictGermany);
  }

  function handleChangeFrance(){
    setShowWorld(false);
    setShowSpain(false);
    setShowSweden(false);
    setShowItaly(false);
    setShowNetherlands(false);
    setShowGermany(false);
    setShowFrance(!showFrance);
   
    
    setEventDict(eventDictFrance);
  }

  function handleChangeSpain(){
    setShowWorld(false);
    setShowFrance(false);
    setShowSweden(false);
    setShowItaly(false);
    setShowNetherlands(false);
    setShowGermany(false);
    setShowSpain(!showSpain);
 
    setEventDict(eventDictSpain);
  }

  function handleChangeSweden(){
    setShowWorld(false);
    setShowFrance(false);
    setShowSpain(false);
    setShowItaly(false);
    setShowNetherlands(false);
    setShowGermany(false);
    setShowSweden(!showSweden)
    
    setEventDict(eventDictSweden);
  }

  function handleChangeItaly(){

    setShowWorld(false);
    setShowFrance(false);
    setShowSpain(false);
    setShowNetherlands(false);
    setShowGermany(false);
    setShowSweden(false);
    setShowItaly(!showItaly)
    setEventDict(eventDictItaly);
  }

  function handleChangeNetherlands(){
   
    setShowWorld(false);
    setShowItaly(false);
    setShowFrance(false);
    setShowSpain(false);
    setShowSweden(false);
    setShowGermany(false);
    setShowNetherlands(!showNetherlands);
   
    setEventDict(eventDictNetherlands);
  }

  

  function handleClick(e) {
    console.log("e", e)
    setEvent(e);
    setEventDate(e.x);
    setEventName(eventDict.find((o) => o.date === e.x).name);
  }

  function toggleHover() {
    setHover(!hover);
  }

 
  return (
    <div class="p-3  md:w-auto ... text-center text-3xl py-5">
      <div class="bg-white md:w-auto ... text-center h-auto ...">
        <ResponsiveContainer height={700} width={"100%"}>
          <LineChart data={data}>
            <Legend verticalAlign="top" align="right" />
            <XAxis dataKey="date" angle={-90} textAnchor="end" height={200} />
            <YAxis dataKey="stringencyGermany" />
            <CartesianGrid stroke="#f5f5f5" />
         
              {(showWorld || showGermany) &&
              <Line
                type="natural"
                dot={false}
                dataKey="stringencyGermany"
                stroke="#ff7300"
                yAxisId={0}
              /> } 
              {(showWorld || showFrance) && 
              <Line
                type="natural"
                dot={false}
                dataKey="stringencyFrance"
                stroke="red"
                yAxisId={0}
              /> }
              {(showWorld || showNetherlands) &&  
              
              <Line
                type="natural"
                dot={false}
                dataKey="stringencyNetherlands"
                stroke="#green"
                yAxisId={0}
              /> }
              {(showWorld || showItaly) && 

              <Line
                type="natural"
                dot={false}
                dataKey="stringencyItaly"
                stroke="blue"
                yAxisId={0}
              /> }
              {(showWorld || showSpain) && 

              <Line
                type="natural"
                dot={false}
                dataKey="stringencySpain"
                stroke="black"
                yAxisId={0}
              /> }
              {(showWorld || showSweden) && 

              <Line
                type="natural"
                dot={false}
                dataKey="stringencySweden"
                stroke="purple"
                yAxisId={0}
              /> }
              
            
            {/* {showVac && (
              <Line type="monotone" dataKey="pv" stroke="#387908" yAxisId={1} />
            )}
            */}
            {/* reference dots should be mapped to Attention curve since that one is always shown */}
            {/* Page Will Crash now if you remove the only curve there is  (stringency) */}

             {eventDict.map((key) => (
              <ReferenceDot
                style={dotStyle}
                onMouseOver={toggleHover}
                onMouseOut={toggleHover}
                onClick={handleClick}
                className="clickable"
                x={key.date}
                y={5}
                r={20}
                stroke={"blue"}
               
                // label={key.name}
              />
            ))} 

           
          
          </LineChart>
        </ResponsiveContainer>

        <div>
          <div class="flex flex-col ... text-center py-10">
          <label>
              <span>World</span>

              <Switch onChange={handleChangeWorld} checked={showWorld} />
            </label>
            <label>
              <span>Germany</span>

              <Switch
                onChange={handleChangeGermany}
                checked={showGermany}
              />
            </label>
            <label>
              <span>France</span>

              <Switch
                onChange={handleChangeFrance}
                checked={showFrance}
              />
            </label>
            <label>
              <span>Spain</span>

              <Switch
                onChange={handleChangeSpain}
                checked={showSpain}
              />
            </label>
            <label>
              <span>Italy</span>

              <Switch
                onChange={handleChangeItaly}
                checked={showItaly}
              />
            </label>
            <label>
              <span>Netherlands</span>

              <Switch
                onChange={handleChangeNetherlands}
                checked={showNetherlands}
              />
            </label>
            <label>
              <span>Sweden</span>

              <Switch
                onChange={handleChangeSweden}
                checked={showSweden}
              />
            </label>
          
          </div>
        </div>
      </div>

      {!event && (
        <Fragment>
          <h1 class="p-4 font-bold text-3xl md:text-4xl lg:text-5xl font-heading text-gray-900 text-center text-blue-300">
            {" "}
            Please select an event!{" "}
          </h1>
        </Fragment>
      )}
      {event && (
        <div class="bg-gray-200 text-blue-300">
          <h1 class="py-20 font-bold text-3xl md:text-4xl lg:text-5xl font-heading  text-blue-300 text-center">
            {" "}
            Event: {eventName} ({eventDate}){" "}
          </h1>

          <ScrollButton />

          <div class="h-500  flex flex-col justify-evenly p-60">
            {/* <h1 class="font-bold text-3xl md:text-4xl lg:text-5xl font-heading  text-blue-300 text-center">
              {" "}
              DiD Regressions{" "}
            </h1>
            <div class="flex flex-row justify-evenly">
              <img src={languagesregression} alt="tech" class="rounded-full" />

              <img src={languagesregression} alt="tech" class="rounded-full" />
            </div> */}
            <div>
              <TopicCards
                header="Trending Topics"
                trend={true}
                title1={"Health"}
                image1={health}
                title2={"Technology"}
                image2={tech}
              />
            </div>
            <div>
              <TopicCards
                header="Decreasing Topics"
                trend={false}
                title1={"Politics"}
                image1={politics}
                title2={"History"}
                image2={history}
              />
            </div>
            <div>
              <TopicCards
                header="Attention "
                trend={true}
                title1={"France"}
                image1={france}
                title2={"Spain"}
                image2={spain}
              />
            </div>
            <div>
              <TopicCards
                header="Attention "
                trend={false}
                title1={"Italy"}
                image1={italy}
                title2={"Sweden"}
                image2={sweden}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
