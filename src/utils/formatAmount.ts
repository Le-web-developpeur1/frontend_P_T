export const formatAmount = (amount: number | string | null | undefined): string => {
    if (!amount && amount !== 0) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  };
  
  export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR');
  };