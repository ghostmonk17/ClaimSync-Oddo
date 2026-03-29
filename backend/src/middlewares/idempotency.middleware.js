const crypto = require('crypto');
const Idempotency = require('../modules/idempotency/idempotency.model');

const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    return next(); // Skip if no key provided, or return 400 if strictly required for all POSTs
  }

  try {
    const bodyString = JSON.stringify(req.body || {}) || '{}';
    const payloadHash = crypto.createHash('sha256').update(bodyString).digest('hex');
    const existingReq = await Idempotency.findOne({ key: idempotencyKey });

    if (existingReq) {
      if (existingReq.request_hash !== payloadHash) {
        return res.status(409).json({
          success: false,
          message: 'Idempotency key mismatch. Payload differs from original request.'
        });
      }
      
      // If we have a saved response, return it directly
      if (existingReq.response) {
        return res.status(200).json(existingReq.response);
      } else {
        return res.status(409).json({
          success: false,
          message: 'Request is already processing.'
        });
      }
    }

    // Create pending idempotency record
    await Idempotency.create({
      key: idempotencyKey,
      request_hash: payloadHash,
      response: null
    });

    // Intercept res.json to save response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Save response asynchronously
      Idempotency.updateOne(
        { key: idempotencyKey },
        { $set: { response: data } }
      ).catch(err => console.error('Failed to update idempotency response:', err));
      
      return originalJson(data);
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = idempotencyMiddleware;
