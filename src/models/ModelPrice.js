import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ModelPrice = sequelize.define('ModelPrice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  modelName: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  inputPrice: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false
  },
  outputPrice: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false
  }
});

export default ModelPrice;