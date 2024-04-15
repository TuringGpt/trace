import React, { createContext } from 'react';

import { Action } from './actions';
import { AppState } from './reducer';

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export default AppStateContext;
