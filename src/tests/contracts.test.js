const { getContracts, getContractById } = require('../controllers/contracts');

describe('Contract', () => {
  describe('getContractById', () => {
    it('should return 404 if the contract is not found', async () => {
      // Arrange
      const models = {
        Contract: {
          findOne: jest.fn(() => null)
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            not: 'not',
            or: 'or'
          }
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
      await getContractById(req, res);

      // Assert
      expect(models.Contract.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          [sequelize.Sequelize.Op.or]: [
            { ClientId: 1 },
            { ContractorId: 1 }
          ]
        }
      });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Contract not found'
      });
    });

    it('should return 500 if there is an error', async () => {
      // Arrange
      const models = {
        Contract: {
          findOne: jest.fn(() => {
            throw new Error('Internal server error');
          })
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            not: 'not',
            or: 'or'
          }
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
      await getContractById(req, res);

      // Assert
      expect(models.Contract.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          [sequelize.Sequelize.Op.or]: [
            { ClientId: 1 },
            { ContractorId: 1 }
          ]
        }
      });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });

    it('should return 200 if the contract is found', async () => {
      // Arrange
      const models = {
        Contract: {
          findOne: jest.fn(() => ({
            id: 1,
            ClientId: 1,
            ContractorId: 2,
            status: 'in_progress'
          }))
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            not: 'not',
            or: 'or'
          }
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
      await getContractById(req, res);

      // Assert
      expect(models.Contract.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          [sequelize.Sequelize.Op.or]: [
            { ClientId: 1 },
            { ContractorId: 1 }
          ]
        }
      });

      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        ClientId: 1,
        ContractorId: 2,
        status: 'in_progress'
      });
    });
  });

  describe('getContracts', () => {
    it('should return 500 if there is an error', async () => {
      // Arrange
      const models = {
        Contract: {
          findAll: jest.fn(() => {
            throw new Error('Internal server error');
          })
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            not: 'not',
            or: 'or'
          }
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
          id: 1
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await getContracts(req, res);

      // Assert
      expect(models.Contract.findAll).toHaveBeenCalledWith({
        where: {
          status: {
            [sequelize.Sequelize.Op.not]: 'terminated'
          },
          [sequelize.Sequelize.Op.or]: [
            { ClientId: 1 },
            { ContractorId: 1 }
          ]
        }
      });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });

    it('should return all the contracts for a profile', async () => {
      // Arrange
      const models = {
        Contract: {
          findAll: jest.fn(() => [
            {
              id: 1,
              ClientId: 1,
              ContractorId: 2,
              status: 'in_progress'
            },
            {
              id: 2,
              ClientId: 1,
              ContractorId: 3,
              status: 'in_progress'
            }
          ])
        }
      };

      const sequelize = {
        Sequelize: {
          Op: {
            not: 'not',
            or: 'or'
          }
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
          id: 1
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Act
      await getContracts(req, res);

      // Assert
      expect(models.Contract.findAll).toHaveBeenCalledWith({
        where: {
          status: {
            [sequelize.Sequelize.Op.not]: 'terminated'
          },
          [sequelize.Sequelize.Op.or]: [
            { ClientId: 1 },
            { ContractorId: 1 }
          ]
        }
      });

      expect(res.json).toHaveBeenCalledWith([
        {
          id: 1,
          ClientId: 1,
          ContractorId: 2,
          status: 'in_progress'
        },
        {
          id: 2,
          ClientId: 1,
          ContractorId: 3,
          status: 'in_progress'
        }
      ]);
    });
  });
});
