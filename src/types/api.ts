export type Role = 'ADMIN' | 'SALES' | 'PRODUCTION' | 'STORE_KEEPER' | 'ACCOUNTS' | 'DELIVERY';
export type Money = string;

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  user_type: Role;
  role_display?: string;
  department?: string;
  phone?: string;
  permissions?: string[];
}

export interface StaffUser extends AuthUser {
  is_active: boolean;
  date_joined: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user?: AuthUser;
}

export interface Brand {
  id: number;
  company_name: string;
  name: string;
  code: string;
  positioning: string;
  description?: string;
  logo?: string | null;
  is_active: boolean;
}

export type CustomerType = 'CORPORATE' | 'RETAIL' | 'EVENT_ORGANIZER' | 'GOVERNMENT';

export interface Customer {
  id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  whatsapp: string;
  email: string;
  customer_type: CustomerType;
  billing_address: string;
  delivery_address: string;
  tax_number: string;
  general_notes: string;
  total_purchases: Money;
  total_paid: Money;
  outstanding_balance: Money;
  total_orders_count: number;
  created_at: string;
}

export interface CustomerNote {
  id: number;
  user_name: string;
  note: string;
  created_at: string;
}

export interface CustomerDocument {
  id: number;
  title?: string;
  document_type?: string;
  file: string;
  created_at?: string;
}

export interface CustomerDetail extends Customer {
  notes: CustomerNote[];
  documents: CustomerDocument[];
}

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTATION_SENT' | 'CONVERTED' | 'LOST';

export interface Inquiry {
  id: number;
  brand: number;
  brand_name: string;
  customer: number | null;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  product_name: string;
  quantity: number;
  fabric_gsm: string;
  printing_method: string;
  requirements: string;
  status: InquiryStatus;
  source: string;
  created_at: string;
}

export interface Product {
  id: number;
  brand: number;
  brand_name: string;
  name: string;
  code: string;
  product_type: string;
  default_gsm: string;
  fabric_composition: string;
  base_price: Money;
  description: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: number;
  product: number;
  product_name: string;
  brand: number;
  brand_name: string;
  sku: string;
  colour: string;
  size: string;
  fabric_gsm?: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
  unit_cost: Money;
}

export interface StockReservation {
  id: number;
  order?: number;
  order_id_code?: string;
  inventory_sku: string;
  quantity: number;
  status: string;
  notes?: string;
  created_at?: string;
}

export interface StockMovement {
  id: number;
  inventory_sku: string;
  movement_type: string;
  movement_type_display?: string;
  quantity: number;
  reference: string;
  logged_by_name: string;
  notes: string;
  timestamp: string;
}

export interface DamagedStock {
  id: number;
  inventory_sku: string;
  brand_name: string;
  quantity: number;
  reason: string;
  logged_by_name: string;
  created_at: string;
}

