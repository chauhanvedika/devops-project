import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../api/AuthContext.jsx';

const emptyForm = { name: '', category_id: '', quantity: '', unit_price: '', reorder_level: '10' };

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [inv, cats] = await Promise.all([api.getInventory(), api.getCategories()]);
      setItems(inv);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      category_id: form.category_id || null,
      quantity: Number(form.quantity) || 0,
      unit_price: Number(form.unit_price) || 0,
      reorder_level: Number(form.reorder_level) || 10,
    };
    try {
      if (editingId) {
        await api.updateItem(editingId, payload);
      } else {
        await api.createItem(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category_id: item.category_id || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      reorder_level: item.reorder_level,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteItem(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading inventory...</p>;

  return (
    <div>
      <h1>Inventory</h1>
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <form className="crud-form" onSubmit={handleSubmit}>
          <input placeholder="Item name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Quantity" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input type="number" step="0.01" placeholder="Unit price" value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          <input type="number" placeholder="Reorder level" value={form.reorder_level}
            onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update' : 'Add'} Item</button>
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>Quantity</th><th>Unit Price</th><th>Reorder Level</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.low_stock ? 'low-stock-row' : ''}>
              <td>{item.name} {item.low_stock && <span title="Low stock">⚠</span>}</td>
              <td>{item.category_name || '—'}</td>
              <td>{item.quantity}</td>
              <td>₹{Number(item.unit_price).toLocaleString()}</td>
              <td>{item.reorder_level}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
