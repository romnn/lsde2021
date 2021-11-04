import { combineReducers } from "redux";
import todos from "./todos";
import type { TagState } from "./todos";

interface RootState extends TagState {}

export default combineReducers({ todos });
export type { RootState };
