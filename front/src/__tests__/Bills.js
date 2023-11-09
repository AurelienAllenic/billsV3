/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/dom';
import Bills from '../containers/Bills.js';
import { ROUTES_PATH } from '../constants/routes';
import { formatDate, formatStatus } from '../app/format.js';
import mockStore from '../__mocks__/store';

jest.mock('../app/format.js', () => ({
  formatDate: jest.fn(date => date),
  formatStatus: jest.fn(status => status),
}));

jest.mock('../__mocks__/store');

describe('Bills', () => {
  const onNavigate = jest.fn();
  const localStorageMock = {
    getItem: jest.fn(() => JSON.stringify({ type: 'Employee' })),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  const bills = new Bills({
    document,
    onNavigate,
    store: mockStore,
    localStorage: localStorageMock,
  });

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

  describe('When I am on Bills page and I click on the icon eye', () => {
    test('Then, the handleClickIconEye method should be called', () => {
      $.fn.modal = jest.fn(); // Mock jQuery modal function
      document.body.innerHTML = `
        <div data-testid="icon-eye" data-bill-url="http://example.com"></div>
        <div id="modaleFile" class="modal"></div>
      `;

      const iconEye = screen.getByTestId('icon-eye');
      iconEye.addEventListener('click', () => bills.handleClickIconEye(iconEye));

      fireEvent.click(iconEye);

      expect($.fn.modal).toHaveBeenCalledWith('show');
      expect(screen.getByTestId('modaleFile')).toHaveTextContent('http://example.com');
    });
  });

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
  });

  // Additional tests to cover other scenarios...
});
