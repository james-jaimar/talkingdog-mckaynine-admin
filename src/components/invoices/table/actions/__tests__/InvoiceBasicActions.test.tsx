import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceBasicActions } from '../InvoiceBasicActions';
import { InvoiceStatus } from '@/hooks/invoices/types';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('InvoiceBasicActions', () => {
  const mockInvoice = {
    id: '123',
    status: 'draft' as InvoiceStatus,
    invoice_number: 'INV-001',
    client_id: 'client123',
    issued_date: '2024-04-16',
    due_date: '2024-05-16',
    payment_received: false,
    email_sent: false,
    subtotal: 100,
    tax_rate: 0.1,
    tax_amount: 10,
    total: 110,
    created_at: '2024-04-16',
    updated_at: '2024-04-16',
    discount_amount: 0,
    discount_type: 'fixed' as 'fixed' | 'percentage',
    discount_reason: null
  };

  const mockProps = {
    invoice: mockInvoice,
    isPending: false,
    onCloseDropdown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders view and edit buttons', () => {
    render(
      <BrowserRouter>
        <InvoiceBasicActions {...mockProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('navigates to view page when view button is clicked', () => {
    render(
      <BrowserRouter>
        <InvoiceBasicActions {...mockProps} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('View'));
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/123');
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('navigates to edit page when edit button is clicked', () => {
    render(
      <BrowserRouter>
        <InvoiceBasicActions {...mockProps} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/123/edit');
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('disables buttons when isPending is true', () => {
    render(
      <BrowserRouter>
        <InvoiceBasicActions {...{ ...mockProps, isPending: true }} />
      </BrowserRouter>
    );

    expect(screen.getByText('View')).toBeDisabled();
    expect(screen.getByText('Edit')).toBeDisabled();
  });

  it('disables edit button when invoice is paid', () => {
    render(
      <BrowserRouter>
        <InvoiceBasicActions 
          {...{ 
            ...mockProps, 
            invoice: { ...mockInvoice, status: 'paid' as InvoiceStatus } 
          }} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Edit')).toBeDisabled();
    expect(screen.getByText('View')).not.toBeDisabled();
  });
});
