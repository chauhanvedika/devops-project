-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Users (for login/auth) - separate from employees so system accounts
-- aren't required to be real employees
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    position VARCHAR(100),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    salary NUMERIC(10, 2) CHECK (salary >= 0),
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO departments (name) VALUES
    ('Engineering'), ('Sales'), ('Warehouse'), ('HR')
ON CONFLICT DO NOTHING;

INSERT INTO categories (name) VALUES
    ('Electronics'), ('Office Supplies'), ('Raw Materials')
ON CONFLICT DO NOTHING;

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

-- Default admin user: username=admin, password=Admin@12345
-- CHANGE THIS PASSWORD IMMEDIATELY after first login in any real deployment.
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2b$10$h4ThLNDNnggDgdZPDYEiM.KwrY0QhCTzf8gaLIwbPtLb5PuCXe5hK', 'admin')
ON CONFLICT DO NOTHING;
