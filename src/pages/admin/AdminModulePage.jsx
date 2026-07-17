import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, Search, Send, Trash2 } from 'lucide-react'
import { MODULE_CONFIG } from '../../admin/adminConfig.js'
import { deleteRow, fetchRows, saveRow } from '../../admin/adminApi.js'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { AdminAlert, AdminBadge, AdminEmpty, AdminModal, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

export default function AdminModulePage({ moduleKey }) {
  const config = MODULE_CONFIG[moduleKey]
  const { role } = useAdminAuth()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState(null)
  const editable = config.fields?.length > 0 && !(role === 'staff' && moduleKey !== 'bookings')
  const canDelete = editable && role !== 'staff'

  const load = async () => {
    setLoading(true)
    const { data, error } = await fetchRows(config)
    setRows(data || [])
    if (error) {
      const code = error.code ? ` [${error.code}]` : ''
      setMessage({
        type: 'error',
        text: `Could not load ${config.title} from "${config.table}"${code}: ${error.message || 'Unknown error'}. Check that the Supabase SQL is installed and your role (super_admin/admin/manager) has access.`
      })
    } else {
      setMessage(null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [moduleKey])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => (config.search || []).some((key) => String(row[key] ?? '').toLowerCase().includes(needle)))
  }, [rows, query, config])

  const submit = async (values, file) => {
    if (moduleKey === 'notifications' && !editing?.id) {
      const { error } = await supabase.rpc('create_reward_notification', {
        p_title: values.title, p_message: values.message, p_type: values.notification_type || 'general',
        p_audience: values.audience || 'all', p_customer_email: values.target_customer_email || null,
        p_starts_at: values.starts_at || null, p_ends_at: values.ends_at || null,
        p_priority: Number(values.priority || 1), p_cta_label: values.cta_label || null, p_cta_url: values.cta_url || null
      })
      if (error) return toast.error(error.message)
      setEditing(null)
      toast.success('Reward notification published.')
      load()
      return
    }
    if (moduleKey === 'notifications' && editing?.id) {
      let targetId = null
      if (values.audience === 'customer') {
        const { data: target, error: targetError } = await supabase.from('reward_cards').select('id').ilike('email', String(values.target_customer_email || '').trim()).eq('active', true).maybeSingle()
        if (targetError || !target) return toast.error(targetError?.message || 'Customer reward card not found.')
        targetId = target.id
      }
      const { error } = await supabase.from('reward_notifications').update({ ...values, target_reward_card_id: targetId }).eq('id', editing.id)
      if (error) return toast.error(error.message)
      setEditing(null)
      toast.success('Reward notification updated.')
      load()
      return
    }
    let payload = values
    if (moduleKey === 'media' && file) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
      const folder = values.category?.replace(/^\/+|\/+$/g, '') || 'uploads'
      const storagePath = `${folder}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('rcc-media').upload(storagePath, file)
      if (uploadError) {
        setMessage({ type: 'error', text: uploadError.message })
        return
      }
      const { data: publicData } = supabase.storage.from('rcc-media').getPublicUrl(storagePath)
      payload = {
        ...values,
        file_url: publicData.publicUrl,
        file_type: file.type
      }
    }
    const { error } = await saveRow(config, payload, editing?.[config.primaryKey || 'id'])
    if (error) {
      toast.error(error.message)
      return
    }
    setEditing(null)
    toast.success(`${config.title} saved successfully.`)
    load()
  }

  const remove = async () => {
    const { error } = await deleteRow(config, confirmDelete[config.primaryKey || 'id'])
    setConfirmDelete(null)
    if (error) toast.error(error.message)
    else {
      toast.success('Record deleted.')
      load()
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="RCC Operations"
        title={config.title}
        description={config.description}
        action={editable ? <button type="button" onClick={() => setEditing({})} className="btn-primary min-h-11"><Plus size={17} />Add New</button> : null}
      />

      {message && <div className="mt-5"><AdminAlert type={message.type}>{message.text}</AdminAlert></div>}

      <div className="mt-6 rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-soft pl-10 pr-4 text-sm outline-none focus:border-orange-400" placeholder={`Search ${config.title.toLowerCase()}...`} />
          </label>
          <div className="text-xs font-bold text-muted">{filtered.length} record{filtered.length === 1 ? '' : 's'}</div>
        </div>

        {loading ? <div className="p-4"><AdminSkeleton rows={6} /></div> : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-bg-soft text-[10px] font-extrabold uppercase tracking-widest text-muted">
                  <tr>{config.columns.map(([key, label]) => <th key={key} className="px-4 py-3">{label}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => <AdminTableRow key={row.id || row.key || row.user_id} row={row} config={config} editable={editable} canDelete={canDelete} onEdit={setEditing} onDelete={setConfirmDelete} />)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {filtered.map((row) => <AdminMobileRow key={row.id || row.key || row.user_id} row={row} config={config} editable={editable} canDelete={canDelete} onEdit={setEditing} onDelete={setConfirmDelete} />)}
            </div>
          </>
        ) : (
          <div className="p-4"><AdminEmpty icon={config.icon} title={`No ${config.title.toLowerCase()} found`} description="Add a record or adjust your search filters." /></div>
        )}
      </div>

      {editing && <RecordForm config={config} row={editing} onClose={() => setEditing(null)} onSubmit={submit} />}
      {confirmDelete && (
        <AdminModal
          title="Delete this record?"
          description="This action cannot be undone."
          onClose={() => setConfirmDelete(null)}
          footer={<div className="flex justify-end gap-2"><button className="btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white" onClick={remove}><Trash2 size={16} />Delete</button></div>}
        >
          <p className="text-sm leading-relaxed text-muted">Please confirm that this operational record should be permanently removed.</p>
        </AdminModal>
      )}
    </div>
  )
}

function AdminTableRow({ row, config, editable, canDelete, onEdit, onDelete }) {
  return (
    <tr className="text-sm">
      {config.columns.map(([key]) => <td key={key} className="max-w-60 px-4 py-3 font-semibold text-charcoal-300">{formatCell(key, row[key])}</td>)}
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          {config.title === 'Bookings' && <button className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-orange-50 hover:text-orange-700" title="Email confirmation placeholder"><Send size={16} /></button>}
          {editable && <button className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-orange-50 hover:text-orange-700" onClick={() => onEdit(row)} aria-label="Edit"><Edit3 size={16} /></button>}
          {canDelete && <button className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>}
        </div>
      </td>
    </tr>
  )
}

function AdminMobileRow({ row, config, editable, canDelete, onEdit, onDelete }) {
  return (
    <article className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {config.columns.map(([key, label]) => (
          <div key={key} className="min-w-0">
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div>
            <div className="mt-1 truncate text-sm font-bold">{formatCell(key, row[key])}</div>
          </div>
        ))}
      </div>
      {editable && <div className="mt-4 flex gap-2"><button onClick={() => onEdit(row)} className="btn-outline min-h-10 flex-1 py-2"><Edit3 size={15} />Edit</button>{canDelete && <button onClick={() => onDelete(row)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-bold text-red-700"><Trash2 size={15} />Delete</button>}</div>}
    </article>
  )
}

function RecordForm({ config, row, onClose, onSubmit }) {
  const initial = Object.fromEntries((config.fields || []).map(([key, _label, type]) => {
    const value = row[key]
    if (type === 'json') return [key, value ? JSON.stringify(value, null, 2) : '{}']
    if (key === 'keywords' && Array.isArray(value)) return [key, value.join(', ')]
    return [key, value ?? (type === 'checkbox' ? false : '')]
  }))
  const [values, setValues] = useState(initial)
  const [file, setFile] = useState(null)
  const primaryValue = row[config.primaryKey || 'id']

  return (
    <AdminModal
      title={primaryValue ? `Edit ${config.title}` : `Add ${config.title}`}
      description="Fields are saved directly to Supabase under your role permissions."
      onClose={onClose}
      footer={<div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={() => onSubmit(values, file)}>Save Changes</button></div>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {config.table === 'media_library' && (
          <label className="sm:col-span-2">
            <span className="field-label">Upload File</span>
            <input type="file" accept="image/*,video/*" className="field-input file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-orange-700" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
        )}
        {config.fields.map(([key, label, type, options]) => (
          <AdminField key={key} fieldKey={key} label={label} type={type} options={options} value={values[key]} onChange={(value) => setValues((current) => ({ ...current, [key]: value }))} />
        ))}
      </div>
    </AdminModal>
  )
}

function AdminField({ fieldKey, label, type, options, value, onChange }) {
  const wide = ['textarea', 'json'].includes(type)
  if (type === 'checkbox') return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-4 sm:self-end">
      <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-orange-500" />
      <span className="text-sm font-bold">{label}</span>
    </label>
  )
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="field-label">{label}</span>
      {type === 'select' ? (
        <select className="field-input" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select...</option>
          {options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
        </select>
      ) : type === 'textarea' || type === 'json' ? (
        <textarea className={`field-input resize-y font-${type === 'json' ? 'mono' : 'sans'} min-h-28`} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="field-input" type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={['id', 'user_id'].includes(fieldKey) && Boolean(value)} />
      )}
    </label>
  )
}

function formatCell(key, value) {
  if (['status', 'reward_status', 'active', 'featured', 'is_popular', 'food_prepared', 'converted'].includes(key)) return <AdminBadge value={value} />
  if (value === null || value === undefined || value === '') return '-'
  if (key.includes('price')) return `$${Number(value).toFixed(2)}`
  if (key.includes('duration')) return `${value} min`
  if (key.endsWith('_at')) return new Date(value).toLocaleDateString('en-NZ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
