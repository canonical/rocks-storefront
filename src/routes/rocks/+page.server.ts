import { DeviceGW } from "$lib/server/store-api";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const deviceGW = new DeviceGW("rock");

  return {
    rocks: (await deviceGW.find({ query: "%" })).results as { name: string }[],
  };
};
