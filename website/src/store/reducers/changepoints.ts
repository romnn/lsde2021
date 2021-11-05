import { Action } from "../actions";
import { AnyAction } from "redux";

type ChangepointState = {
  readonly changepoint: Date | undefined;
};

const initialState: ChangepointState = {
  changepoint: undefined,
};

export type { ChangepointState };

export default function changepointReducer(
  state = initialState,
  action: AnyAction
) {
  switch (action.type) {
    case Action.SelectChangepoint: {
      const { changepoint } = action.payload;
      return {
        ...state,
        changepoint,
      };
    }

    default:
      return state;
  }
}
