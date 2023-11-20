/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import '@testing-library/jest-dom/extend-expect';
import NewBillUI from "../views/NewBillUI";
import mockStore from "../__mocks__/store";

// Mock store for create and update methods
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

// Define localStorage with localStorageMock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Setup user information in local storage
localStorage.setItem("user", JSON.stringify({ email: "john@doe.com" }));

describe("Given I am on NewBill Page", () => {
  let newBill;

  // Generating DOM for tests
  beforeEach(() => {
    document.body.innerHTML = `
      <form data-testid="form-new-bill">
        <div class="form-group">
          <label for="expense-type">Type de dépense</label>
          <select id="expense-type" data-testid="expense-type" class="form-control">
            <option value="Transport">Transport</option>
            <option value="Restaurants et bars">Restaurants et bars</option>
            <option value="Hôtel et logement">Hôtel et logement</option>
            <option value="Services en ligne">Services en ligne</option>
            <option value="IT et électronique">IT et électronique</option>
            <option value="Equipement et matériel">Equipement et matériel</option>
            <option value="Fournitures de bureau">Fournitures de bureau</option>
          </select>
        </div>
        <div class="form-group">
          <label for="expense-name">Nom de la dépense</label>
          <input type="text" id="expense-name" data-testid="expense-name" class="form-control" />
        </div>
        <div class="form-group">
          <label for="amount">Montant TTC</label>
          <input type="number" id="amount" data-testid="amount" class="form-control" />
        </div>
        <div class="form-group">
          <label for="vat">TVA</label>
          <input type="number" id="vat" data-testid="vat" class="form-control" />
        </div>
        <div class="form-group">
          <label for="pct">%</label>
          <input type="number" id="pct" data-testid="pct" class="form-control" />
        </div>
        <div class="form-group">
          <label for="datepicker">Date</label>
          <input type="date" id="datepicker" data-testid="datepicker" class="form-control" />
        </div>
        <div class="form-group">
          <label for="commentary">Commentaire</label>
          <textarea id="commentary" data-testid="commentary" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <label for="file">Justificatif</label>
          <input type="file" id="file" data-testid="file" class="form-control" />
        </div>
        <button type="submit" class="btn btn-primary">Envoyer</button>
      </form>
    `;

    // Creating a new bill object
    newBill = new NewBill({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });

    global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ message: "Bill created" })
    })
    );
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  
// Check if a new bill is created after submitting the form with valid values
  describe("When I submit the form with valid inputs", () => {
    test("Then a new bill should be created with POST request", async () => {
      // Remplir le formulaire
      fireEvent.input(screen.getByTestId("expense-type"), { target: { value: 'Transport' } });
      fireEvent.input(screen.getByTestId("expense-name"), { target: { value: 'Taxi ride' } });
      fireEvent.input(screen.getByTestId("amount"), { target: { value: '150' } });
      fireEvent.input(screen.getByTestId("vat"), { target: { value: '30' } });
      fireEvent.input(screen.getByTestId("pct"), { target: { value: '20' } });
      fireEvent.input(screen.getByTestId("datepicker"), { target: { value: '2023-01-01' } });
      fireEvent.input(screen.getByTestId("commentary"), { target: { value: 'Business trip to Paris' } });

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Attendre et vérifier si la méthode create a été appelée
      await waitFor(() => {
        expect(store.bills().update).toHaveBeenCalledWith(expect.anything());
      });
    })
  });
  // Check for method POST called after selected a file
  test("Then a POST request should be sent when a file is selected", async () => {
    // File selection
    const fileInput = screen.getByTestId("file");
    const file = new File(["file content"], "receipt.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait and check if the POST request has been called
    await waitFor(() => {
      expect(store.bills().create).toHaveBeenCalledWith(expect.anything());
    })
  })
});

//POST
describe("When I navigate to Dashboard employee", () => {
		test("Then a user post a new bill and I should add a bill from mock API POST", async () => {
			const billsPost = jest.spyOn(mockStore, "bills");
      // Using these infos from the store to compare it later
			const bill = {
				id: "47qAXb6fIm2zOKkLzMro",
				vat: "80",
				fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
				status: "pending",
				type: "Hôtel et logement",
				commentary: "séminaire billed",
				name: "encore",
				fileName: "preview-facture-free-201801-pdf-1.jpg",
				date: "2004-04-04",
				amount: 400,
				commentAdmin: "ok",
				email: "a@a",
				pct: 20,
			};
			const updatedPostBills = await mockStore.bills().update(bill);
			expect(billsPost).toHaveBeenCalledTimes(1);
			expect(updatedPostBills).toStrictEqual(bill);
		});
    // Tests for 404 and 500 errors
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
					})
				);

				document.body.innerHTML = NewBillUI();

			});
      // 404 test
			test("Add bills from an API and fails with 404 message error", async () => {
				const postSpy = jest.spyOn(console, "error");
        // Creating our store with bills and our two methods create and update
				const store = {
					bills: jest.fn(() => newBill.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error("404"))),
				};

				const newBill = new NewBill({ document, onNavigate, store, localStorage });
				newBill.isImgFormatValid = true;

				// Submit form
				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(postSpy).toBeCalledWith(new Error("404"));
			});
      // 500 test
			test("Add bills from an API and fails with 500 message error", async () => {
				const postSpy = jest.spyOn(console, "error");
      // Creating our store with bills and our two methods create and update
				const store = {
					bills: jest.fn(() => newBill.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error("500"))),
				};

				const newBill = new NewBill({ document, onNavigate, store, localStorage });
				newBill.isImgFormatValid = true;

				// Submit form
				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(postSpy).toBeCalledWith(new Error("500"));
			});
		});
})
