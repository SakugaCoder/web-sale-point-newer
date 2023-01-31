import { Sequelize, Model, DataTypes } from 'sequelize';

// Option 2: Passing parameters separately (sqlite)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '../web-sale-point-backend/db/test.db'
});
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  birthday: DataTypes.DATE,
});

  
const users = await User.findAll({raw: true});

console.log( users);
