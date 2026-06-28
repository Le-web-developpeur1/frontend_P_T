import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Caisse from './pages/caisse/Caisse';
import Products from './pages/products/Products';
import Clients from './pages/clients/Clients';
import Suppliers from './pages/suppliers/Suppliers';
import Sales from './pages/sales/Sales';
import Invoices from './pages/invoices/Invoices';
import Expenses from './pages/expenses/Expenses';
import Reports from './pages/reports/Reports';
import Users from './pages/users/Users';
import Damages from './pages/damages/Damages';
import Credits from './pages/credits/Credits';
import Employees from './pages/employees/Employees';
import Settings from './pages/settings/Settings';
import Loader from './components/common/Loader';
import Capital from './pages/capital/Capital';
import Bank from './pages/bank/Bank';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user?.role === 'caissier' ? "/caisse" : "/"} />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      
        <Route index element={<Dashboard />} />
        <Route path="caisse" element={<Caisse />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Clients />} />
        <Route path='credits' element={<Credits />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="sales" element={<Sales />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="damages" element={<Damages />} />
        <Route path="employees" element={<Employees />} />
        <Route path="bank" element={<Bank />} />
        <Route path='capital' element={<Capital />} />
        <Route path="settings" element={<Settings />} />

        {/* Toute route inconnue → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}