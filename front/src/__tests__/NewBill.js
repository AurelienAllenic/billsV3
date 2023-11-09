/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill";
import { ROUTES_PATH } from "../constants/routes";
import { screen, fireEvent } from "@testing-library/dom";
import '@testing-library/jest-dom/extend-expect';

// Mock store
const store = {
  bills: () => ({
    create: jest.fn(() => Promise.resolve({ fileUrl: "www.example.com/file.pdf", key: "1234" })),
    update: jest.fn(() => Promise.resolve({})),
  }),
};

// Mock navigation
const onNavigate = jest.fn();

// Mock local storage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Setup user information in local storage
localStorage.setItem("user", JSON.stringify({ email: "john@doe.com" }));

describe("Given I am on NewBill Page", () => {
  document.body.innerHTML = `<form data-testid="form-new-bill">
    <input data-testid="file" type="file" />
    <input data-testid="datepicker" />
    <select data-testid="expense-type">
      <option value="Transport">Transport</option>
    </select>
    <input data-testid="expense-name" />
    <input data-testid="amount" />
    <input data-testid="vat" />
    <input data-testid="pct" />
    <textarea data-testid="commentary"></textarea>
  </form>`;

  const newBill = new NewBill({
    document,
    onNavigate,
    store,
    localStorage: window.localStorage,
  });

  describe("When I select a file", () => {
    test("Then the handleChangeFile should be called", () => {
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [new File(["file"], "file.jpg", { type: "image/jpg" })] } });

      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  describe("When I submit the form with valid inputs", () => {
    test("Then the handleSubmit should be called", () => {
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  
  // Additional tests can be added here
});
