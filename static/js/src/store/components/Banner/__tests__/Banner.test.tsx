import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Banner from "../Banner";

jest.mock("react-router-dom", () => ({
  useSearchParams: jest.fn(),
}));

describe("Banner Component", () => {
  test("should render the Banner component", () => {
    render(<Banner />);
    expect(
      screen.getByRole("heading", {
        name: /The Ubuntu-based container images store/i,
      })
    ).toBeInTheDocument();
  });
});
