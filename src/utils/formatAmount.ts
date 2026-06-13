export const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  };
  
  export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR');
  };