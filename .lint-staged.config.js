module.exports = {
  'src/**/*.{js,jsx,ts,tsx}': ['yarn fix --no-error-on-unmatched-pattern', () => "bash -c 'tsc --noEmit'"],
};
