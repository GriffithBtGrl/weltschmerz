const { query } = require('./db');

const testConnection = async () => {
  try {
    const res = await query('SELECT COUNT(*) FROM boards');
    console.log('✅ DB conectada. Boards:', res.rows[0].count);
  } catch (err) {
    console.error('❌ Error conectando a DB:', err.message);
  }
};

module.exports = { testConnection };