import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../api/client';

const COLORS = ['#0052cc', '#00875a', '#ff8b00', '#de350b', '#6554c0'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  const { totals, headcountByDept, inventoryValueByCategory, lowStockItems } = data;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">{totals.total_employees}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Inventory Items</span>
          <span className="stat-value">{totals.total_items}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Inventory Value</span>
          <span className="stat-value">₹{Number(totals.total_inventory_value).toLocaleString()}</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Low Stock Alerts</span>
          <span className="stat-value">{lowStockItems.length}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={headcountByDept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="employee_count" fill="#0052cc" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Inventory Value by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={inventoryValueByCategory}
                dataKey="total_value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {inventoryValueByCategory.map((entry, index) => (
                  <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="low-stock-panel">
          <h3>⚠ Low Stock Items</h3>
          <ul>
            {lowStockItems.map((item) => (
              <li key={item.id}>
                {item.name} — {item.quantity} left (reorder at {item.reorder_level})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
