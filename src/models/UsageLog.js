import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Token from './Token.js';

const UsageLog = sequelize.define('UsageLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tokenUsed: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Token,
      key: 'token'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  tokenCount: {
    type: DataTypes.INTEGER
  },
  usageCount: {
    type: DataTypes.INTEGER
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4)
  }
});

User.hasMany(UsageLog);
UsageLog.belongsTo(User);

Token.hasMany(UsageLog, { foreignKey: 'tokenUsed', sourceKey: 'token' });
UsageLog.belongsTo(Token, { foreignKey: 'tokenUsed', targetKey: 'token' });

export default UsageLog;