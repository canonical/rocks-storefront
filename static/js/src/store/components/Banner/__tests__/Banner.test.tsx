import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Banner from "../Banner";

const mockSetSearchParams = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("react-router-dom", () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
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
