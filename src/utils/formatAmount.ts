export const formatAmount = (amount: number | string | null | undefined): string => {
    if (!amount && amount !== 0) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR');
  };