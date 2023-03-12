const { deposit } = require('../controllers/balances');

// unit tests for the balances controller
describe('Balances', () => {
  describe('deposit', () => {
    it('should return 401 if the user is not a client', () => {
      // Arrange
      const req = {
        app: {
          get: () => ({})
        },
        profile: {
          type: 'contractor'
        },
        body: {
          amount: 100
        }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      deposit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must be a client to deposit money'
      });
    });

    it('should return 400 if the amount is greater than 25% of the total of jobs to pay', async () => {
      // Arrange
      const models = {
        Profile: {
          update: jest.fn()
        },
        Job: {
          findAll: jest.fn(() => [
            { price: 100 },
            { price: 200 }
          ])
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        transaction: jest.fn(() => ({
          commit,
          rollback
        })),
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
        profile: {
          type: 'client',
          id: 1
        },
        body: {
          amount: 200
        }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await deposit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You can\'t deposit more than 25% of your total of jobs to pay'
      });

      expect(models.Job.findAll).toHaveBeenCalledWith({
        where: {
          paid: null,
          [sequelize.Sequelize.Op.and]: [
            sequelize.Sequelize.literal('"Contract"."status" = \'in_progress\''),
            sequelize.Sequelize.literal(`"Contract"."ClientId" = ${req.profile.id}`)
          ]
        },
        include: [{
          model: models.Contract,
          as: 'Contract'
        }]
      });

      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(models.Profile.update).not.toHaveBeenCalled();
    });

    it('should return 500 if there is an error updating the balance', async () => {
      // Arrange
      const models = {
        Profile: {
          update: jest.fn(() => {
            throw new Error();
          })
        },
        Job: {
          findAll: jest.fn(() => [
            { price: 100 },
            { price: 200 }
          ])
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        transaction: jest.fn(() => ({
          commit,
          rollback
        })),
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
        profile: {
          type: 'client',
          id: 1
        },
        body: {
          amount: 70
        }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await deposit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'There was an error updating the balance'
      });

      expect(models.Job.findAll).toHaveBeenCalledWith({
        where: {
          paid: null,
          [sequelize.Sequelize.Op.and]: [
            sequelize.Sequelize.literal('"Contract"."status" = \'in_progress\''),
            sequelize.Sequelize.literal(`"Contract"."ClientId" = ${req.profile.id}`)
          ]
        },
        include: [{
          model: models.Contract,
          as: 'Contract'
        }]
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(models.Profile.update).toHaveBeenCalled();

      expect(commit).not.toHaveBeenCalled();
      expect(rollback).toHaveBeenCalled();
    });

    it('should return 200 if the balance is updated successfully', async () => {
      // Arrange
      const models = {
        Profile: {
          update: jest.fn()
        },
        Job: {
          findAll: jest.fn(() => [
            { price: 100 },
            { price: 200 }
          ])
        }
      };

      const commit = jest.fn();
      const rollback = jest.fn();

      const sequelize = {
        transaction: jest.fn(() => ({
          commit,
          rollback
        })),
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
        profile: {
          type: 'client',
          id: 1
        },
        body: {
          amount: 70
        }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await deposit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      expect(models.Job.findAll).toHaveBeenCalledWith({
        where: {
          paid: null,
          [sequelize.Sequelize.Op.and]: [
            sequelize.Sequelize.literal('"Contract"."status" = \'in_progress\''),
            sequelize.Sequelize.literal(`"Contract"."ClientId" = ${req.profile.id}`)
          ]
        },
        include: [{
          model: models.Contract,
          as: 'Contract'
        }]
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(models.Profile.update).toHaveBeenCalled();

      expect(commit).toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();
    });
  });
});
