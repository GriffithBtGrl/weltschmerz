const getAnonId = () => {
  let anonId = localStorage.getItem('anonymous_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substring(2, 14);
    localStorage.setItem('anonymous_id', anonId);
  }
  return anonId;
};

export default getAnonId;