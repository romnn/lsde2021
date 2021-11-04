import { combineReducers } from "redux";
import tags from "./todos";
import changepoints from "./changepoints";

export default combineReducers({ tags, changepoints });
