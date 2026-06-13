import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogIn } from 'react-icons/fi';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data, res.data.token);
      toast.success(`Bienvenue ${res.data.name} !`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#2c3e50] flex items-center justify-center p-4">
      
      <div className="w-full max-w-sm">
        
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-2xl mb-4 p-2">
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🐟</span>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Poissonnerie TATA
          </h1>
          <p className="text-yellow-400 font-semibold text-xs">
            Système de Gestion ERP
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-[#3d5266]/40 backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-2xl">
          
          <div className="flex items-center gap-2 mb-4">
            <FiLogIn className="text-yellow-400" size={18} />
            <h2 className="text-white font-semibold">Connexion</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@poissonnerie-tata.com"
                className="w-full px-3 py-2.5 text-sm bg-[#2a3f54] border border-[#1a2332] rounded-lg text-white placeholder-gray-500
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">Mot de passe</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-[#2a3f54] border border-[#1a2332] rounded-lg text-white placeholder-gray-500
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 
                text-gray-900 font-semibold py-3 text-sm rounded-lg shadow-lg hover:shadow-xl 
                transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-3 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <FiLogIn size={16} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-5">
          <p className="text-gray-400 text-xs">
            © 2026 Poissonnerie Tata — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
