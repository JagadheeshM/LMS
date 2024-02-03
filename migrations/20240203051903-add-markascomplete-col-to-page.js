"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Pages", "completed", {
      type: Sequelize.DataTypes.BOOLEAN,
      default: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Pages", "completed");
  },
};
