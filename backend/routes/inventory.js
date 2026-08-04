const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

function validateItemInput(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (body.quantity !== undefined && (isNaN(body.quantity) || Number(body.quantity) < 0)) {
    errors.push('quantity must be a non-negative number');
  }
  if (body.unit_price !== undefined && (isNaN(body.unit_price) || Number(body.unit_price) < 0)) {
    errors.push('unit_price must be a non-negative number');
  }
  return errors;
}

router.use(authenticate);

// GET /api/inventory - list all items with category name and low-stock flag
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.id, i.name, i.quantity, i.unit_price, i.reorder_level,
             c.id AS category_id, c.name AS category_name,
             (i.quantity <= i.reorder_level) AS low_stock
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory - create (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  const errors = validateItemInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const { name, category_id = null, quantity = 0, unit_price = 0, reorder_level = 10 } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO inventory_items (name, category_id, quantity, unit_price, reorder_level)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), category_id, quantity, unit_price, reorder_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating item:', err.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/inventory/:id - update (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid item id' });

  const errors = validateItemInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const { name, category_id = null, quantity = 0, unit_price = 0, reorder_level = 10 } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory_items SET name=$1, category_id=$2, quantity=$3, unit_price=$4, reorder_level=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name.trim(), category_id, quantity, unit_price, reorder_level, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating item:', err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/inventory/:id - admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid item id' });
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting item:', err.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
