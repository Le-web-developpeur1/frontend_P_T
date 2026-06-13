import { useState, useEffect } from 'react';
import { getSystemConfig, updateSystemConfig, uploadLogo } from '../../api/systemAPI';
import { getSettings, updateSettings } from '../../api/systemAPI';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FiUpload, FiSave } from 'react-icons/fi';

export default function Settings() {
  const { user } = useAuth();
  const { updateConfig } = useSystem();
  const isAdmin = user?.role === 'admin';

  const [sysForm, setSysForm] = useState({
    establishmentName: '', establishmentSubtitle: '', description: '',
    address: '', phone1: '', phone2: '', email: '',
    invoiceFooter: '', invoiceTagline: '', tvaRate: 0, currency: 'GNF'
  });

  const [userForm, setUserForm] = useState({
    theme: 'light', language: 'fr', defaultPaymentType: 'comptant', itemsPerPage: 20,
    notifications: { lowStock: true, newSale: true, clientBlocked: true }
  });

  const [logoFile, setLogoFile]   = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [savingSys, setSavingSys] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'system' : 'user');

  useEffect(() => {
    getSystemConfig().then(res => {
      setSysForm(res.data);
      if (res.data.logo) setLogoPreview(`http://localhost:4000/${res.data.logo}`);
    });
    getSettings().then(res => setUserForm(res.data)).catch(() => {});
  }, []);

  const handleSysChange = (e) => setSysForm({ ...sysForm, [e.target.name]: e.target.value });
  const handleUserChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await uploadLogo(formData);
      toast.success('Logo mis à jour !');
      setLogoFile(null);
    } catch { toast.error('Erreur upload logo'); }
    finally { setUploadingLogo(false); }
  };

  const handleSaveSys = async () => {
    setSavingSys(true);
    try {
      const res = await updateSystemConfig(sysForm);
      updateConfig(res.data.config);
      toast.success('Configuration mise à jour !');
    } catch { toast.error('Erreur'); }
    finally { setSavingSys(false); }
  };

  const handleSaveUser = async () => {
    setSavingUser(true);
    try {
      await updateSettings(userForm);
      toast.success('Paramètres mis à jour !');
    } catch { toast.error('Erreur'); }
    finally { setSavingUser(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Paramètres</h1>
        <p className="text-gray-500 text-sm">Configurez votre application</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1 w-fit">
        {isAdmin && (
          <button onClick={() => setActiveTab('system')}
            className={`py-2 px-5 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'system' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Système
          </button>
        )}
        <button onClick={() => setActiveTab('user')}
          className={`py-2 px-5 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'user' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          Mes préférences
        </button>
      </div>

      {/* Système (admin only) */}
      {activeTab === 'system' && isAdmin && (
        <div className="space-y-5">

          {/* Logo */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-blue-900 mb-4">Logo de l'établissement</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <FiUpload size={24} className="text-gray-400" />
                }
              </div>
              <div className="space-y-3">
                <input type="file" accept="image/*" onChange={handleLogoChange}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100" />
                {logoFile && (
                  <Button onClick={handleUploadLogo} variant="primary" size="sm" loading={uploadingLogo}>
                    <FiUpload size={14} /> Uploader
                  </Button>
                )}
                <p className="text-xs text-gray-400">JPG, PNG ou WEBP — max 2MB</p>
              </div>
            </div>
          </div>

          {/* Infos établissement */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-blue-900 mb-4">Informations de l'établissement</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nom de l'établissement" name="establishmentName" value={sysForm.establishmentName} onChange={handleSysChange} />
              <Input label="Sous-titre" name="establishmentSubtitle" value={sysForm.establishmentSubtitle} onChange={handleSysChange} />
              <Input label="Description" name="description" value={sysForm.description} onChange={handleSysChange} className="col-span-2" />
              <Input label="Adresse" name="address" value={sysForm.address} onChange={handleSysChange} className="col-span-2" />
              <Input label="Téléphone 1" name="phone1" value={sysForm.phone1} onChange={handleSysChange} />
              <Input label="Téléphone 2" name="phone2" value={sysForm.phone2} onChange={handleSysChange} />
              <Input label="Email" name="email" type="email" value={sysForm.email} onChange={handleSysChange} />
              <Input label="Devise" name="currency" value={sysForm.currency} onChange={handleSysChange} />
            </div>
          </div>

          {/* Facture */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-blue-900 mb-4">Configuration des factures</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Pied de page" name="invoiceFooter" value={sysForm.invoiceFooter} onChange={handleSysChange} className="col-span-2" />
              <Input label="Tagline" name="invoiceTagline" value={sysForm.invoiceTagline} onChange={handleSysChange} className="col-span-2" />
              <Input label="TVA par défaut (%)" name="tvaRate" type="number" value={sysForm.tvaRate} onChange={handleSysChange} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSys} variant="primary" loading={savingSys}>
              <FiSave size={16} /> Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Préférences utilisateur */}
      {activeTab === 'user' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-base font-bold text-blue-900">Mes préférences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Thème</label>
              <select name="theme" value={userForm.theme} onChange={handleUserChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Langue</label>
              <select name="language" value={userForm.language} onChange={handleUserChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Paiement par défaut</label>
              <select name="defaultPaymentType" value={userForm.defaultPaymentType} onChange={handleUserChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="comptant">Comptant</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
            <Input label="Articles par page" name="itemsPerPage" type="number" value={userForm.itemsPerPage} onChange={handleUserChange} />
          </div>

          {/* Notifications */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Notifications</p>
            <div className="space-y-2">
              {[
                { key: 'lowStock',      label: 'Alerte stock bas' },
                { key: 'newSale',       label: 'Nouvelle vente'   },
                { key: 'clientBlocked', label: 'Client bloqué'    },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox"
                    checked={userForm.notifications?.[key] || false}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      notifications: { ...userForm.notifications, [key]: e.target.checked }
                    })}
                    className="w-4 h-4 accent-blue-900" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveUser} variant="primary" loading={savingUser}>
              <FiSave size={16} /> Sauvegarder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}