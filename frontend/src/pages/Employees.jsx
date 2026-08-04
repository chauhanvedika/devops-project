import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../api/AuthContext.jsx';

const emptyForm = { full_name: '', email: '', position: '', department_id: '', salary: '', hire_date: '' };

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [emps, depts] = await Promise.all([api.getEmployees(), api.getDepartments()]);
      setEmployees(emps);
      setDepartments(depts);
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
      department_id: form.department_id || null,
      salary: form.salary ? Number(form.salary) : 0,
      hire_date: form.hire_date || null,
    };
    try {
      if (editingId) {
        await api.updateEmployee(editingId, payload);
      } else {
        await api.createEmployee(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      full_name: emp.full_name,
      email: emp.email,
      position: emp.position || '',
      department_id: emp.department_id || '',
      salary: emp.salary || '',
      hire_date: emp.hire_date ? emp.hire_date.slice(0, 10) : '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await api.deleteEmployee(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading employees...</p>;

  return (
    <div>
      <h1>Employees</h1>
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <form className="crud-form" onSubmit={handleSubmit}>
          <input placeholder="Full name" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="Position" value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <select value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
            <option value="">No department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="number" placeholder="Salary" value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          <input type="date" value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update' : 'Add'} Employee</button>
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Position</th><th>Department</th><th>Salary</th><th>Hire Date</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.full_name}</td>
              <td>{emp.email}</td>
              <td>{emp.position}</td>
              <td>{emp.department_name || '—'}</td>
              <td>₹{Number(emp.salary).toLocaleString()}</td>
              <td>{emp.hire_date ? emp.hire_date.slice(0, 10) : '—'}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEdit(emp)}>Edit</button>
                  <button onClick={() => handleDelete(emp.id)} className="delete-btn">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
