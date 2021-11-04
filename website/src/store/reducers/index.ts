import { combineReducers } from "redux";
import tags from "./todos";
import type { TagState } from "./todos";

// interface RootState extends TagState {}

export default combineReducers({ tags });
// export type { RootState };
