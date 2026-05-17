module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [], // Kosongkan total untuk menghindari crash di Expo Go
  };
};
