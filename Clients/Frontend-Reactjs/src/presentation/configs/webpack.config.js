module.exports = {
  // ... other configurations
  module: {
    rules: [
      // ... other rules
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
};
