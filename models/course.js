"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      Course.hasMany(models.Chapter, {
        foreignKey: "courseId",
      });

      Course.belongsTo(models.User, {
        foreignKey: "userId",
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
