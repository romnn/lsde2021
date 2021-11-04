import { createStore } from "redux";
import rootReducer from "./reducers";
export type { RootState } from "./reducers";

export default createStore(rootReducer);

enum Action {
  AddTag,
}

export { Action };
// export { initialState, Action };
// export type {  RootState };
// import { createSlice, configureStore } from "@reduxjs/toolkit";

// enum TagType {
//   CountryStringency,
//   CountryTopicAttention,
//   CountryTotal,
// }

// type Tag = {
//   typ: TagType;
//   title: string;
// };

// type StoreState = {
//   loading: number;
//   activeTags: Tag[];
// };

// export { TagType };
// export type { Tag };

// // export const addTodo = (tag: Tag) => ({
// //   type: Action.AddTODO,
// //   payload: {
// //     id: 0,
// //     tag,
// //   },
// // });

// const counterSlice = createSlice({
//   name: "counter",
//   initialState: {
//     loading: 0,
//     activeTagTitles: [],
//   },
//   reducers: {
//     incrementLoading: (state) => {
//       state.loading += 1;
//     },
//     decrementedLoading: (state) => {
//       state.loading = Math.max(0, state.loading - 1);
//     },
//     // addTag: (state, tag) => {
//     //   state.activeTagTitles.push(tag.title);
//     // },
//     // removeTag: (state, title) => {
//     //   state.activeTagTitles = state.activeTagTitles.filter((t) => {
//     //     return title !== t;
//     //   });
//     // },
//   },
// });
