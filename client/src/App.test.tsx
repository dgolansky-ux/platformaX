import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders PlatformaX V2 Foundation heading", () => {
  render(<App />);
  expect(
    screen.getByText("PlatformaX V2 Foundation"),
  ).toBeDefined();
});
