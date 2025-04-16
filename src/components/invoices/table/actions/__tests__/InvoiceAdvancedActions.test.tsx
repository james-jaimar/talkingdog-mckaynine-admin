
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceAdvancedActions } from '../InvoiceAdvancedActions';
import { InvoiceStatus } from '@/hooks/invoices/types';

describe('InvoiceAdvancedActions', () => {
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
    onOpenTransferDialog: jest.fn(),
    onOpenDeleteDialog: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders transfer and delete buttons', () => {
    render(<InvoiceAdvancedActions {...mockProps} />);

    expect(screen.getByText('Transfer Invoice')).toBeInTheDocument();
    expect(screen.getByText('Delete Invoice')).toBeInTheDocument();
  });

  it('handles transfer action', () => {
    render(<InvoiceAdvancedActions {...mockProps} />);

    fireEvent.click(screen.getByText('Transfer Invoice'));
    expect(mockProps.onOpenTransferDialog).toHaveBeenCalledWith(mockInvoice);
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('handles delete action', () => {
    render(<InvoiceAdvancedActions {...mockProps} />);

    fireEvent.click(screen.getByText('Delete Invoice'));
    expect(mockProps.onOpenDeleteDialog).toHaveBeenCalled();
    expect(mockProps.onCloseDropdown).toHaveBeenCalled();
  });

  it('disables buttons when isPending is true', () => {
    render(<InvoiceAdvancedActions {...{ ...mockProps, isPending: true }} />);

    expect(screen.getByText('Transfer Invoice')).toBeDisabled();
    expect(screen.getByText('Delete Invoice')).toBeDisabled();
  });

  it('handles missing onOpenTransferDialog prop', () => {
    const { onOpenTransferDialog, ...propsWithoutTransfer } = mockProps;
    render(<InvoiceAdvancedActions {...propsWithoutTransfer} />);

    const transferButton = screen.getByText('Transfer Invoice');
    expect(transferButton).toHaveClass('opacity-50');
    expect(transferButton).toBeDisabled();
  });
});
