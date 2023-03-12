const getAllUpaidJobs = async (req, res) => {
  const { Sequelize } = req.app.get('sequelize');
  const { Job, Contract } = req.app.get('models');
  const { profile } = req;

  const jobs = await Job.findAll({
    where: {
      paid: null,
      [Sequelize.Op.and]: [
        Sequelize.literal('"Contract"."status" = \'in_progress\''),
        Sequelize.literal(`("Contract"."ClientId" = ${profile.id} OR "Contract"."ContractorId" = ${profile.id})`)
      ]
    },
    include: [{
      model: Contract,
      as: 'Contract'
    }]
  });

  return res.json(jobs);
};

const payForJob = async (req, res) => {
  const sequelize = req.app.get('sequelize');
  const { Job, Profile, Contract } = req.app.get('models');
  const { profile } = req;
  const { id } = req.params;

  const job = await Job.findOne({
    where: {
      id,
      paid: null
    },
    include: [{
      model: Contract,
      as: 'Contract',
      where: {
        ClientId: profile.id
      }
    }]
  });

  if (!job) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }

  if (profile.type !== 'client') {
    return res.status(401).json({
      error: 'You must be a client to pay for a job'
    });
  }

  if (profile.balance < job.price) {
    return res.status(400).json({
      error: 'You don\'t have enough money to pay for this job'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    await Profile.update(
      { balance: sequelize.literal(`balance - ${job.price}`) },
      { where: { id: profile.id } },
      { transaction }
    );

    await Profile.update(
      { balance: sequelize.literal(`balance + ${job.price}`) },
      { where: { id: job?.Contract?.ContractorId } },
      { transaction }
    );

    await Job.update(
      { paid: true },
      { where: { id } },
      { transaction }
    );

    const updatedJob = await Job.findOne({
      where: { id }
    });

    await transaction.commit();
    return res.status(200).json(updatedJob);
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUpaidJobs,
  payForJob
};
