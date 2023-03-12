const getContractById = async (req, res) => {
  try {
    const { Sequelize } = req.app.get('sequelize');
    const { Contract } = req.app.get('models');
    const { id } = req.params;
    const { profile } = req;

    const contract = await Contract.findOne({
      where: {
        id,
        [Sequelize.Op.or]: [
          { ClientId: profile.id },
          { ContractorId: profile.id }
        ]
      }
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found'
      });
    }

    return res.json(contract);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getContracts = async (req, res) => {
  try {
    const { Sequelize } = req.app.get('sequelize');
    const { Contract } = req.app.get('models');
    const { profile } = req;

    const contracts = await Contract.findAll({
      where: {
        status: {
          [Sequelize.Op.not]: 'terminated'
        },
        [Sequelize.Op.or]: [
          { ClientId: profile.id },
          { ContractorId: profile.id }
        ]
      }
    });

    return res.json(contracts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getContractById,
  getContracts
};
