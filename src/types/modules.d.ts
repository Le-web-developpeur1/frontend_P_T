// Déclarations de types pour les modules JavaScript

// API modules
declare module '../../api/reportAPI' {
  export function getDailyReport(): Promise<any>;
  export function getMonthlyReport(): Promise<any>;
  export function getDebtReport(): Promise<any>;
  export function getCapitalReport(): Promise<any>;
}

declare module '../../api/productAPI' {
  export function getProducts(): Promise<any>;
  export function getLowStockProducts(): Promise<any>;
  export function createProduct(data: any): Promise<any>;
  export function updateProduct(id: string, data: any): Promise<any>;
  export function deleteProduct(id: string): Promise<any>;
  export function adjustStock(id: string, data: any): Promise<any>;
}

declare module '../../api/expenseAPI' {
  export function getExpenses(): Promise<any>;
  export function createExpense(data: any): Promise<any>;
  export function updateExpense(id: string, data: any): Promise<any>;
  export function deleteExpense(id: string): Promise<any>;
}

declare module '../../api/invoiceAPI' {
  export function getInvoices(): Promise<any>;
  export function createInvoice(data: any): Promise<any>;
  export function deleteInvoice(id: string): Promise<any>;
  export function downloadInvoicePDF(id: string): Promise<any>;
}

declare module '../../api/clientAPI' {
  export function getClients(): Promise<any>;
  export function createClient(data: any): Promise<any>;
  export function updateClient(id: string, data: any): Promise<any>;
  export function deleteClient(id: string): Promise<any>;
  export function recordClientPayment(id: string, data: any): Promise<any>;
  export function downloadPaymentReceipt(paymentId: string): Promise<any>;
  export function getClientHistory(id: string): Promise<any>;
  export function downloadClientReleve(id: string): Promise<any>;
}

declare module '../../api/saleAPI' {
  export function getSales(): Promise<any>;
  export function createSale(data: any): Promise<any>;
  export function deleteSale(id: string): Promise<any>;
}

declare module '../../api/supplierAPI' {
  export function getSuppliers(): Promise<any>;
  export function createSupplier(data: any): Promise<any>;
  export function updateSupplier(id: string, data: any): Promise<any>;
  export function deleteSupplier(id: string): Promise<any>;
  export function recordSupplierPayment(id: string, data: any): Promise<any>;
  export function recordPurchase(id: string, data: any): Promise<any>;
  export function getSupplierHistory(id: string): Promise<any>;
}

declare module '../../api/bankAPI' {
  export function getBankReport(): Promise<any>;
  export function transferToBanque(data: any): Promise<any>;
}

declare module '../../api/cashInAPI' {
  export function addCashIn(data: any): Promise<any>;
  export function getCashIns(): Promise<any>;
  export function addBankIn(data: any): Promise<any>;
  export function getBankIns(): Promise<any>;
}

declare module '../../api/systemAPI' {
  export function getSystemInfo(): Promise<any>;
  export function updateSystemInfo(data: any): Promise<any>;
}

declare module '../../api/damageApi' {
  export function getDamages(): Promise<any>;
  export function createDamage(data: any): Promise<any>;
  export function deleteDamage(id: string): Promise<any>;
}

declare module '../../api/notificationAPI' {
  export function getNotifications(): Promise<any>;
  export function markAsRead(id: string): Promise<any>;
  export function markAllAsRead(): Promise<any>;
  export function deleteNotification(id: string): Promise<any>;
}

declare module '../../api/employeeAPI' {
  export function getEmployees(): Promise<any>;
  export function getEmployee(id: string): Promise<any>;
  export function createEmployee(data: any): Promise<any>;
  export function updateEmployee(id: string, data: any): Promise<any>;
  export function deleteEmployee(id: string): Promise<any>;
  export function paySalary(id: string, data: any): Promise<any>;
  export function getSalaryStats(): Promise<any>;
  export function downloadSalarySlip(paymentId: string): Promise<any>;
  export function giveAdvance(id: string, data: any): Promise<any>;
  export function getAdvances(id: string): Promise<any>;
}



// Hooks
declare module '../../hooks/useAutoRefresh' {
  export default function useAutoRefresh(callback: () => void, interval: number): void;
}

// Components
declare module '../../components/common/Table' {
  import { ReactNode } from 'react';
  interface Column {
    header: string;
    key?: string;
    render?: (item: any) => ReactNode;
  }
  interface TableProps {
    columns: Column[];
    data: any[];
    loading?: boolean;
    emptyMessage?: string;
  }
  export default function Table(props: TableProps): JSX.Element;
}

declare module '../../components/common/Modal' {
  import { ReactNode } from 'react';
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: ReactNode;
  }
  export default function Modal(props: ModalProps): JSX.Element;
}

declare module '../../components/common/Button' {
  import { ReactNode, ButtonHTMLAttributes } from 'react';
  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
  }
  export default function Button(props: ButtonProps): JSX.Element;
}

declare module '../../components/common/Input' {
  import { InputHTMLAttributes } from 'react';
  interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
  }
  export default function Input(props: InputProps): JSX.Element;
}

declare module '../../components/common/Badge' {
  interface BadgeProps {
    label: string;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  }
  export default function Badge(props: BadgeProps): JSX.Element;
}
