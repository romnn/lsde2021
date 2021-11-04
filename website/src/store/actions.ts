// import { ADD_TODO, TOGGLE_TODO, SET_FILTER } from "./actionTypes";

enum Action {
  AddTag,
}

enum TagType {
  CountryStringency,
  CountryTopicAttention,
  CountryTotal,
}

type Tag = {
  typ: TagType;
  title: string;
};

// export const addTag = (tag: Tag) => ({
//   type: Action.AddTag,
//   payload: {
//     id: tag.title,
//   },
// });

// let nextTodoId = 0;
// export const addTodo = content => ({
//   type: Action.AddTODO,
//   payload: {
//     id: ++nextTodoId,
//     content
//   }
// });

export { TagType, Action };
export type { Tag };

// export const toggleTodo = id => ({
//   type: TOGGLE_TODO,
//   payload: { id }
// });

// export const setFilter = filter => ({ type: SET_FILTER, payload: { filter } });
