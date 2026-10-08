import type { Money } from './api';

export type ResourceType = 'FABRIC' | 'OTHER';

export interface Resource {
  id: number;
  name: string;
  resource_type: ResourceType;
  resource_type_display?: string;
  unit_of_measurement: string;
  brand: number | null;
  brand_name: string | null;
  current_stock_quantity: Money;
  unit_cost: Money;
  reorder_level: Money;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ResourcePurchase {
  id: number;
  resource: number;
  resource_name: string;
  resource_type: ResourceType;
  unit_of_measurement: string;
  quantity: Money;
  unit_cost: Money;
  total_cost: Money;
  supplier_name?: string;
  invoice_number?: string;
  purchase_date: string;
  recorded_by?: number;
  recorded_by_name?: string;
  notes?: string;
  created_at?: string;
}

/** A resource allocated to an order (GET /api/orders/orders/{id}/resources/). */
export interface OrderResourceUsage {
  id: number;
  order: number;
  order_code?: string;
  order_item: number | null;
  resource: number;
  resource_name: string;
  resource_type: ResourceType;
  resource_type_display?: string;
  quantity_used: Money;
  unit_of_measurement: string;
  unit_cost: Money;
  total_cost: Money;
  notes?: string;
  created_at?: string;
}

/** Resource line as embedded inside cost reports. */
export interface CostResourceLine {
  id: number;
  resource_id: number;
  resource_name: string;
  resource_type: ResourceType;
  quantity_used: Money;
  unit_of_measurement: string;
  unit_cost: Money;
  total_cost: Money;
  order_item_id: number | null;
  notes?: string;
}

export interface CostFinancials {
  revenue: Money;
  subtotal?: Money;
  fabric_cost?: Money;
  fabric_quantity_kg?: Money;
  other_resources_cost?: Money;
  total_resources_cost?: Money;
  other_expenses_cost?: Money;
  total_manufacturing_cost: Money;
  cost_per_unit_average: Money;
  net_profit: Money;
  profit_margin_percent: number;
}

export interface CostItemBreakdown {
  item_id: number;
  product_name: string;
  size?: string;
  colour?: string;
  fabric_gsm?: string;
  printing_method?: string;
  quantity: number;
  unit_selling_price: Money;
  total_selling_price: Money;
  unit_manufacturing_cost: Money;
  total_manufacturing_cost: Money;
  unit_profit: Money;
  total_profit: Money;
  profit_margin_percent: number;
}

export interface OrderCost {
  order_id: string;
  brand: string;
  customer: string;
  status: string;
  is_manufacture_finished: boolean;
  production_job_status?: string;
  created_at?: string;
  expected_delivery_date?: string;
  total_units_produced: number;
  financials: CostFinancials;
  resources_used?: CostResourceLine[];
  items_breakdown?: CostItemBreakdown[];
}

export interface OrderCostBreakdown extends OrderCost {
  customer_details?: {id: number;company_name: string;contact_person: string;email: string;phone: string;};
  brand_details?: {id: number;name: string;positioning: string;};
  billing_status?: {subtotal: Money;total_amount: Money;paid_amount: Money;balance_amount: Money;deposit_required: Money;};
}

export interface ManufacturingCostReport {
  report_name: string;
  aggregate_totals: {
    total_orders_reported: number;
    finished_manufacture_orders_count: number;
    total_units_manufactured: number;
    total_revenue: Money;
    total_fabric_cost?: Money;
    total_fabric_quantity_kg?: Money;
    total_other_resources_cost?: Money;
    total_raw_material_cost?: Money;
    total_other_expenses_cost?: Money;
    total_manufacturing_cost: Money;
    total_gross_profit: Money;
    overall_profit_margin_percent: number;
    average_cost_per_unit?: Money;
    average_selling_price_per_unit?: Money;
  };
  orders: OrderCost[];
}

export interface ResourcesExpenseReport {
  report_name: string;
  summary: {
    total_purchases_expense: Money;
    fabric_purchases: {total_cost: Money;total_quantity_kg: Money;avg_cost_per_kg: Money;};
    other_resources_purchases: {total_cost: Money;purchase_count: number;};
    current_inventory: {total_stock_valuation: Money;fabric_in_stock_kg: Money;total_active_resources: number;};
    used_in_production_orders: {fabric_used_kg: Money;fabric_used_cost: Money;other_resources_used_cost: Money;total_materials_cost_consumed: Money;};
  };
  stock_inventory: {
    id: number;
    name: string;
    resource_type: ResourceType;
    unit_of_measurement: string;
    current_stock_quantity: Money;
    unit_cost: Money;
    stock_valuation: Money;
    reorder_level: Money;
    is_low_stock: boolean;
  }[];
  purchases: {
    id: number;
    resource_id: number;
    resource_name: string;
    resource_type: ResourceType;
    quantity: Money;
    unit_of_measurement: string;
    unit_cost: Money;
    total_cost: Money;
    supplier_name?: string;
    invoice_number?: string;
    purchase_date: string;
    recorded_by?: string;
    notes?: string;
  }[];
}

/** Resource row being drafted inside the order form. */
export interface DraftResourceUsage {
  key: string;
  resource_id: number | null;
  quantity_used: string;
  notes: string;
}