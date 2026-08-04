const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard - aggregate stats for charts
router.get('/', async (req, res) => {
  try {
    const [headcountByDept, inventoryValue, lowStock, totals] = await Promise.all([
      pool.query(`
        SELECT d.name AS department, COUNT(e.id) AS employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id
        GROUP BY d.name ORDER BY d.name
      `),
      pool.query(`
        SELECT c.name AS category, COALESCE(SUM(i.quantity * i.unit_price), 0) AS total_value
        FROM categories c
        LEFT JOIN inventory_items i ON i.category_id = c.id
        GROUP BY c.name ORDER BY c.name
      `),
      pool.query(`
        SELECT id, name, quantity, reorder_level
        FROM inventory_items
        WHERE quantity <= reorder_level
        ORDER BY quantity ASC
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM employees) AS total_employees,
          (SELECT COUNT(*) FROM inventory_items) AS total_items,
          (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM inventory_items) AS total_inventory_value
      `),
    ]);

    res.json({
      totals: totals.rows[0],
      headcountByDept: headcountByDept.rows,
      inventoryValueByCategory: inventoryValue.rows,
      lowStockItems: lowStock.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
