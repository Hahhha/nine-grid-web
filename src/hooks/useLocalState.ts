import { useEffect, useState } from "react";
import { readLocalStorage, writeLocalStorage } from "../storage/localStore";

export function useLocalState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readLocalStorage(key, initialValue));

  useEffect(() => {
    writeLocalStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
