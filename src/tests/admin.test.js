const { getBestProfession, getBestClients } = require('../controllers/admin');

describe('Admin', () => {
  describe('getBestProfession', () => {
    it('should return 200 with the best profession', async () => {
      // Arrange
      const sequelizeQuery = jest.fn();
      const req = {
        app: {
          get: (key) => ({
            sequelize: {
              query: sequelizeQuery
            }
          }[key])
        },
        query: {
          startDate: '2019-01-01',
          endDate: '2019-01-31'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sequelizeQuery.mockResolvedValue([
        [
          { profession: 'Developer', count: 2 }
        ],
        {}
      ]);

      // Act
      await getBestProfession(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        profession: 'Developer',
        count: 2
      });

      expect(sequelizeQuery).toHaveBeenCalledWith(
        `
          SELECT "profession", SUM("Jobs"."price") AS "totalEarned"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ContractorId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'contractor' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."profession"
          ORDER BY "totalEarned" DESC
          LIMIT 1
        `,
        {
          replacements: {
            startDate: '2019-01-01',
            endDate: '2019-01-31'
          }
        }
      );

      expect(sequelizeQuery).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if there is an error', async () => {
      // Arrange
      const sequelizeQuery = jest.fn();
      const req = {
        app: {
          get: (key) => ({
            sequelize: {
              query: sequelizeQuery
            }
          }[key])
        },
        query: {
          startDate: '2019-01-01',
          endDate: '2019-01-31'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sequelizeQuery.mockRejectedValue(new Error('Internal server error'));

      // Act
      await getBestProfession(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });

      expect(sequelizeQuery).toHaveBeenCalledWith(
        `
          SELECT "profession", SUM("Jobs"."price") AS "totalEarned"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ContractorId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'contractor' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."profession"
          ORDER BY "totalEarned" DESC
          LIMIT 1
        `,
        {
          replacements: {
            startDate: '2019-01-01',
            endDate: '2019-01-31'
          }
        }
      );

      expect(sequelizeQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBestClients', () => {
    it('should return 200 with the best clients', async () => {
      // Arrange
      const sequelizeQuery = jest.fn();
      const req = {
        app: {
          get: (key) => ({
            sequelize: {
              query: sequelizeQuery
            }
          }[key])
        },
        query: {
          startDate: '2019-01-01',
          endDate: '2019-01-31',
          limit: 2
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sequelizeQuery.mockResolvedValue([
        [
          { id: 1, fullName: 'John Doe', paid: 1000 },
          { id: 2, fullName: 'Jane Doe', paid: 500 }
        ],
        {}
      ]);

      // Act
      await getBestClients(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, fullName: 'John Doe', paid: 1000 },
        { id: 2, fullName: 'Jane Doe', paid: 500 }
      ]);

      expect(sequelizeQuery).toHaveBeenCalledWith(
        `
          SELECT "Profile"."id", "Profile"."firstName" || ' ' || "Profile"."lastName" AS "fullName", SUM("Jobs"."price") AS "paid"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ClientId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'client' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."id"
          ORDER BY "paid" DESC
          LIMIT :limit
        `,
        {
          replacements: {
            startDate: '2019-01-01',
            endDate: '2019-01-31',
            limit: 2
          }
        }
      );

      expect(sequelizeQuery).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if there is an error', async () => {
      // Arrange
      const sequelizeQuery = jest.fn();
      const req = {
        app: {
          get: (key) => ({
            sequelize: {
              query: sequelizeQuery
            }
          }[key])
        },
        query: {
          startDate: '2019-01-01',
          endDate: '2019-01-31',
          limit: 2
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sequelizeQuery.mockRejectedValue(new Error('Internal server error'));

      // Act
      await getBestClients(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });

      expect(sequelizeQuery).toHaveBeenCalledWith(
        `
          SELECT "Profile"."id", "Profile"."firstName" || ' ' || "Profile"."lastName" AS "fullName", SUM("Jobs"."price") AS "paid"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ClientId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'client' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."id"
          ORDER BY "paid" DESC
          LIMIT :limit
        `,
        {
          replacements: {
            startDate: '2019-01-01',
            endDate: '2019-01-31',
            limit: 2
          }
        }
      );

      expect(sequelizeQuery).toHaveBeenCalledTimes(1);
    });
  });
});
