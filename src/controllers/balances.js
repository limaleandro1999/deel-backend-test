const deposit = async (req, res) => {
  const sequelize = req.app.get('sequelize');
  const { Sequelize } = req.app.get('sequelize');
  const { Profile, Job, Contract } = req.app.get('models');
  const { profile } = req;
  const { amount } = req.body;

  if (profile.type !== 'client') {
    return res.status(401).json({
      error: 'You must be a client to deposit money'
    });
  }

  const jobs = await Job.findAll({
    where: {
      paid: null,
      [Sequelize.Op.and]: [
        Sequelize.literal('"Contract"."status" = \'in_progress\''),
        Sequelize.literal(`"Contract"."ClientId" = ${profile.id}`)
      ]
    },
    include: [{
      model: Contract,
      as: 'Contract'
    }]
  });

  const totalJobsPrice = jobs.reduce((acc, job) => acc + job.price, 0);

  if (amount > totalJobsPrice * 0.25) {
    return res.status(400).json({
      error: 'You can\'t deposit more than 25% of your total of jobs to pay'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    await Profile.update(
      { balance: Sequelize.literal(`balance + ${amount}`) },
      { where: { id: profile.id } },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({ balance: profile.balance + amount });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res.status(500).json({ error: 'There was an error updating the balance' });
  }
};

module.exports = {
  deposit
};
