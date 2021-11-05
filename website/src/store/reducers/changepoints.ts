import { Tag } from "./tags";
import { Action } from "../actions";
import { AnyAction } from "redux";

type ChangepointState = {
  readonly changepoint: Date | undefined;
  readonly tag: Tag | undefined;
};

const initialState: ChangepointState = {
  changepoint: undefined,
  tag: undefined,
};

export type { ChangepointState };

export default function changepointReducer(
  state = initialState,
  action: AnyAction
) {
  switch (action.type) {
    case Action.SelectChangepoint: {
      const { changepoint, tag } = action.payload;
      return {
        ...state,
        changepoint,
        tag,
      };
    }

    default:
      return state;
  }
}
