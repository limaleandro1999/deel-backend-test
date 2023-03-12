const { getAllUpaidJobs, payForJob } = require('../controllers/jobs');

describe('Jobs', () => {
  describe('getAllUpaidJobs', () => {
    it('should return 200 if the jobs are found', async () => {
      // Arrange
      const models = {
        Job: {
          findAll: jest.fn(() => [
            { id: 1, price: 100 },
            { id: 2, price: 200 }
          ])
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        }
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await getAllUpaidJobs(req, res);

      // Assert
      expect(models.Job.findAll).toHaveBeenCalledWith({
        where: {
          paid: null,
          [sequelize.Sequelize.Op.and]: [
            sequelize.Sequelize.literal('"Contract"."status" = \'in_progress\''),
            sequelize.Sequelize.literal(`("Contract"."ClientId" = ${req.profile.id} OR "Contract"."ContractorId" = ${req.profile.id})`)
          ]
        },
        include: [{
          model: models.Contract,
          as: 'Contract'
        }]
      });

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('payForJob', () => {
    it('should return 404 if the job is not found', async () => {
      // Arrange
      const models = {
        Job: {
          findOne: jest.fn(() => null)
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        }
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await payForJob(req, res);

      // Assert
      expect(models.Job.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          paid: null
        },
        include: [{
          model: models.Contract,
          as: 'Contract',
          where: {
            ClientId: req.profile.id
          }
        }]
      });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Job not found'
      });
    });

    it('should return 401 if the user is not a client', async () => {
      // Arrange
      const models = {
        Job: {
          findOne: jest.fn(() => ({
            paid: null,
            Contract: {
              status: 'in_progress'
            }
          }))
        },
        Contract: {
          findOne: jest.fn(() => ({
            status: 'in_progress'
          }))
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        },
        transaction: jest.fn(() => ({
          commit,
          rollback
        }))
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1,
          type: 'contractor'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await payForJob(req, res);

      // Assert
      expect(models.Job.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          paid: null
        },
        include: [{
          model: models.Contract,
          as: 'Contract',
          where: {
            ClientId: req.profile.id
          }
        }]
      });

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must be a client to pay for a job'
      });

      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should return 400 if the user\'s balance is not enough', async () => {
      // Arrange
      const models = {
        Job: {
          findOne: jest.fn(() => ({
            paid: null,
            price: 100,
            Contract: {
              status: 'in_progress'
            }
          })),
          update: jest.fn()
        },
        Contract: {
          findOne: jest.fn(() => ({
            status: 'in_progress'
          }))
        },
        Profile: {
          update: jest.fn()
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        },
        transaction: jest.fn(() => ({
          commit,
          rollback
        }))
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1,
          type: 'client',
          balance: 0
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await payForJob(req, res);

      // Assert
      expect(models.Job.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          paid: null
        },
        include: [{
          model: models.Contract,
          as: 'Contract',
          where: {
            ClientId: req.profile.id
          }
        }]
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You don\'t have enough money to pay for this job'
      });

      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();

      expect(models.Profile.update).toHaveBeenCalledTimes(0);
      expect(models.Job.update).toHaveBeenCalledTimes(0);
      expect(models.Job.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if the transaction fails', async () => {
      // Arrange
      const models = {
        Job: {
          findOne: jest.fn(() => ({
            paid: null,
            price: 100,
            Contract: {
              status: 'in_progress'
            }
          })),
          update: jest.fn()
        },
        Contract: {
          findOne: jest.fn(() => ({
            status: 'in_progress'
          }))
        },
        Profile: {
          update: jest.fn(() => {
            throw new Error('Internal server error');
          })
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        },
        transaction: jest.fn(() => ({
          commit,
          rollback
        })),
        literal: jest.fn()
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1,
          type: 'client',
          balance: 100
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await payForJob(req, res);

      // Assert
      expect(models.Job.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          paid: null
        },
        include: [{
          model: models.Contract,
          as: 'Contract',
          where: {
            ClientId: req.profile.id
          }
        }]
      });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      expect(rollback).toHaveBeenCalled();

      expect(models.Profile.update).toHaveBeenCalledTimes(1);
      expect(models.Job.update).toHaveBeenCalledTimes(0);
      expect(models.Job.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return 200 if the transaction succeeds', async () => {
      // Arrange
      const models = {
        Job: {
          findOne: jest.fn(() => ({
            paid: null,
            price: 100,
            Contract: {
              status: 'in_progress'
            }
          })),
          update: jest.fn()
        },
        Contract: {
          findOne: jest.fn(() => ({
            status: 'in_progress'
          }))
        },
        Profile: {
          update: jest.fn()
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        Sequelize: {
          Op: {
            and: 'and'
          },
          literal: jest.fn()
        },
        transaction: jest.fn(() => ({
          commit,
          rollback
        })),
        literal: jest.fn()
      };

      const req = {
        app: {
          get: (key) => ({
            models,
            sequelize
          }[key])
        },
        params: {
          id: 1
        },
        profile: {
          id: 1,
          type: 'client',
          balance: 100
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await payForJob(req, res);

      // Assert
      expect(models.Job.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          paid: null
        },
        include: [{
          model: models.Contract,
          as: 'Contract',
          where: {
            ClientId: req.profile.id
          }
        }]
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        Contract: {
          status: 'in_progress'
        },
        paid: null,
        price: 100
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(commit).toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();

      expect(models.Job.update).toHaveBeenCalledTimes(1);
      expect(models.Job.findOne).toHaveBeenCalledTimes(2);
      expect(models.Profile.update).toHaveBeenCalledTimes(2);
    });
  });
});
