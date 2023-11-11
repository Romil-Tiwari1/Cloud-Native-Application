process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const Sequelize = require('sequelize');
const { app, startServer, getServer } = require('../index');
chai.use(chaiHttp);
const { expect } = chai;
const log = require('why-is-node-running');

const sequelize = new Sequelize('projectDb_test', 'testuser', 'root', {
  host: 'localhost',
  dialect: 'mysql'
});

describe('Integration Tests', () => {
  before((done) => {
    (async () => {
      try {
        console.log("Test setup: starting");
        await sequelize.authenticate();
        console.log("Test setup: authenticated");
        await sequelize.sync({ force: true });
        console.log("Test setup: tables synchronized");
        await startServer();
        console.log("Server started for testing");
        done();
      } catch (err) {
        console.error("Error during test setup:", err);
        done(err);
      }
    })();
  });

  after((done) => {
    (async () => {
      try {
        console.log("Test teardown: starting");

        await sequelize.close();
        const serverInstance = getServer();

        if (serverInstance) {
          serverInstance.close((err) => {
            if (err) {
              console.error("Server close error:", err);
            } else {
              console.log("Server closed successfully!");
            }

            const logTimeout = setTimeout(() => {
              log();
              clearTimeout(logTimeout);
              done();
            }, 500);
          });
        } else {
          console.log("No server to close");
          const logTimeout = setTimeout(() => {
            console.log("Inside process tracker");
            log();
            clearTimeout(logTimeout);
            done();
          }, 500);
        }
      } catch (err) {
        console.error("Error during test teardown:", err);
        done(err);
      }
    })();
  });

  it('should return a successful health check', async () => {
    const res = await chai.request(app).get('/healthz');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ message: 'Database Connection Status : Successful' });
  });
});
