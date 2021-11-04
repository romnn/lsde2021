import { Action } from "../actions";
import { AnyAction } from "redux";

enum TagType {
  CountryStringency,
  CountryTopicAttention,
  CountryTotal,
}

type Tag = {
  typ: TagType;
  title: string;
};

type TagState = {
  readonly activeTags: Tag[];
};

const initialState: TagState = {
  activeTags: [],
};

export { TagType };
export type { TagState, Tag };

export default function tagReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case Action.AddTag: {
      const { tag } = action.payload;
      return {
        ...state,
        activeTags: [...state.activeTags, tag],
      };
    }
    case Action.RemoveTag: {
      const { tag } = action.payload;
      return {
        ...state,
        activeTags: state.activeTags.filter((t) => t.title != tag.title),
      };
    }

    default:
      return state;
  }
}
