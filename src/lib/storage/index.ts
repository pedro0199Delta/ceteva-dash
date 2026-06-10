import { usaKv } from "./types";
import { localStorage } from "./local";
import { kvStorage } from "./kv";

export function getStorage() {
  return usaKv() ? kvStorage : localStorage;
}

export { usaKv };
