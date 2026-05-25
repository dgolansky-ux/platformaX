import { expect, test } from "vitest";
import { getHealthStatus } from "./index";

test("health status returns ok", () => {
  const status = getHealthStatus();
  expect(status.status).toBe("ok");
  expect(status.version).toBe("0.0.1");
  expect(status.timestamp).toBeTruthy();
});
