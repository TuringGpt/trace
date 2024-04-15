import { useContext } from 'react';

import AppStateContext from './reducerContext';

export default function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }
  return context;
}
