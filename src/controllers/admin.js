const getBestProfession = async (req, res) => {
  try {
    const sequelize = req.app.get('sequelize');
    const { startDate, endDate } = req.query;

    const [results] = await sequelize.query(`
          SELECT "profession", SUM("Jobs"."price") AS "totalEarned"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ContractorId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'contractor' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."profession"
          ORDER BY "totalEarned" DESC
          LIMIT 1
        `, {
      replacements: {
        startDate,
        endDate
      }
    });

    return res.status(200).json(results[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getBestClients = async (req, res) => {
  try {
    const sequelize = req.app.get('sequelize');
    const { startDate, endDate } = req.query;
    const limit = req.query?.limit ? parseInt(req.query.limit) : 2;

    const [results] = await sequelize.query(`
          SELECT "Profile"."id", "Profile"."firstName" || ' ' || "Profile"."lastName" AS "fullName", SUM("Jobs"."price") AS "paid"
          FROM "Profiles" AS "Profile"
          INNER JOIN "Contracts" AS "Contract" ON "Profile"."id" = "Contract"."ClientId"
          INNER JOIN "Jobs" AS "Jobs" ON "Contract"."id" = "Jobs"."ContractId"
          WHERE "Profile"."type" = 'client' AND "Jobs"."paid" = true AND "Jobs"."createdAt" BETWEEN :startDate AND :endDate
          GROUP BY "Profile"."id"
          ORDER BY "paid" DESC
          LIMIT :limit
        `, {
      replacements: {
        startDate,
        endDate,
        limit
      }
    });

    return res.status(200).json(results);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getBestProfession,
  getBestClients
};
