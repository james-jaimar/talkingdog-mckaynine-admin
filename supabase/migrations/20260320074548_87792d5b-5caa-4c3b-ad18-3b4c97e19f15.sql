CREATE TABLE invoice_additional_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(invoice_id, client_id)
);

ALTER TABLE invoice_additional_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for now" ON invoice_additional_recipients FOR ALL USING (true);