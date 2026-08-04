const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

function validateEmployeeInput(body) {
  const errors = [];
  if (!body.full_name || typeof body.full_name !== 'string' || !body.full_name.trim()) {
    errors.push('full_name is required');
  }
  if (!body.email || typeof body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push('a valid email is required');
  }
  if (body.salary !== undefined && (isNaN(body.salary) || Number(body.salary) < 0)) {
    errors.push('salary must be a non-negative number');
  }
  if (body.department_id !== undefined && body.department_id !== null && isNaN(parseInt(body.department_id, 10))) {
    errors.push('department_id must be an integer');
  }
  return errors;
}

// All employee routes require a valid login
router.use(authenticate);

// GET /api/employees - list all (any authenticated user)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.full_name, e.email, e.position, e.salary, e.hire_date,
             d.id AS department_id, d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err.message);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/employees - create (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  const errors = validateEmployeeInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const { full_name, email, position = '', department_id = null, salary = 0, hire_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO employees (full_name, email, position, department_id, salary, hire_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE)) RETURNING *`,
      [full_name.trim(), email.trim(), position, department_id, salary, hire_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }
    console.error('Error creating employee:', err.message);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id - update (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee id' });

  const errors = validateEmployeeInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const { full_name, email, position = '', department_id = null, salary = 0, hire_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employees SET full_name=$1, email=$2, position=$3, department_id=$4, salary=$5, hire_date=COALESCE($6, hire_date)
       WHERE id=$7 RETURNING *`,
      [full_name.trim(), email.trim(), position, department_id, salary, hire_date || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating employee:', err.message);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id - admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee id' });
  try {
    const result = await pool.query('DELETE FROM employees WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting employee:', err.message);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
