"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Complete extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Complete.init(
    {
      userId: DataTypes.INTEGER,
      pageId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Complete",
    },
  );
  return Complete;
};