export interface LineItem {
  id?: number;
  product: number;
  product_name: string;
  quantity: number;
  size: string;
  colour: string;
  sizes?: string[];
  colours?: string[];
  fabric_gsm?: string;
  printing_method?: string;
  unit_price: Money;
  total_price: Money;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface Quotation {
  id: number;
  quotation_number: string;
  customer: number;
  customer_name: string;
  customer_company: string;
  brand: number;
  brand_name: string;
  status: QuotationStatus;
  validity_date: string;
  payment_terms: string;
  artwork_charges?: Money;
  delivery_charges?: Money;
  discount_amount?: Money;
  tax_rate_percent?: Money;
  tax_amount?: Money;
  subtotal: Money;
  total_amount: Money;
  notes?: string;
  created_by_name?: string;
  created_at?: string;
  items?: LineItem[];
}

export type OrderStatus =
'CUSTOMER_INQUIRY' |
'QUOTATION' |
'QUOTATION_APPROVED' |
'DEPOSIT_PENDING' |
'DEPOSIT_RECEIVED' |
'ORDER_CONFIRMED' |
'STOCK_RESERVED' |
'ARTWORK_APPROVED' |
'PRODUCTION' |
'QUALITY_CHECK' |
'PACKING' |
'READY_FOR_DELIVERY' |
'DELIVERY' |
'INVOICE' |
'PAYMENT_COMPLETED' |
'ORDER_CLOSED' |
'CANCELLED';

export interface Order {
  id: number;
  order_id: string;
  brand: number;
  brand_name: string;
  customer: number;
  customer_name: string;
  customer_company: string;
  quotation?: number | null;
  status: OrderStatus;
  expected_delivery_date: string;
  total_amount: Money;
  paid_amount: Money;
  balance_amount: Money;
  created_by_name?: string;
  created_at?: string;
}

export interface ArtworkSummary {
  id: number;
  title: string;
  version: number;
  status: string;
  is_locked: boolean;
}

export interface Artwork extends ArtworkSummary {
  order: number;
  order_code?: string;
  file?: string;
  color_codes?: string;
  dimensions?: string;
  placement?: string;
  approved_by_name?: string;
  approved_at?: string | null;
  rejection_notes?: string;
  created_at?: string;
}

export type StageName = 'CUTTING' | 'PRINTING' | 'EMBROIDERY' | 'SEWING' | 'FINISHING' | 'PACKING';

export interface WipItem {
  id: number;
  product: number;
  product_name: string;
  brand: number;
  brand_name: string;
  sku: string;
  colour: string;
  size: string;
  fabric_gsm?: string;
  stage_completed: StageName;
  stage_completed_display?: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  source_order?: number | null;
  source_order_code?: string | null;
  notes?: string;
  created_at?: string;
}

export interface ProductionStage {
  id?: number;
  stage_name: string;
  quantity_to_inventory?: number;
  semi_finished_count?: number;
  extra_pieces?: number;
  extra_quantity?: number;
  quantity_to_next_stage?: number;
  stage_name_display?: string;
  sequence_order?: number;
  target_quantity?: number;
  completed_quantity: number;
  damaged_quantity?: number;
  damaged_reason?: string;
  status: string;
  assigned_staff_name?: string;
  start_time?: string;
  completion_time?: string;
}

export interface ProductionJob {
  id: number;
  order?: number;
  order_code?: string;
  brand_name?: string;
  status: string;
  stages: ProductionStage[];
}

export interface Delivery {
  id: number;
  delivery_number: string;
  order: number;
  order_code: string;
  brand_name: string;
  customer_name: string;
  delivery_address: string;
  status: string;
  status_display?: string;
  courier_name?: string;
  tracking_number?: string;
  dispatched_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  recipient_name?: string;
}

export interface DeliveryNote {
  document_title: string;
  delivery_number: string;
  order_id: string;
  brand: {name: string;company: string;positioning: string;};
  customer: {company_name: string;contact_person: string;phone: string;delivery_address: string;};
  dispatch_details: {courier_name: string;tracking_number: string;dispatched_date: string;status: string;};
  items: {product_name: string;colour: string;size: string;colours?: string[];sizes?: string[];fabric_gsm: string;quantity: number;printing_method: string;}[];
  total_packages_or_pieces: number;
  special_instructions: string;
  issued_at: string;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  order?: number;
  order_code?: string;
  customer_name?: string;
  customer_company?: string;
  brand_name?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: Money;
  discount_amount?: Money;
  tax_amount?: Money;
  delivery_fee?: Money;
  total_amount: Money;
  paid_amount: Money;
  balance_amount: Money;
  status: string;
  brand?: number;
  customer?: number;
  deposit_percentage?: Money;
  deposit_amount?: Money;
  payment_terms?: string;
  is_deposit_only?: boolean;
}

export interface Bill {
  id: number;
  bill_number: string;
  invoice?: number;
  invoice_number?: string;
  order?: number;
  order_code?: string;
  customer_name?: string;
  customer_company?: string;
  brand_name?: string;
  amount: Money;
  is_deposit_only: boolean;
  deposit_percentage?: Money;
  total_order_amount?: Money;
  balance_remaining?: Money;
  bill_date?: string;
  notes?: string;
}

export interface ConvertInvoiceResult {
  message: string;
  order: {order_id: string;status: string;total_amount: Money;paid_amount: Money;balance_amount: Money;};
  payment: {payment_id: string;amount: Money;payment_type: string;payment_method: string;reference_number?: string;};
  bill: {bill_number: string;amount: Money;is_deposit_only: boolean;deposit_percentage: Money;balance_remaining: Money;notes?: string;};
}

/** Payment the server creates automatically on deposit / payment-completed transitions. */
export interface AutoPayment {
  payment_id: string;
  amount: Money;
  payment_type: string;
  payment_method: string;
}

export interface AutoPaymentResult {
  id: number;
  order_id: string;
  status: OrderStatus;
  total_amount: Money;
  paid_amount?: Money;
  balance_amount?: Money;
  auto_payment?: AutoPayment | null;
}

export interface InvoiceLine {
  id?: number;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: Money;
  total_price: Money;
}

export interface InvoiceDetail extends Invoice {
  items?: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id?: number;
  payment_id: string;
  order?: number;
  order_code?: string;
  invoice?: number | null;
  customer_name?: string;
  amount: Money;
  payment_type: string;
  payment_type_display?: string;
  payment_method: string;
  payment_method_display?: string;
  reference_number?: string;
  payment_date?: string;
  recorded_by_name?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  order: number;
  order_code: string;
  expense_type: string;
  expense_type_display?: string;
  amount: Money;
  description: string;
  is_actual: boolean;
  expense_date: string;
  recorded_by_name?: string;
}

export interface OrderDocument {
  id: number;
  document_type: string;
  document_type_display?: string;
  title: string;
  file: string;
  notes?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface ProfitSummary {
  revenue: Money;
  total_expenses: Money;
  estimated_profit: Money;
  profit_margin_percent: number;
  expense_count: number;
}

export interface OrderDetail extends Order {
  customer_phone?: string;
  delivery_address?: string;
  printing_embroidery_requirements?: string;
  subtotal?: Money;
  artwork_charges?: Money;
  delivery_charges?: Money;
  discount_amount?: Money;
  tax_amount?: Money;
  deposit_required?: Money;
  production_process_order?: StageName[];
  start_from_stage?: StageName | null;
  items: LineItem[];
  artworks?: ArtworkSummary[];
  stock_reservations?: StockReservation[];
  production_job?: ProductionJob | null;
  invoices?: Invoice[];
  payments?: Payment[];
  documents?: OrderDocument[];
  profit_summary?: ProfitSummary;
}

export interface AuditEntry {
  id: number;
  user_name: string;
  user_role?: string;
  action: string;
  object_repr?: string;
  order_id?: string | null;
  brand_name?: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  details?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  order_id: string | null;
  target_role: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  financial_kpis: {total_revenue: Money;total_collected: Money;total_outstanding: Money;};
  order_kpis: {total_orders: number;active_orders: number;status_breakdown: Record<string, number>;};
  brand_comparison: {brand_id: number;brand_name: string;positioning: string;revenue: Money;orders_count: number;}[];
  action_alerts_summary: Record<string, number>;
}

export interface SystemAlert {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  order_id?: string;
  title: string;
  message: string;
  target_role?: string;
}

export interface AlertsResponse {
  total_alerts: number;
  alerts: SystemAlert[];
}

export interface ProfitRow {
  order_id?: string;
  brand?: string;
  month?: string;
  customer?: string;
  revenue: Money;
  costs?: Record<string, Money>;
  total_cost: Money;
  net_profit: Money;
  profit_margin_percent: number;
}

export interface ReportsData {
  sales_by_brand: {brand: string;positioning: string;orders_count: number;total_sales: Money;}[];
  top_customers: {customer_id: number;customer_name: string;contact_person: string;type: string;total_purchases: Money;orders_count: number;}[];
  top_products: {product_name: string;brand: string;units_sold: number;revenue: Money;}[];
  cancelled_orders_count: number;
}