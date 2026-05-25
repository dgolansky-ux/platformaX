const BLOCKED_MESSAGES = [
  /^done$/i,
  /^final$/i,
  /^clean$/i,
  /^fix stuff$/i,
  /^working$/i,
  /^full done$/i,
  /^bramka complete$/i,
  /^wip$/i,
  /^temp$/i,
  /^asdf$/i,
];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "test", "docs", "chore", "repair"],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "v2", "governance", "guards", "architecture", "routing",
        "identity", "social", "content", "media", "system",
        "ci", "docs",
      ],
    ],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "header-max-length": [2, "always", 120],
  },
  plugins: [
    {
      rules: {
        "no-blocked-message": ({ header }) => {
          const blocked = BLOCKED_MESSAGES.some((rx) => rx.test(header.trim()));
          return [
            !blocked,
            "Commit message matches a blocked pattern (done/final/clean/fix stuff/working/full done/bramka complete)",
          ];
        },
      },
    },
  ],
};
