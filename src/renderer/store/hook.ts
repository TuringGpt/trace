import { useContext } from 'react';
import AppStateContext from './reducerContext';
import { APP_STATE_HOOK_ERROR } from '../../constants';

export default function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error(APP_STATE_HOOK_ERROR);
  }

  return context;
}
