import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import ProfileForm from "../Profile/index"; 
import { updateEntityById } from "../../../../application/repository/entity.repository"; // Mocked API call

jest.mock("../../../../application/repository/entity.repository", () => ({
  updateEntityById: jest.fn(),
}));

describe("ProfileForm Component", () => {
  test("displays error message for invalid first name", () => {
    render(<ProfileForm />);
    const firstnameInput = screen.getByLabelText("First name"); // invalid first name

    fireEvent.change(firstnameInput, { target: { value: "A" } }); // validation error

    expect(
      screen.getByText("First name must be between 2 and 50 characters.")
    ).toBeInTheDocument();
  });

  test("does not show error message for valid first name", () => {
    render(<ProfileForm />);
    const firstnameInput = screen.getByLabelText("First name"); // valid first name

    fireEvent.change(firstnameInput, { target: { value: "Alice" } }); // no validation error

    expect(
      screen.queryByText("First name must be between 2 and 50 characters.")
    ).toBeNull();
  });

  test("displays error message for invalid email", () => {
    render(<ProfileForm />);
    const emailInput = screen.getByLabelText("Email"); // invalid email

    fireEvent.change(emailInput, { target: { value: "invalid-email" } }); //validation error

    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });

  test("does not show error message for valid email", () => {
    render(<ProfileForm />);
    const emailInput = screen.getByLabelText("Email"); // valid email

    fireEvent.change(emailInput, { target: { value: "test@example.com" } }); // no validation error

    expect(screen.queryByText("Invalid email address")).toBeNull();
  });

  test("triggers save action if validation passes", async () => {
    render(<ProfileForm />);
    const firstnameInput = screen.getByLabelText("First name");
    const lastnameInput = screen.getByLabelText("Last name");
    const emailInput = screen.getByLabelText("Email");
    const saveButton = screen.getByText("Save"); // valid data

    fireEvent.change(firstnameInput, { target: { value: "Alice" } });
    fireEvent.change(lastnameInput, { target: { value: "Smith" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } }); 

    fireEvent.click(saveButton); //expect mock data

    expect(updateEntityById).toHaveBeenCalledWith({
      routeUrl: "/users/1",
      body: {
        firstname: "Alice",
        lastname: "Smith",
        email: "test@example.com",
        pathToImage: "/placeholder.svg?height=80&width=80",
      },
    });
  });

  test("does not trigger save action if validation fails", () => {
    render(<ProfileForm />);
    const firstnameInput = screen.getByLabelText("First name");
    const saveButton = screen.getByText("Save"); // invalid data

    fireEvent.change(firstnameInput, { target: { value: "A" } }); 

    fireEvent.click(saveButton); // Expect block save

    expect(
      screen.getByText("First name must be between 2 and 50 characters.")
    ).toBeInTheDocument();
  });
});