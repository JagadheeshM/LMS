"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Page.belongsTo(models.Chapter, {
        foreignKey: "chapterId",
      });
    }

    static addPage({ content, chapterId, title }) {
      return this.create({ content, chapterId, completed: false, title });
    }

    static getPages(id) {
      return this.findAll({
        where: {
          chapterId: id,
        },
      });
    }

    async markAsCompleted(id) {
      await this.update({ completed: true });
    }
  }
  Page.init(
    {
      content: DataTypes.TEXT,
      completed: DataTypes.BOOLEAN,
      title: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Page",
    },
  );
  return Page;
};
