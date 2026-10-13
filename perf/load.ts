import { check, sleep } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";
import { rockPaths } from "../e2e/rock-paths.ts";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const options: Options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 20 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/`);
  const paths = rockPaths(res.body as string);
  if (paths.length === 0) {
    throw new Error("expected the home page to list at least one rock");
  }
  return { paths };
}

export default function ({ paths }: { paths: string[] }) {
  const home = http.get(`${BASE_URL}/`, { tags: { page: "home" } });
  check(home, { "home is 200": (r) => r.status === 200 });
  sleep(1);

  const path = paths[Math.floor(Math.random() * paths.length)];
  const rock = http.get(`${BASE_URL}${path}`, { tags: { page: "rock" } });
  check(rock, { "rock is 200": (r) => r.status === 200 });
  sleep(1);
}
