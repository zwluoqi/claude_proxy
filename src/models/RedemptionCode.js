import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RedemptionCode = sequelize.define('RedemptionCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  quota: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

export default RedemptionCode;