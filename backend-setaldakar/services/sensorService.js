const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Alert = require('../models/Alert');
const Depot = require('../models/depos');

class SensorService {
  constructor(io) {
    this.io = io; // Passer l'instance io de Socket.IO
    this.port = null;
    this.parser = null;
    this.latestData = null;
    this.alertCreatedTimestamp = null;

    try {
      SerialPort.list().then(ports => {
        const portExists = ports.some(port => port.path === '/dev/ttyUSB0');

        if (portExists) {
          this.port = new SerialPort({
            path: '/dev/ttyUSB0',
            baudRate: 9600
          });

          this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
          this.setupDataListener();
        } else {
          console.warn('Le port USB /dev/ttyUSB0 n\'est pas branché.');
        }
      }).catch(error => {
        console.error('Erreur lors de la vérification des ports série :', error);
      });
    } catch (error) {
      console.error('Erreur de connexion série :', error);
    }
  }

  setupDataListener() {
    if (this.parser) {
      this.parser.on('data', (data) => {
        console.log('Données reçues du capteur :', data);
        const parsedData = this.parseAndEmitData(data);

        // Émettre les données via Socket.IO
        if (parsedData && parsedData.pourcentage !== undefined) {
          this.io.emit('sensorData', { pourcentage: parsedData.pourcentage });
        }

        this.checkThresholdAndCreateAlert(parsedData);
      });
    }
  }

  parseAndEmitData(rawData) {
    try {
      const parsedData = this.parseArduinoData(rawData);
      this.latestData = parsedData;
      return parsedData;
    } catch (error) {
      console.error('Erreur de parsing :', error);
      return null;
    }
  }

  parseArduinoData(rawData) {
    const dataObj = {
      raw: rawData,
      timestamp: new Date()
    };

    if (rawData.includes('Distance mesurée :')) {
      const distanceMatch = rawData.match(/Distance mesurée : (\d+) cm/);
      const pourcentageMatch = rawData.match(/Niveau de remplissage : (\d+(\.\d+)?) %/);

      if (distanceMatch) dataObj.distanceCm = parseInt(distanceMatch[1]);
      if (pourcentageMatch) dataObj.pourcentage = parseFloat(pourcentageMatch[1]);
    }

    return dataObj;
  }

  getLatestData() {
    return this.latestData || { message: 'Dernières données non disponibles' };
  }

  async checkThresholdAndCreateAlert(data) {
    if (data && data.pourcentage && data.pourcentage > 80) {
      const now = new Date();
      if (!this.alertCreatedTimestamp || (now - this.alertCreatedTimestamp) > 15 * 60 * 1000) {
        try {
          const premierDepot = await Depot.findOne().sort({ _id: 1 });

          if (premierDepot) {
            const alert = new Alert({
              depot_id: premierDepot._id,
              niveau: data.pourcentage,
              date: new Date(),
              heure: new Date().toLocaleTimeString()
            });

            await alert.save();
            console.log(`Alerte créée automatiquement - Niveau: ${data.pourcentage}%, Dépôt: ${premierDepot._id}`);
            this.alertCreatedTimestamp = now;
          } else {
            console.error("Aucun dépôt trouvé dans la base de données");
          }
        } catch (error) {
          console.error("Erreur lors de la création automatique d'alerte:", error);
        }
      }
    }
  }
}

module.exports = (io) => new SensorService(io);
