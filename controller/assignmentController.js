require('dotenv').config({ path: '/etc/webapp.env' });
const { Assignment } = require('../models');
const logToApplication = require('../logger/log');

const validateAssignmentData = (data) => {
    const { name, points, num_of_attempts, deadline } = data;

    if (typeof name !== 'string' || name.trim() === '') {
        return { valid: false, error: 'Name must be a valid string.' };
    }

    // Check if deadline is in 'YYYY-MM-DD' format
    const deadlinePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!deadlinePattern.test(deadline) || isNaN(new Date(deadline).getTime())) {
        return { valid: false, error: 'Deadline must be a valid date in the format YYYY-MM-DDTHH:MM:SS.sssZ.' };
    }

    // Points and number of attempts should be integers
    if (!Number.isInteger(points) || !Number.isInteger(num_of_attempts)) {
        return { valid: false, error: 'Points and number of attempts must be integers.' };
    }

    // Validation for num_of_attempts
    if (num_of_attempts <= 0 || num_of_attempts > 100) {
        return { valid: false, error: 'Number of attempts min: 1 and max : 100' }
    }

    // No extra parameters except in the model
    const allowedKeys = ['name', 'points', 'num_of_attempts', 'deadline'];
    for (let key in data) {
        if (!allowedKeys.includes(key)) {
            return { valid: false, error: 'Invalid parameter provided.' };
        }
    }
    return { valid: true };
};
const serializeAssignment = (assignment) => {
    const { userId, ...rest } = assignment.dataValues;
    return rest;
};

//Fetch all Assignments
const getAllAssignments = (req, res) => {
    Assignment.findAll()
        .then(assignments => {
            const serializedAssignments = assignments.map(serializeAssignment);
            res.status(200).json(serializedAssignments);
        })
        .catch(err => {
            logToApplication(`Failed to retrieve assignments: ${err.message}`);
            res.status(500).json({ error: 'Failed to retrieve assignments.' });
        });
};

//Create Assignment
const createAssignment = (req, res) => {
    const { name, points, num_of_attempts, deadline } = req.body;
    logToApplication(`Authenticated user ID: ${req.user.dataValues.id}`);
    const userId = req.user.dataValues.id;

    delete req.body.assignment_created;
    delete req.body.assignment_updated;

    const validation = validateAssignmentData(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    // Validation for points
    if (points < 1 || points > 10) {
        return res.status(400).json({ error: 'Points must be between 1 and 10.' });
    }

    if (!userId) {
        logToApplication(`UserID is missing for create operation - Authenticated user ID: ${req.user.dataValues.id}`);
        return res.status(400).json({ error: 'User ID is missing' });
    }

    Assignment.create({ name, points, num_of_attempts, deadline, userId })
        .then(assignment => {
            res.status(201).json(serializeAssignment(assignment));
        })
        .catch(err => {
            logToApplication(`Failed to create assignment - Error: ${err.message}`);
            res.status(500).json({ error: 'Failed to create assignment.' });
        });
};

//Update Assignment
const updateAssignment = (req, res) => {
    const { name, points, num_of_attempts, deadline } = req.body;

    // Check for authentication
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized. Please provide valid authentication credentials.' });
    }

    delete req.body.assignment_created;
    delete req.body.assignment_updated;

    const validation = validateAssignmentData(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    if (points < 1 || points > 10) {
        return res.status(400).json({ error: 'Points must be between 1 and 10.' });
    }

    Assignment.findOne({ where: { id: req.params.id } })
        .then(assignment => {
            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }
            if (String(assignment.userId).trim() !== String(req.user.dataValues.id).trim()) {
                return res.status(403).json({ error: 'You do not have permission to update this assignment.' });
            }
            assignment.update({ name, points, num_of_attempts, deadline })
                .then(updatedAssignment => {
                    res.status(204).send();
                })
                .catch(err => {
                    logToApplication(`Failed to update assignment with ID ${req.params.id} - Error: ${err.message}`);
                    res.status(500).json({ error: 'Failed to update assignment. An internal server error occurred.' });
                });
        })
        .catch(err => {
            logToApplication(`Database access error during operation on assignment with ID ${req.params.id} - Error: ${err.message}`);
            res.status(500).json({ error: 'Error occurred while accessing the database.' });
        });
};

//Delete Assignment
const deleteAssignment = (req, res) => {
    Assignment.findOne({ where: { id: req.params.id } })
        .then(assignment => {
            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }
            if (Object.keys(req.body).length !== 0) {
                return res.status(400).json({ error: 'Bad request: DELETE request should not include a body.' });
            }
            if (String(assignment.userId).trim() !== String(req.user.dataValues.id).trim()) {
                return res.status(401).json({ error: 'You do not have permission to delete this assignment.' });
            }
            assignment.destroy()
                .then(() => {
                    res.status(204).send();
                })
                .catch(err => {
                    logToApplication(`Failed to delete assignment with ID ${req.params.id} - Error: ${err.message}`);
                    res.status(500).json({ error: 'Failed to delete assignment.' });
                });
        })
        .catch(err => {
            logToApplication(`Failed to find assignment with ID ${req.params.id} - Error: ${err.message}`);
            res.status(500).json({ error: 'Failed to find assignment.' });
        });
};

//Fetch Assignment by ID
const getAssignmentDetails = (req, res) => {
    const assignmentId = req.params.id;

    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized. Please provide valid authentication credentials.' });
    }

    Assignment.findOne({ where: { id: assignmentId } })
        .then(assignment => {
            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            // Optionally, check for ownership if you want to restrict viewing
            if (String(assignment.userId).trim() !== String(req.user.dataValues.id).trim()) {
                return res.status(403).json({ error: 'You do not have permission to view this assignment.' });
            }

            res.status(200).json(serializeAssignment(assignment));
        })
        .catch(err => {
            logToApplication(`Failed to retrieve assignment with ID ${req.params.id} - Error: ${err.message}`);
            res.status(500).json({ error: 'Failed to retrieve assignment.' });
        });
};

module.exports = {
    getAllAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentDetails
};
