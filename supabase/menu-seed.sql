-- ============================================================================
-- RCC Cafe — Menu items seed for public.menu_items
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. Seeds the cafe menu (drinks + food) so the admin
-- Menu module shows editable rows and the public Menu page can read live data.
-- Uses a name-based guard so re-running does not create duplicates.
-- Editors can change prices, descriptions, images and availability afterwards
-- from the admin Menu module.
-- ============================================================================

insert into public.menu_items (name, category, description, price, active, featured, sort_order)
select v.name, v.category, v.description, v.price, true, v.featured, v.sort_order
from (values
  -- ----------------------------- Hot Drinks --------------------------------
  ('Black (Espresso / Short Black / Americano / Long Black)', 'Hot Drinks', null, 4.50, false, 1),
  ('Flat White', 'Hot Drinks', 'from', 5.50, false, 2),
  ('Latte', 'Hot Drinks', 'from', 5.50, false, 3),
  ('Cappuccino', 'Hot Drinks', 'from', 5.50, false, 4),
  ('Mocca', 'Hot Drinks', 'from', 6.00, false, 5),
  ('Hot Chocolate', 'Hot Drinks', 'from', 5.50, false, 6),
  ('Dirty Chai', 'Hot Drinks', null, 7.00, false, 7),
  ('Fluffy', 'Hot Drinks', null, 2.50, false, 8),
  -- ----------------------------- Non-Coffee --------------------------------
  ('Matcha Latte', 'Non-Coffee', null, 7.00, false, 1),
  ('Turmeric Latte', 'Non-Coffee', null, 7.00, false, 2),
  ('Chai Latte', 'Non-Coffee', null, 7.00, false, 3),
  ('Spicy Chai', 'Non-Coffee', null, 6.00, false, 4),
  ('Ginger Lemon Honey', 'Non-Coffee', null, 4.50, false, 5),
  -- -------------------------------- Tea ------------------------------------
  ('English Breakfast', 'Tea', null, 4.50, false, 1),
  ('Earl Grey / Peppermint', 'Tea', null, 4.50, false, 2),
  -- ----------------------------- Cold Drinks -------------------------------
  ('Iced Americano', 'Cold Drinks', null, 6.00, false, 1),
  ('Iced Latte', 'Cold Drinks', null, 6.50, false, 2),
  ('Iced Cappuccino', 'Cold Drinks', null, 6.50, false, 3),
  ('Iced Mocha', 'Cold Drinks', null, 6.50, false, 4),
  ('Iced Chocolate', 'Cold Drinks', null, 6.50, false, 5),
  ('Iced Matcha', 'Cold Drinks', null, 7.00, false, 6),
  ('Iced Strawberry Matcha', 'Cold Drinks', null, 8.00, false, 7),
  ('Iced Caramel Latte', 'Cold Drinks', null, 9.00, false, 8),
  ('Iced Pistachio Latte', 'Cold Drinks', null, 9.00, false, 9),
  ('Iced Biscoff Latte', 'Cold Drinks', null, 9.00, false, 10),
  ('Iced Turmeric Latte', 'Cold Drinks', null, 8.00, false, 11),
  -- ------------------------------- Frappe ----------------------------------
  ('Choco / Caramel', 'Frappe', null, 10.00, false, 1),
  ('Coffee / Mocha / Matcha', 'Frappe', null, 10.00, false, 2),
  ('Matcha Strawberry', 'Frappe', null, 10.00, false, 3),
  ('Biscoff / Pistachio', 'Frappe', null, 10.00, false, 4),
  -- ----------------------------- Smoothies ---------------------------------
  ('Berry / Banana / Mango', 'Smoothies', null, 9.00, false, 1),
  -- ------------------------------- Shake -----------------------------------
  ('Nutella / Oreo', 'Shake', null, 10.00, false, 1),
  ('Biscoff / Pistachio Shake', 'Shake', null, 10.00, false, 2),
  ('Mango / Banana Shake', 'Shake', null, 10.00, false, 3),
  -- ------------------------------- Extras ----------------------------------
  ('Shot / Decaf / Vanilla / Caramel / Hazelnut / Soy / Almond / Coconut / Oat Milk', 'Extras', null, 0.50, false, 1),
  -- -------------------------------- Food -----------------------------------
  ('Turbo Wedges', 'Food', null, 9.99, true, 1),
  ('Turbo Nuggets', 'Food', null, 9.99, true, 2),
  ('Wedges + Nuggets', 'Food', null, 17.99, true, 3),
  ('RC Turbo Corn Chips + Dips', 'Food', null, 6.99, false, 4),
  ('Fresh Toastie', 'Food', 'Ham & Cheese / Cheese Only', 8.99, true, 5),
  ('Fresh Toastie + Corn Chips + Dips', 'Food', null, 16.99, false, 6),
  ('RC Corn Dog Turbo', 'Food', 'Cheese & Sausage / Mozzarella / Potato Cheese Corndog', 12.99, false, 7),
  ('RC Jalapeno Bites', 'Food', null, 9.99, false, 8),
  ('RC Loaded Chicken Strips', 'Food', null, 12.99, true, 9)
) as v(name, category, description, price, featured, sort_order)
where not exists (
  select 1 from public.menu_items m where m.name = v.name
);
