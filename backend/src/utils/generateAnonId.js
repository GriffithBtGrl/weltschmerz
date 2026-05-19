const crypto = require('crypto');

const generateAnonId = (req) => {
  // Si el frontend envía un anonymous_id persistente, usarlo
  const clientAnonId = req.headers['x-anonymous-id'];
  if (clientAnonId && clientAnonId.startsWith('anon_')) {
    return clientAnonId;
  }
  // Fallback: generar basado en IP (comportamiento anterior)
  const ip    = req.ip || req.connection.remoteAddress;
  const ua    = req.headers['user-agent'] || '';
  const today = new Date().toISOString().split('T')[0];
  const hash  = crypto.createHash('sha256').update(`${ip}:${ua}:${today}`).digest('hex');
  return `anon_${hash.substring(0, 12)}`;
};

module.exports = { generateAnonId };