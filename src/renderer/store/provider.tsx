import { ReactNode, useMemo, useReducer } from 'react';

import appReducer, { initialState } from './reducer';
import AppStateContext from './reducerContext';

export default function AppStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
