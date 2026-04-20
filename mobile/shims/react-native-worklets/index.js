// No-op shim for react-native-css-interop compatibility with Reanimated 3.
// react-native-css-interop/babel.js unconditionally loads 'react-native-worklets/plugin'
// but that only applies to Reanimated 4+.
module.exports = {};
