"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Course.hasMany(models.Chapter, {
        foreignKey: "courseId",
      });
    }

    static getCourses() {
      return this.findAll();
    }
    static addCourse({ title }) {
      return this.create({ title });
    }
  }
  Course.init(
    {
      title: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Course",
    },
  );
  return Course;
};
