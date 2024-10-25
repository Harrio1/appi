import { combineReducers } from "redux";
import someReducer from './someReducer';
import anotherReducer from './anotherReducer';

const allReducers = combineReducers({
    some: someReducer,
    another: anotherReducer
});

export default allReducers;
