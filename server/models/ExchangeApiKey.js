import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const ExchangeApiKey = sequelize.define('ExchangeApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  exchange: {
    type: DataTypes.ENUM('binance', 'bybit', 'okx', 'deribit'),
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passphrase: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

ExchangeApiKey.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ExchangeApiKey, { foreignKey: 'userId' });

export default ExchangeApiKey;