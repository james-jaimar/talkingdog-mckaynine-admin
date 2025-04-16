
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceStatusActions } from '../InvoiceStatusActions';
import { InvoiceStatus } from '@/hooks/invoices/types';

// Mock the hooks
const mockMarkAsPaid = { mutate: jest.fn() };
const mockMarkAsSent = { mutate: jest.fn() };
const mockCancelInvoice = { mutate: jest.fn() };

jest.mock('@/hooks/useInvoices', () => ({
  useMarkInvoiceAsPaid: () => mockMarkAsPaid,
  useMarkInvoiceAsSent: () => mockMarkAsSent,
  useCancelInvoice: () => mockCancelInvoice
}));

describe('InvoiceStatusActions', () => {
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
    updated_at: '2024-04-16'
  };

  const mockProps = {
    invoice: mockInvoice,
    isPending: false,
    onCloseDropdown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all status action buttons', () => {
    render(<InvoiceStatusActions {...mockProps} />);

    expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
    expect(screen.getByText('Mark as Sent')).toBeInTheDocument();
    expect(screen.getByText('Cancel Invoice')).toBeInTheDocument();
  });

  it('handles mark as paid action', () => {
    render(<InvoiceStatusActions {...mockProps} />);

    fireEvent.click(screen.getByText('Mark as Paid'));
    expect(mockMarkAsPaid.mutate).toHaveBeenCalledWith('123');
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('handles mark as sent action', () => {
    render(<InvoiceStatusActions {...mockProps} />);

    fireEvent.click(screen.getByText('Mark as Sent'));
    expect(mockMarkAsSent.mutate).toHaveBeenCalledWith('123');
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('handles cancel invoice action', () => {
    render(<InvoiceStatusActions {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel Invoice'));
    expect(mockCancelInvoice.mutate).toHaveBeenCalledWith('123');
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('disables buttons when isPending is true', () => {
    render(<InvoiceStatusActions {...{ ...mockProps, isPending: true }} />);

    expect(screen.getByText('Mark as Paid')).toBeDisabled();
    expect(screen.getByText('Mark as Sent')).toBeDisabled();
    expect(screen.getByText('Cancel Invoice')).toBeDisabled();
  });

  it('disables appropriate buttons based on invoice status', () => {
    render(
      <InvoiceStatusActions 
        {...{ 
          ...mockProps, 
          invoice: { ...mockInvoice, status: 'paid' as InvoiceStatus } 
        }} 
      />
    );

    expect(screen.getByText('Mark as Paid')).toBeDisabled();
    expect(screen.getByText('Mark as Sent')).toBeDisabled();
    expect(screen.getByText('Cancel Invoice')).toBeDisabled();
  });
});
