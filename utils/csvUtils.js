const fs = require('fs');
const csv = require('csv-parser');
const logToApplication = require('../logger/log');
const { User } = require('../models');
const bcrypt = require('bcrypt');

const csvLoader = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({
                delimiter: '\t',
                mapHeaders: ({ header }) => header.trim(),
            }))
            .on('data', (row) => {
                delete row.account_created;
                delete row.account_updated;
                const {
                    first_name,
                    last_name,
                    email,
                    password
                } = row;

                // Hashing the password
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        logToApplication(`Error hashing password: ${err.message}`);
                        return reject(err);
                    }
                    // Use hashedPassword here
                    User.findOrCreate({
                        where: { email: email },
                        defaults: {
                            first_name,
                            last_name,
                            email,
                            password: hashedPassword
                        }
                    }).then(([user, created]) => {
                        if (created) {
                            logToApplication(`New user created: ${user.email}`);
                        } else {
                            logToApplication(`User already exists: ${user.email}`);
                        }
                    }).catch(error => {
                        logToApplication(`Error creating or finding user: ${error.message}`);
                        reject(error);
                    });
                });
            })
            .on('end', () => {
                logToApplication('CSV file successfully processed');
                resolve();
            })
            .on('error', (error) => {
                logToApplication(`Error processing CSV file: ${error.message}`);
                reject(error);
            });
    });
}

module.exports = {
    csvLoader
};
