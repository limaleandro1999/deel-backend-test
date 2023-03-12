const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const swaggerUi = require('swagger-ui-express');
const { getProfile } = require('./middleware/getProfile');
const { getContractById, getContracts } = require('./controllers/contracts');
const { getAllUpaidJobs, payForJob } = require('./controllers/jobs');
const { deposit } = require('./controllers/balances');
const { getBestProfession, getBestClients } = require('./controllers/admin');
const swaggerDocument = require('../docs/swagger-output.json');

const app = express();

app.use(bodyParser.json());

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

// Set up the swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ---------------- Contracts ----------------

// Get contract by id
app.get('/contracts/:id', getProfile, getContractById);

// Get all contracts for a profile
app.get('/contracts', getProfile, getContracts);

// ---------------- Jobs ----------------

// Get all unpaid jobs for a profile, for active contracts
app.get('/jobs/unpaid', getProfile, getAllUpaidJobs);

// Pay for a job
app.get('/jobs/:id/pay', getProfile, payForJob);

// ---------------- Balances ----------------

// Deposit money to a client profile
app.post('/balances/deposit', getProfile, deposit);

// ---------------- Admin ----------------

// Get the best profession
app.get('/admin/best-profession', getBestProfession);

// Get the best clients
app.get('/admin/best-clients', getBestClients);

module.exports = app;
