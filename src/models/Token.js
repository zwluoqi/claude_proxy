import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'banned'),
    defaultValue: 'active'
  }
});

User.hasMany(Token);
Token.belongsTo(User);

export default Token;