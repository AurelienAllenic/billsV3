/**
 * @jest-environment jsdom
 */

import Dashboard from "../containers/Dashboard";
import { screen, fireEvent } from "@testing-library/dom";
import '@testing-library/jest-dom';
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes";
import { bills } from "../fixtures/bills";
import $ from 'jquery';
import { localStorageMock } from "../__mocks__/localStorage.js"

jest.mock("../app/format.js", () => ({
  formatDate: jest.fn((date) => date),
  formatStatus: jest.fn((status) => status),
}));

jest.mock("../__mocks__/store");

// Mock jQuery
$.fn.modal = jest.fn(); // Mock jQuery modal function
$.fn.click = jest.fn(); // Mock jQuery click function

describe("Dashboard", () => {
  document.body.innerHTML = `<div id="arrow-icon1"></div>
                             <div id="arrow-icon2"></div>
                             <div id="arrow-icon3"></div>
                             <div id="status-bills-container1"></div>
                             <div id="status-bills-container2"></div>
                             <div id="status-bills-container3"></div>
                             <div id="modaleFileAdmin1" class="modal"></div>`;
  
  const onNavigate = jest.fn();
  const dashboard = new Dashboard({
    document, 
    onNavigate, 
    store: mockStore, 
    bills, 
    localStorage: window.localStorage
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem('user', JSON.stringify({ email: "employee@test.com" }));
  });

  describe("handleShowTickets", () => {
    test("It should render ticket cards", () => {
      dashboard.handleShowTickets(new Event('click'), 1);
      expect($.fn.click).toHaveBeenCalled();
      expect(screen.getByTestId('status-bills-container1').innerHTML).toContain('bill-card');
    });
  });

  describe("handleClickIconEye", () => {
    test("It should open a modal when icon eye is clicked", () => {
      document.body.innerHTML = `<div data-testid="icon-eye" data-bill-url="http://example.com"></div>`;
      const iconEye = screen.getByTestId('icon-eye');
      iconEye.addEventListener('click', dashboard.handleClickIconEye);
      fireEvent.click(iconEye);
      expect($.fn.modal).toHaveBeenCalled();
    });
  });

  describe("handleEditTicket", () => {
    test("It should toggle edit form", () => {
      const bill = bills[0];
      dashboard.handleEditTicket(new Event('click'), bill);
      expect(screen.getByTestId('dashboard-form')).toBeInTheDocument();
    });
  });

  describe("handleAcceptSubmit", () => {
    test("It should submit accepted status", () => {
      const bill = bills[0];
      dashboard.handleAcceptSubmit(new Event('click'), bill);
      expect(mockStore.bills().update).toHaveBeenCalledWith({
        data: JSON.stringify({...bill, status: 'accepted'}),
        selector: bill.id,
      });
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
    });
  });

  describe("handleRefuseSubmit", () => {
    test("It should submit refused status", () => {
      const bill = bills[0];
      dashboard.handleRefuseSubmit(new Event('click'), bill);
      expect(mockStore.bills().update).toHaveBeenCalledWith({
        data: JSON.stringify({...bill, status: 'refused'}),
        selector: bill.id,
      });
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
    });
  });

  describe("getBillsAllUsers", () => {
    test("It should fetch bills for all users", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: jest.fn().mockResolvedValue(bills),
      }));
      const fetchedBills = await dashboard.getBillsAllUsers();
      expect(fetchedBills).toHaveLength(bills.length);
    });
  });

  // test d'intégration GET
describe("Given I am a user connected as Admin", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Dashboard)
      await waitFor(() => screen.getByText("Validations"))
      const contentPending  = await screen.getByText("En attente (1)")
      expect(contentPending).toBeTruthy()
      const contentRefused  = await screen.getByText("Refusé (2)")
      expect(contentRefused).toBeTruthy()
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  })
})
});
