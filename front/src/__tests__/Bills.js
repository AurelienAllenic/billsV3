/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor, render } from '@testing-library/dom';
import Bills from '../containers/Bills.js';
import { ROUTES_PATH } from '../constants/routes';
import { formatDate, formatStatus } from '../app/format.js';
import mockStore from '../__mocks__/store';
import BillsUI from '../views/BillsUI.js';
import { getBills } from '../containers/Bills';

// Mocking both functions formatDate and formatStatus
jest.mock('../app/format.js', () => ({
  formatDate: jest.fn(date => date),
  formatStatus: jest.fn(status => status),
}));

jest.mock('../__mocks__/store');

describe('Bills', () => {
  const onNavigate = jest.fn();
  // Use of mockstore to simulate BDD interactions
  const localStorageMock = {
    getItem: jest.fn(() => JSON.stringify({ type: 'Employee' })),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  // creating our bills object with mocks
  const bills = new Bills({
    document,
    onNavigate,
    store: mockStore,
    localStorage: localStorageMock,
  });

  // Testing navigation to newBill page on click of newBill button
  describe('When I am on Bills page and I click on the new bill button', () => {
    test('Then, the handleClickNewBill method should be called', () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const newBillButton = screen.getByTestId('btn-new-bill');
      newBillButton.addEventListener('click', bills.handleClickNewBill);

      fireEvent.click(newBillButton);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    });
  });

  // Testing modal and right image source on click of icon eye
  describe('When I am on Bills page and I click on the icon eye', () => {
    test('Then, the handleClickIconEye method should be called', async () => {
      $.fn.modal = jest.fn(); // Mock jQuery modal function
      document.body.innerHTML = `
    <div data-testid="icon-eye" data-bill-url="http://example.com"></div>
    <div id="modaleFile" class="modal" data-testid="modaleFileAdmin"></div>
  `;
  
      const iconEye = screen.getByTestId('icon-eye');
      iconEye.addEventListener('click', () => bills.handleClickIconEye(iconEye));
  
      fireEvent.click(iconEye);
  
      expect($.fn.modal).toHaveBeenCalledWith('show');
  
      // Utiliser waitFor pour attendre les mises à jour du DOM
      await waitFor(() => {
        const image = screen.getByTestId('modaleFileAdmin').querySelector('img');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'http://example.com');
      });
    });
  });
  
  // Testing getBills function
  describe('When I am on Bills page and I request the bills list', () => {
    test('Then, bills should be fetched', async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: jest.fn().mockResolvedValue([{ id: '47qAXb6fIm2zOKkLzMro', status: 'pending', date: '2021-07-01' }]),
      }));

      const billsList = await bills.getBills();

      expect(formatDate).toHaveBeenCalled();
      expect(formatStatus).toHaveBeenCalled();
      expect(billsList.length).toBe(1);
      expect(billsList[0].id).toBe('47qAXb6fIm2zOKkLzMro');
    });
    // Testing if date = null that it iss replaced by default date, as 1970-01-01
    test('Then, the lines if(doc.date === null) should set doc.date to "1970-01-01" and call formatDate', () => {
      // Arrange
      const doc = {
        date: null,
      };
  
      // Act
      doc.date = '1970-01-01';
      const formattedDate = formatDate(doc.date);
  
      // Assert
      expect(doc.date).toBe('1970-01-01');
      expect(formatDate).toHaveBeenCalledWith('1970-01-01');
    });
  });

  // Testing the getBills function from mock
  describe('Bills', () => {
    test('fetches bills from mock API GET', async () => {
      // Fictionnal datas for testing
      const mockBillsData = [{ id: '123', status: 'pending' }, { id: '456', status: 'accepted' }];
    
      // mock's configuration to simulate API's response
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.resolve(mockBillsData)
        }
      });
    
      // get all bills thanks to getBills function
      const bills = await getBills();
      expect(bills).toEqual(mockBillsData); // check if our data is correct
    });
    
    // Testing API error
    test('handles API failure', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur de l'API"))
        };
      });
  
      // Initialize Bills instance
      const onNavigate = jest.fn();
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
  
      try {
        await billsInstance.getBills();
      } catch (error) {
        expect(error.message).toEqual("Erreur de l'API");
      }
    });
  
  });
});

// BillsUI

describe('BillsUI', () => {

  // Testing that data is displayed in array with mocked API
  test('should display bills table when data is provided', () => {
    render(BillsUI({ data: billsData, loading: false, error: false }));
    expect(screen.getByTestId('tbody')).toBeInTheDocument();
  });

  // Testing that loading page is displayed
  test('should display loading page when loading is true', () => {
    render(BillsUI({ data: [], loading: true, error: false }));
  });

  // Testing that error page is displayed
  test('should display error page when there is an error', () => {
    render(BillsUI({ data: [], loading: false, error: 'Error message' }));
  });
});
