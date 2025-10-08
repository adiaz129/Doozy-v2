
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);
  defaultConfig.resolver.sourceExts.push('cjs');
  defaultConfig.resolver.unstable_enablePackageExports = false;

  const { transformer, resolver } = defaultConfig;

  defaultConfig.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
  };
  defaultConfig.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"]
  };

  return defaultConfig;
})();