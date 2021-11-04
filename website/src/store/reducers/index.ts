import { combineReducers } from "redux";
import tags from "./tags";
import changepoints from "./changepoints";
import loading from "./loading";

export default combineReducers({ tags, changepoints, loading });
