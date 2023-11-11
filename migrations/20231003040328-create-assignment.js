require('dotenv').config({ path: '/etc/webapp.env' });
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Assignments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            points: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            num_of_attempts: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            deadline: {
                type: Sequelize.DATE,
                allowNull: false
            },
            assignment_created: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            assignment_updated: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Assignments');
    }
};
