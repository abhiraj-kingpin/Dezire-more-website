import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { label: 'Home', line1: '', city: '', state: '', pin: '' };

function AddressBook({ compact = false, selectedId, onSelect }) {
  const { user, addAddress, updateAddress, deleteAddress } = useAuth();
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const addresses = user?.addresses || [];

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (addr) => {
    setForm({ label: addr.label, line1: addr.line1, city: addr.city, state: addr.state, pin: addr.pin });
    setEditingId(addr._id);
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.pin.trim()) {
      showToast('Please fill in the complete address', 'info');
      return;
    }
    setSaving(true);
    const result = editingId
      ? await updateAddress(editingId, form)
      : await addAddress(form);
    setSaving(false);
    if (result.success) {
      showToast(editingId ? 'Address updated' : 'Address saved', 'success');
      setFormOpen(false);
      if (!editingId && onSelect) {
        const newest = result.addresses[result.addresses.length - 1];
        if (newest) onSelect(newest);
      }
    } else {
      showToast(result.error || 'Could not save address', 'info');
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteAddress(id);
    if (result.success) showToast('Address removed', 'success');
  };

  const handleMakeDefault = async (addr) => {
    await updateAddress(addr._id, { isDefault: true });
  };

  return (
    <div className={`address-book ${compact ? 'address-book-compact' : ''}`}>
      {addresses.length === 0 && !formOpen && (
        <p className="address-empty">You don't have any saved addresses yet.</p>
      )}

      <div className="address-list">
        {addresses.map(addr => (
          <div
            key={addr._id}
            className={`address-card ${onSelect ? 'address-card-selectable' : ''} ${selectedId === addr._id ? 'selected' : ''}`}
            onClick={onSelect ? () => onSelect(addr) : undefined}
          >
            <div className="address-card-top">
              <span className="address-card-label">{addr.label}</span>
              {addr.isDefault && <span className="address-card-default">Default</span>}
            </div>
            <p className="address-card-text">{addr.line1}, {addr.city}, {addr.state} - {addr.pin}</p>
            <div className="address-card-actions">
              <button type="button" onClick={(e) => { e.stopPropagation(); openEditForm(addr); }}>Edit</button>
              {!addr.isDefault && (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleMakeDefault(addr); }}>Make Default</button>
              )}
              <button type="button" className="address-card-delete" onClick={(e) => { e.stopPropagation(); handleDelete(addr._id); }}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {formOpen ? (
        <form className="address-form" onSubmit={handleSave}>
          <div className="account-form-row">
            <div>
              <label className="auth-label">Label</label>
              <input className="auth-input" type="text" placeholder="Home / Work" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
          </div>
          <label className="auth-label">Address line 1</label>
          <input className="auth-input" type="text" placeholder="House no., street, locality" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} />
          <div className="account-form-row">
            <div>
              <label className="auth-label">City</label>
              <input className="auth-input" type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="auth-label">State</label>
              <input className="auth-input" type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
          </div>
          <label className="auth-label">PIN code</label>
          <input className="auth-input" type="text" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} />
          <div className="address-form-actions">
            <button type="button" className="btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="auth-submit" disabled={saving}>{saving ? 'Saving...' : 'Save Address'}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="address-add-btn" onClick={openAddForm}>+ Add New Address</button>
      )}
    </div>
  );
}

export default AddressBook;
