-- Demo data, loaded only when SEED_DEMO=true and the tables are empty
INSERT INTO employees (full_name, email, position, department_id, salary, hire_date) VALUES
    ('Asha Rao', 'asha.rao@example.com', 'Backend Engineer', 1, 85000, '2023-04-10'),
    ('Vikram Shah', 'vikram.shah@example.com', 'Sales Executive', 2, 60000, '2022-11-01'),
    ('Meera Nair', 'meera.nair@example.com', 'Warehouse Supervisor', 3, 52000, '2021-06-15')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (name, category_id, quantity, unit_price, reorder_level) VALUES
    ('Laptop - Dell 5420', 1, 12, 65000, 5),
    ('A4 Paper Ream', 2, 8, 250, 15),
    ('Steel Sheet 2mm', 3, 40, 900, 10)
ON CONFLICT DO NOTHING;
