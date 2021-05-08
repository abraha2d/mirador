import { useCallback, useEffect, useReducer } from "react";

const blacklistedTargets = ["INPUT", "TEXTAREA"];

type StateType = { [key: string]: boolean };
type ActionType =
  | {
      type: "SET_KEY_DOWN" | "SET_KEY_UP";
      key: string;
    }
  | { type: "RESET_KEYS"; data: { [key: string]: boolean } };

const keyReducer = (state: StateType, action: ActionType) => {
  switch (action.type) {
    case "SET_KEY_DOWN":
      return { ...state, [action.key]: true };
    case "SET_KEY_UP":
      return { ...state, [action.key]: false };
    case "RESET_KEYS":
      return { ...action.data };
    default:
      return state;
  }
};

export const useKeyboardShortcut = (
  shortcutKeys: string[],
  callback: (keys: StateType) => void
) => {
  const initialState = shortcutKeys.reduce((currentKeys: StateType, key) => {
    currentKeys[key.toLowerCase()] = false;
    return currentKeys;
  }, {});

  const [keyState, dispatch] = useReducer(keyReducer, initialState);

  const keydownListener = useCallback(
    (assignedKey) => (keydownEvent: KeyboardEvent) => {
      if (blacklistedTargets.includes((keydownEvent.target as Element).tagName))
        return;
      if (assignedKey === keydownEvent.key)
        dispatch({ type: "SET_KEY_DOWN", key: assignedKey });
    },
    []
  );

  const keyupListener = useCallback(
    (assignedKey) => (keyupEvent: KeyboardEvent) => {
      if (blacklistedTargets.includes((keyupEvent.target as Element).tagName))
        return;
      if (assignedKey === keyupEvent.key)
        dispatch({ type: "SET_KEY_UP", key: assignedKey });
    },
    []
  );

  useEffect(() => {
    if (!Object.values(keyState).filter((value) => !value).length) {
      callback(keyState);
      // setKeys({ type: "RESET_KEYS", data: initialState });
    }
  }, [callback, keyState]);

  useEffect(() => {
    shortcutKeys.forEach((k) =>
      window.addEventListener("keydown", keydownListener(k))
    );
    return () =>
      shortcutKeys.forEach((k) =>
        window.removeEventListener("keydown", keydownListener(k))
      );
  }, [keydownListener, shortcutKeys]);

  useEffect(() => {
    shortcutKeys.forEach((k) =>
      window.addEventListener("keyup", keyupListener(k))
    );
    return () =>
      shortcutKeys.forEach((k) =>
        window.removeEventListener("keyup", keyupListener(k))
      );
  }, [keyupListener, shortcutKeys]);
};
