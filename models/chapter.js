"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Chapter.belongsTo(models.Course, {
        foreignKey: "courseId",
      });
      Chapter.hasMany(models.Page, {
        foreignKey: "chapterId",
      });
    }

    static addChapter({ title, courseId, description }) {
      return this.create({ title, courseId, description });
    }

    static getChapters(id) {
      return this.findAll({
        where: {
          courseId: id,
        },
      });
    }
  }
  Chapter.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Chapter",
    },
  );
  return Chapter;
};
