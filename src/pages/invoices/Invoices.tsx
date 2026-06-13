import { useState, useEffect } from 'react';
import { getInvoices, createInvoice, deleteInvoice, downloadInvoicePDF } from '../../api/invoiceAPI';
import { getClients } from '../../api/clientAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiDownload } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  brouillon: 'default', émise: 'info', payée: 'success'
};

interface InvoiceItem {
  designation: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  total: number;
}

interface InvoiceForm {
  clientName: string;
  clientAddress: string;
  client: string;
  discount: number;
  tva: number;
  paymentConditions: string;
  items: InvoiceItem[];
}

export default function Invoices() {
  const [invoices, setInvoices]       = useState<any[]>([]);
  const [clients, setClients]         = useState<any[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [modalOpen, setModalOpen]     = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<any>(null);
  const [saving, setSaving]           = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [form, setForm] = useState<InvoiceForm>({
    clientName: '', clientAddress: '', client: '',
    discount: 0, tva: 0, paymentConditions: '', items: []
  });

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    designation: '', quantity: 1, unit: 'Carton', unitPrice: 0, total: 0
  });

  const fetchAll = async () => {
    try {
      const [inv, cli] = await Promise.all([getInvoices(), getClients()]);
      setInvoices(inv.data);
      setClients(cli.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 60000);

  const handleClientSelect = (id: string) => {
    const client = clients.find(c => c._id === id);
    setForm(f => ({
      ...f,
      client: id,
      clientName: client?.name || '',
      clientAddress: client?.address || ''
    }));
  };

  const updateItemTotal = (item: InvoiceItem): InvoiceItem => ({
    ...item,
    total: Number(item.quantity) * Number(item.unitPrice)
  });

  const addItem = () => {
    if (!currentItem.designation || !currentItem.quantity || !currentItem.unitPrice) {
      toast.error("Remplissez tous les champs de l'article");
      return;
    }
    setForm(f => ({ ...f, items: [...f.items, updateItemTotal(currentItem)] }));
    setCurrentItem({ designation: '', quantity: 1, unit: 'Carton', unitPrice: 0, total: 0 });
  };

  const removeItem = (i: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subTotal = form.items.reduce((s, i) => s + i.total, 0);
  const totalHT  = subTotal - Number(form.discount || 0);
  const totalTTC = totalHT + (totalHT * Number(form.tva || 0) / 100);

  const handleSubmit = async () => {
    if (!form.clientName || !form.items.length) {
      toast.error('Client et articles obligatoires');
      return;
    }
    setSaving(true);
    try {
      await createInvoice({ ...form, subTotal, totalHT, totalTTC });
      toast.success('Facture créée !');
      setModalOpen(false);
      setForm({ clientName: '', clientAddress: '', client: '', discount: 0, tva: 0, paymentConditions: '', items: [] });
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteInvoice(selected._id);
      toast.success('Facture supprimée !');
      setDeleteModal(false);
      fetchAll();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleDownload = async (invoice: any) => {
    setDownloading(invoice._id);
    try {
      const res = await downloadInvoicePDF(invoice._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Facture-${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé !');
    } catch { toast.error('Erreur téléchargement'); }
    finally { setDownloading(null); }
  };

  const columns = [
    { header: 'N° Facture', render: (i: any) => <span className="font-mono font-semibold text-blue-900">{i.invoiceNumber}</span> },
    { header: 'Client',     key: 'clientName' },
    { header: 'Total HT',   render: (i: any) => <span>{formatAmount(i.totalHT)} GNF</span> },
    { header: 'Total TTC',  render: (i: any) => <span className="font-semibold">{formatAmount(i.totalTTC)} GNF</span> },
    { header: 'Statut',     render: (i: any) => <Badge label={i.status} variant={statusVariant[i.status] || 'default'} /> },
    { header: 'Date',       render: (i: any) => <span className="text-sm text-gray-500">{formatDate(i.createdAt)}</span> },
    { header: 'Actions',    render: (i: any) => (
      <div className="flex items-center gap-2">
        <button onClick={() => handleDownload(i)} disabled={downloading === i._id}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50">
          <FiDownload size={15} />
        </button>
        <button onClick={() => { setSelected(i); setDeleteModal(true); }}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Factures</h1>
          <p className="text-gray-500 text-sm">{invoices.length} facture(s)</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="primary">
          <FiPlus size={18} /> Nouvelle facture
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={invoices} loading={loading} emptyMessage="Aucune facture" />
      </div>

      {/* Modal Créer Facture */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle facture" size="xl">
        <div className="space-y-5">

          {/* Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sélectionner un client</label>
              <select value={form.client} onChange={(e) => handleClientSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="">Client manuel...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Adresse client" value={form.clientAddress}
              onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} />
            <Input label="Nom client" value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
            <Input label="Conditions de paiement" value={form.paymentConditions}
              onChange={(e) => setForm({ ...form, paymentConditions: e.target.value })} />
          </div>

          {/* Ajouter article */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ajouter un article</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-500">Désignation</label>
                <input value={currentItem.designation}
                  onChange={(e) => setCurrentItem({ ...currentItem, designation: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                  placeholder="Ex: Maquereau" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Unité</label>
                <select value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                  <option>Carton</option>
                  <option>Kg</option>
                  <option>Unité</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Quantité</label>
                <input type="number" value={currentItem.quantity} min="1"
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-500">Prix unitaire (GNF)</label>
                <input type="number" value={currentItem.unitPrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              </div>
            </div>
            <Button onClick={addItem} variant="secondary" size="sm" className="mt-3">
              <FiPlus size={14} /> Ajouter
            </Button>
          </div>

          {/* Articles */}
          {form.items.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    {['Désignation', 'Qté', 'Unité', 'Prix unit.', 'Total', ''].map(h => (
                      <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{item.designation}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.unit}</td>
                      <td className="px-4 py-2">{formatAmount(Number(item.unitPrice))} GNF</td>
                      <td className="px-4 py-2 font-semibold">{formatAmount(item.total)} GNF</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
          {form.items.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-semibold">{formatAmount(subTotal)} GNF</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Remise (GNF)</span>
                <input type="number" value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  className="w-28 px-2 py-1 border rounded text-sm text-right focus:outline-none" />
              </div>
              <div className="flex justify-between">
                <span>Total HT</span>
                <span className="font-semibold">{formatAmount(totalHT)} GNF</span>
              </div>
              <div className="flex justify-between items-center">
                <span>TVA (%)</span>
                <input type="number" value={form.tva}
                  onChange={(e) => setForm({ ...form, tva: Number(e.target.value) })}
                  className="w-28 px-2 py-1 border rounded text-sm text-right focus:outline-none" />
              </div>
              <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2 text-base">
                <span>TOTAL TTC</span>
                <span>{formatAmount(Math.round(totalTTC))} GNF</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Créer la facture</Button>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Supprimer la facture <strong>{selected?.invoiceNumber}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}