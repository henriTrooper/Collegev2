// Import logger from external library
const pino = require('pino');
//* * Dans collegien.service, on trouve tous les services qu'on va appler ici  */
const { collegienFindAllCritere, collegienFindColumnsOnly } = require('../../../services/collegien.service');

// Logger configuration
const logger = pino({
  prettyPrint: true,
});

/**
 * Post a new collegien
 *
 * @param req
 * @param res
 */

// Penser à mettre async /await
module.exports = async function getAllCollegienCritere(req, res) {
  logger.info('HANDLER getAllCollegien ou ByCriteria', req.query);
  const params = req.query;

    const findAllCollegienCritere = await collegienFindAllCritere(params);
    /*   console.log('test', JSON.stringify(findAllEolienCritere, null, 2))
     */
    res.status(200).json(findAllCollegienCritere);
  };