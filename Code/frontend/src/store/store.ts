import {configureStore} from '@reduxjs/toolkit';
import navigationReducer from './navigationSlice';
import localeReducer from './localeSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    locale: localeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
