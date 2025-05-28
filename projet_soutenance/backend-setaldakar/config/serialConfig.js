// serialConfigs.js (ou serialConfigs.ts pour TypeScript)
export const serialConfig = {
    port: '/dev/ttyUSB0',   // Change selon le port réel sur ton système
    baudRate: 9600,         // Débit en bauds
    dataBits: 8,            // Nombre de bits de données
    stopBits: 1,            // Nombre de bits d'arrêt
    parity: 'none'          // Parité (None, Even, Odd)
  };
  