// import { ADD_TODO, TOGGLE_TODO } from "../actionTypes";
// import { ADD_TODO, TOGGLE_TODO } from "../actionTypes";
import { Action } from "../actions";
// import { initialState } from "../index";
import { AnyAction } from "redux";

interface TagState {
  activeTags: string[];
}

const initialState: TagState = {
  activeTags: [],
};

export type { TagState };
// interface TagPayload {
//   id: string;
// }

// interface ActionBlob {
//   type: Action;
//   payload: TagPayload;
// }

export default function counterReducer(
  state = initialState,
  action: AnyAction
) {
  switch (action.type) {
    case Action.AddTag: {
      console.log(action);
      const { id } = action.payload;
      return {
        ...state,
        activeTags: [...state.activeTags, id],
        // allIds: [...state.allIds, id],
        // byIds: {
        //   ...state.byIds,
        //   [id]: {
        //     content,
        //     completed: false,
        //   },
        // },
      };
    }
    default:
      return state;
  }
}

// export default function (state = initialState, action: ActionBlob) {
//   switch (action.type) {
//     case Action.AddTag: {
//       console.log(action);
//       const { id } = action.payload;
//       return {
//         ...state,
//         activeTags: [...state.activeTags, id],
//         // allIds: [...state.allIds, id],
//         // byIds: {
//         //   ...state.byIds,
//         //   [id]: {
//         //     content,
//         //     completed: false,
//         //   },
//         // },
//       };
//     }
//     // case TOGGLE_TODO: {
//     //   const { id } = action.payload;
//     //   return {
//     //     ...state,
//     //     byIds: {
//     //       ...state.byIds,
//     //       [id]: {
//     //         ...state.byIds[id],
//     //         completed: !state.byIds[id].completed,
//     //       },
//     //     },
//     //   };
//     // }
//     default:
//       return state;
//   }
// }
