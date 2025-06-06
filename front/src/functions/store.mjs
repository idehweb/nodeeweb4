import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import pkg from 'redux-thunk';
const thunk = pkg.default || pkg;
import { persistReducer, persistStore } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage.js';

import reducer from './reducer.mjs';

const createNoopStorage = () => ({
  getItem: async (_key) => null,
  setItem: async (_key, value) => value,
  removeItem: async (_key) => {},
});

const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : createNoopStorage();

const persistConfig = {
  key: 'nodeeweb',
  storage,
};

export const storeProducts = (data) => ({
  type: 'STORE_PRODUCTS',
  payload: data,
});

export const storeChat = (data) => ({
  type: 'STORE_CHAT',
  payload: data,
});
export const storePosts = (data) => ({
  type: 'STORE_POSTS',
  payload: data,
});
export const storeProduct = (data) => ({
  type: 'STORE_PRODUCT',
  payload: data,
});
export const storeAttrValue = (data) => ({
  type: 'STORE_ATTR_VALUE',
  payload: data,
});

const pReducer = persistReducer(persistConfig, reducer);

const middlewares = [thunk];

const isDev = process.env.NODE_ENV === 'development1';

// if (isDev) {
//   // Dynamically import redux-logger only in dev (ESM way)
//   import('redux-logger').then(({ logger }) => {
//     middlewares.push(logger);
//   });
// }

const store = createStore(pReducer, applyMiddleware(...middlewares));
const persistor = persistStore(store);

export { store, persistor };
export default store;
