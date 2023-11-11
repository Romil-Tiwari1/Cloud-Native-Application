require('dotenv').config({ path: '/etc/webapp.env' });
'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Assignment, { foreignKey: 'userId', as: 'assignments' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    account_created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    account_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: false,
    hooks: {
      beforeSave: (user, options) => {
        user.account_updated = new Date();
      }
    }
  });

  return User;
};
