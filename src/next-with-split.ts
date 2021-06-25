const rule = (source: string, destination: string, additional = {}) => ({
  source,
  destination,
  ...additional,
});
const has = (value = "original") => [
  {
    type: "cookie",
    key: "next-with-split",
    value,
  },
];

type Mappings = { [branch: string]: string }

const makeRewrites =
  (mappings: Mappings, rootPage: string, active: boolean) => async () => {
    if (!active || Object.keys(mappings).length < 2)
      return [rule("/", `/${rootPage}`)];

    return {
      beforeFiles: [
        ...Object.entries(mappings)
          .map(([branch, origin]) => [
            rule("/", `${origin}/${rootPage}/`, { has: has(branch) }),
            rule("/:path*/", `${origin}/:path*`, { has: has(branch) }),
          ])
          .flat(),
        rule("/:path*/", "/_split-challenge"),
      ],
    };
  };

type Options = {
  branchMappings: Mappings
  rootPage: string,
  mainBranch: string,
  active: boolean,
};

const defaultOptions: Options = {
  branchMappings: {},
  rootPage: "top",
  mainBranch: "main",
  active: process.env.VERCEL_ENV === "production",
};

type NextWithSplitArgs = {
  splits: Partial<Options>,
  env?: Record<string, string>
  [x: string]: unknown
};

const nextWithSplit = (args: NextWithSplitArgs) => {
  const { splits, ...nextConfig } = args;
  const options = { ...defaultOptions, ...(splits ?? {}) };
  const mappings = { [options.mainBranch]: "", ...options.branchMappings };

  if (options.active && Object.keys(mappings).length > 1) {
    console.log("Split tests are active.");
    console.table(
      Object.entries(mappings).map(([branch, origin]) => ({
        branch,
        tergetOrigin: origin || "original",
      }))
    );
  }

  return {
    ...nextConfig,
    env: {
      ...(nextConfig.env ?? {}),
      SPLIT_TEST_BRANCHES: JSON.stringify(Object.keys(mappings)),
    },
    trailingSlash: true,
    assetPrefix: mappings[process.env.VERCEL_GIT_COMMIT_REF ?? ""] ?? "",
    rewrites: makeRewrites(mappings, options.rootPage, options.active),
  };
};

module.exports = nextWithSplit;
