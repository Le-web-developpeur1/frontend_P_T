import { createContext, useState, useEffect, useContext } from 'react';
import { getSystemConfig } from '../api/systemAPI';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // ← ne fetch que si connecté
    getSystemConfig()
      .then(res => setConfig(res.data))
      .catch(() => {});
  }, []);

  const updateConfig = (newConfig) => setConfig(newConfig);

  return (
    <SystemContext.Provider value={{ config, updateConfig }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);