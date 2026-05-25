import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("App renders the public landing page hero", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { level: 1, name: /relacji, społeczności i działania/i }),
  ).toBeDefined();
});
