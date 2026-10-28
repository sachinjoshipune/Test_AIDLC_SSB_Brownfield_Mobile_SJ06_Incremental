module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo wraps the standard @react-native/babel-preset and
    // additionally enables react-native-web support for `expo start --web`
    // (dev-preview tooling only; native iOS/Android builds are unaffected).
    presets: ['babel-preset-expo'],
  };
};
