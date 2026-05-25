import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("App renders the public landing page hero at root route", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { level: 1, name: /relacji, społeczności i działania/i }),
  ).toBeDefined();
});
