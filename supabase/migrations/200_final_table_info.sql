create table public.ru_order_items (
  id uuid not null default gen_random_uuid (),
  order_id character varying(20) not null,
  product_code character varying(20) not null,
  product_name character varying(200) null,
  requested_qty integer not null,
  confirmed_qty integer null,
  unit_price numeric null default 0,
  subtotal numeric null default 0,
  remarks text null,
  created_at timestamp with time zone null default now(),
  supply_price numeric null default 0,
  commission numeric null default 0,
  destination character varying(100) null,
  pcs_per_ctn integer null default 0,
  supply_total numeric null default 0,
  commission_total numeric null default 0,
  constraint ru_order_items_pkey primary key (id),
  constraint ru_order_items_order_id_fkey foreign KEY (order_id) references ru_orders (id) on delete CASCADE,
  constraint ru_order_items_requested_qty_check check ((requested_qty > 0))
) TABLESPACE pg_default;

create index IF not exists idx_ru_order_items_order on public.ru_order_items using btree (order_id) TABLESPACE pg_default;

create trigger tr_ru_order_items_totals
after INSERT
or DELETE
or
update on ru_order_items for EACH row
execute FUNCTION ru_update_order_totals ();




create table public.ru_orders (
  id character varying(20) not null default gen_random_uuid (),
  order_number character varying(20) not null,
  buyer_id uuid null,
  buyer_name character varying(100) null,
  order_date date null default CURRENT_DATE,
  desired_delivery character varying(100) null,
  status character varying(20) null default 'DRAFT'::character varying,
  total_qty integer null default 0,
  total_cartons integer null default 0,
  total_amount numeric null default 0,
  remarks text null,
  history jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  destination character varying(100) null,
  constraint ru_orders_pkey primary key (id),
  constraint ru_orders_order_number_key unique (order_number),
  constraint ru_orders_buyer_id_fkey foreign KEY (buyer_id) references ru_users (id),
  constraint ru_orders_status_check check (
    (
      (status)::text = any (
        (
          array[
            'DRAFT'::character varying,
            'CONFIRMED'::character varying,
            'PACKING'::character varying,
            'SHIPPED'::character varying,
            'COMPLETED'::character varying,
            'CANCELLED'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ru_orders_number on public.ru_orders using btree (order_number) TABLESPACE pg_default;

create index IF not exists idx_ru_orders_buyer on public.ru_orders using btree (buyer_id) TABLESPACE pg_default;

create index IF not exists idx_ru_orders_status on public.ru_orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_ru_orders_date on public.ru_orders using btree (order_date desc) TABLESPACE pg_default;

create trigger tr_ru_orders_updated BEFORE
update on ru_orders for EACH row
execute FUNCTION ru_update_timestamp ();


create table public.ru_packing_items (
  id uuid not null default gen_random_uuid (),
  packing_list_id character varying(50) not null,
  product_code character varying(20) not null,
  product_name character varying(200) null,
  qty integer not null,
  cartons integer null default 0,
  nw_kg numeric(10, 3) null default 0,
  gw_kg numeric(10, 3) null default 0,
  cbm numeric(10, 6) null default 0,
  pallets integer null default 0,
  created_at timestamp with time zone null default now(),
  pallet_number integer null,
  constraint ru_packing_items_pkey primary key (id),
  constraint ru_packing_items_packing_list_id_fkey foreign KEY (packing_list_id) references ru_packing_lists (pl_number) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ru_packing_items_pl on public.ru_packing_items using btree (packing_list_id) TABLESPACE pg_default;




create table public.ru_packing_lists (
  order_id character varying(20) not null,
  pl_number character varying(30) not null,
  invoice_number character varying(30) null,
  invoice_date date null,
  created_date date null default CURRENT_DATE,
  exporter_name character varying(100) null,
  exporter_address text null,
  exporter_tel character varying(50) null,
  exporter_fax character varying(50) null,
  consignee_name character varying(100) null,
  consignee_address text null,
  consignee_tel character varying(50) null,
  consignee_email character varying(100) null,
  manufacturer character varying(100) null,
  shipping_port character varying(50) null,
  departure_date date null,
  destination character varying(100) null,
  vessel_flight character varying(100) null,
  payment_term character varying(50) null,
  main_item character varying(100) null,
  hs_code character varying(20) null,
  commodity_desc text null,
  total_qty integer null default 0,
  total_cartons integer null default 0,
  total_nw_kg numeric(10, 2) null default 0,
  total_gw_kg numeric(10, 2) null default 0,
  total_cbm numeric(10, 4) null default 0,
  total_pallets integer null default 0,
  total_amount numeric(15, 2) null default 0,
  created_at timestamp with time zone null default now(),
  constraint ru_packing_lists_pkey primary key (pl_number),
  constraint ru_packing_lists_pl_number_key unique (pl_number),
  constraint ru_packing_lists_order_id_fkey foreign KEY (order_id) references ru_orders (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ru_packing_lists_order on public.ru_packing_lists using btree (order_id) TABLESPACE pg_default;



create table public.ru_prices (
  id uuid not null default gen_random_uuid (),
  product_code character varying(20) not null,
  supply_price numeric not null default 0,
  commission numeric not null default 0,
  final_price numeric not null default 0,
  effective_date date null default CURRENT_DATE,
  created_at timestamp with time zone null default now(),
  constraint ru_prices_pkey primary key (id),
  constraint ru_prices_product_code_fkey foreign KEY (product_code) references ru_products (product_code) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ru_prices_product on public.ru_prices using btree (product_code) TABLESPACE pg_default;

create index IF not exists idx_ru_prices_date on public.ru_prices using btree (effective_date desc) TABLESPACE pg_default;


create table public.ru_products (
  id uuid not null default gen_random_uuid (),
  product_code character varying(20) not null,
  name_ko character varying(200) not null,
  name_en character varying(200) null,
  name_ru character varying(200) null,
  barcode character varying(100) null,
  brand character varying(50) null,
  category character varying(50) null,
  volume character varying(20) null,
  pcs_per_carton integer null default 1,
  width_cm numeric(6, 2) null,
  height_cm numeric(6, 2) null,
  depth_cm numeric(6, 2) null,
  cbm numeric(10, 6) null,
  weight_kg numeric(8, 3) null,
  status character varying(20) null default 'active'::character varying,
  remarks text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  hscode character varying(20) null,
  constraint ru_products_pkey primary key (id),
  constraint ru_products_product_code_key unique (product_code),
  constraint ru_products_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'inactive'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ru_products_code on public.ru_products using btree (product_code) TABLESPACE pg_default;

create index IF not exists idx_ru_products_brand on public.ru_products using btree (brand) TABLESPACE pg_default;

create index IF not exists idx_ru_products_status on public.ru_products using btree (status) TABLESPACE pg_default;

create trigger tr_ru_products_updated BEFORE
update on ru_products for EACH row
execute FUNCTION ru_update_timestamp ();


create table public.ru_users (
  id uuid not null default gen_random_uuid (),
  email character varying(100) not null,
  name character varying(50) not null,
  role character varying(20) not null,
  org_name character varying(100) null,
  region_code character varying(5) null,
  phone character varying(30) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ru_users_pkey primary key (id),
  constraint ru_users_email_key unique (email),
  constraint ru_users_role_check check (
    (
      (role)::text = any (
        (
          array[
            'buyer'::character varying,
            'manager'::character varying,
            'supplier'::character varying,
            'admin'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ru_users_role on public.ru_users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_ru_users_region on public.ru_users using btree (region_code) TABLESPACE pg_default;

create trigger tr_ru_users_updated BEFORE
update on ru_users for EACH row
execute FUNCTION ru_update_timestamp ();



create table public.cm_erp_products (
  product_id text not null,
  name text not null,
  spec text null,
  created_at timestamp with time zone null default now(),
  bal_qty integer null default 0,
  warehouse_code text null default 'W104'::text,
  updated_at timestamp with time zone null default now(),
  constraint cm_erp_products_pkey primary key (product_id)
) TABLESPACE pg_default;



create table public.cm_production_lots (
  id serial not null,
  lot_number character varying(20) not null,
  product_id text not null,
  produced_qty integer not null,
  production_date date not null,
  expiry_date date null,
  created_at timestamp with time zone null default now(),
  constraint cm_production_lots_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_cm_lots_product on public.cm_production_lots using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_cm_lots_lot on public.cm_production_lots using btree (lot_number) TABLESPACE pg_default;

create index IF not exists idx_cm_lots_date on public.cm_production_lots using btree (production_date desc) TABLESPACE pg_default;



create view public.cm_product_lot_fifo as
select
  p.product_id,
  p.name as product_name,
  p.bal_qty as current_stock,
  array_agg(
    r.lot_number
    order by
      r.production_date desc,
      r.id desc
  ) as lot_numbers,
  array_agg(
    r.produced_qty
    order by
      r.production_date desc,
      r.id desc
  ) as produced_quantities,
  array_agg(
    r.remaining_qty
    order by
      r.production_date desc,
      r.id desc
  ) as remaining_quantities,
  array_agg(
    r.status
    order by
      r.production_date desc,
      r.id desc
  ) as lot_statuses,
  sum(r.remaining_qty) as total_remaining
from
  cm_erp_products p
  cross join lateral cm_calculate_lot_remaining (p.product_id) r (
    id,
    lot_number,
    produced_qty,
    remaining_qty,
    production_date,
    expiry_date,
    status
  )
where
  p.bal_qty > 0
group by
  p.product_id,
  p.name,
  p.bal_qty;




create view public.cm_product_lots_array as
select
  p.product_id,
  p.name as product_name,
  p.bal_qty as current_stock,
  array_agg(
    l.lot_number
    order by
      l.production_date desc
  ) as lot_numbers,
  array_agg(
    l.produced_qty
    order by
      l.production_date desc
  ) as lot_quantities,
  array_agg(
    l.production_date
    order by
      l.production_date desc
  ) as lot_dates,
  array_agg(
    l.expiry_date
    order by
      l.production_date desc
  ) as lot_expiries,
  sum(l.produced_qty) as total_produced
from
  cm_erp_products p
  left join cm_production_lots l on p.product_id = l.product_id
group by
  p.product_id,
  p.name,
  p.bal_qty;




  create view public.cm_lot_inventory as
select
  p.product_id,
  p.name as product_name,
  p.bal_qty as current_stock,
  r.id,
  r.lot_number,
  r.produced_qty,
  r.remaining_qty,
  r.production_date,
  r.expiry_date,
  r.status
from
  cm_erp_products p
  cross join lateral cm_calculate_lot_remaining (p.product_id) r (
    id,
    lot_number,
    produced_qty,
    remaining_qty,
    production_date,
    expiry_date,
    status
  )
where
  p.bal_qty > 0;



  create view public.cm_lots_expiring_soon as
select
  cm_lot_inventory.product_id,
  cm_lot_inventory.product_name,
  cm_lot_inventory.current_stock,
  cm_lot_inventory.id,
  cm_lot_inventory.lot_number,
  cm_lot_inventory.produced_qty,
  cm_lot_inventory.remaining_qty,
  cm_lot_inventory.production_date,
  cm_lot_inventory.expiry_date,
  cm_lot_inventory.status
from
  cm_lot_inventory
where
  cm_lot_inventory.remaining_qty > 0
  and cm_lot_inventory.expiry_date is not null
  and cm_lot_inventory.expiry_date <= (CURRENT_DATE + '3 mons'::interval)
order by
  cm_lot_inventory.expiry_date;


  