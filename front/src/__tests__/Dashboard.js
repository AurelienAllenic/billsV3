/**
 * @jest-environment jsdom
 */

import Dashboard from "../containers/Dashboard";
import { screen, fireEvent} from "@testing-library/dom";
import '@testing-library/jest-dom';
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes";
import { bills } from "../fixtures/bills";
import $ from 'jquery';
import DashboardUI from '../views/DashboardUI.js';

jest.mock("../__mocks__/store", () => ({
  bills: jest.fn(() => ({
    update: jest.fn(),
  })),
}));

jest.mock("../app/format.js", () => ({
  formatDate: jest.fn((date) => date),
  formatStatus: jest.fn((status) => status),
}));

// Mock jQuery
$.fn.modal = jest.fn(); // Mock jQuery modal function
$.fn.click = jest.fn(); // Mock jQuery click function

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configuring localStorage
    window.localStorage.setItem('user', JSON.stringify({ email: "employee@test.com" }));
    // Mock window.onNavigate globally
    window.onNavigate = onNavigate;
  });
  // Configuring the DOM
  document.body.innerHTML = 
  `<div id="arrow-icon1"></div>
  <div id="arrow-icon2"></div>
  <div id="arrow-icon3"></div>
  <div id="status-bills-container1" data-testid="status-bills-container1"></div>
  <div id="status-bills-container2" data-testid="status-bills-container2"></div>
  <div id="status-bills-container3" data-testid="status-bills-container3"></div>
  <div id="modaleFileAdmin1" class="modal"></div>`;
  
  const onNavigate = jest.fn();

  // Creation of Dashboard object with mocks
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

  // Click on element shouèld trigger the tickets to be displayed
  describe("handleShowTickets", () => {
    test("It should render ticket cards", () => {
      dashboard.handleShowTickets(new Event('click'), 1, 1);
      expect($.fn.click).toHaveBeenCalled();
      expect(screen.getByTestId('status-bills-container1').innerHTML).toContain('bill-card');
    });
  });

  // Click on the icon eye should open the modal
  describe("handleClickIconEye", () => {
    test("It should open a modal when icon eye is clicked", () => {
      document.body.innerHTML = `<div data-testid="icon-eye" data-bill-url="http://example.com"></div>`;
      const iconEye = screen.getByTestId('icon-eye');
      iconEye.addEventListener('click', dashboard.handleClickIconEye);
      fireEvent.click(iconEye);
      expect($.fn.modal).toHaveBeenCalled();
    });
  });

  // Click on the edit button should open the edition form
  describe("handleEditTicket", () => {
    test("It should toggle edit form", () => {
      document.body.innerHTML = `
      <div class="dashboard-right-container">
        <div></div> <!-- This is where handleEditTicket will inject the form -->
      </div>
    `;
      const bill = bills[0];
      dashboard.handleEditTicket(new Event('click'), bill);
      expect(screen.getByTestId('dashboard-form')).toBeInTheDocument();
    });
  });

  // Is it possible to submit the form with status accepted 
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

  // Is it possible to submit the form with status refused
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

  // Is it possible to fetch bills for all users
  describe("getBillsAllUsers", () => {
    test("It should fetch bills for all users", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: jest.fn().mockResolvedValue(bills),
      }));
      const fetchedBills = await dashboard.getBillsAllUsers();
      expect(fetchedBills).toHaveLength(bills.length);
    });
  });

// GET Test for Dashboard
describe("When an error occurs on API", () => {
  test("fetches bills from an API and fails with 404 message error", async () => {
    // Creating bills.list to simulate 404 error
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: jest.fn(() => Promise.reject(new Error("Erreur 404")))
      };
    });

    try {
      await dashboard.getBillsAllUsers();
    } catch (error) {
      // Handle the error 404
      expect(error.message).toContain("Erreur 404");
    }
  });

  test("fetches messages from an API and fails with 500 message error", async () => {
    // Creating bills.list to simulate 500 error
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: jest.fn(() => Promise.reject(new Error("Erreur 500")))
      };
    });

    try {
      await dashboard.getBillsAllUsers();
    } catch (error) {
      // Handle the error 500
      expect(error.message).toContain("Erreur 500");
    }
  });
});  
});

// DashboardUI

describe('DashboardUI', () => {
  const setup = (data, loading, error) => {
    const htmlString = DashboardUI({ data, loading, error });
    document.body.innerHTML = htmlString;
  };

  afterEach(() => {
    document.body.innerHTML = ''; // Clean up the document body
  });

  test('should display loading page when loading is true', () => {
    setup(null, true, null);
    // Add assertions here to verify elements of the loading page
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should display error page when there is an error', () => {
    setup(null, false, 'Error message');
    // Add your assertions here to verify elements of the error page
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  test('should display dashboard content when data is provided', () => {
    const mockData = { bills: [{ status: 'pending' }, { status: 'accepted' }, { status: 'refused' }] };
    setup(mockData, false, null);
    expect(screen.getByTestId('arrow-icon1')).toBeInTheDocument();
  });
});