/// <reference path="./.sst/platform/config.d.ts" />

import { frontend } from "./infra/frontend";

export default $config({
  app(input) {
    return {
      name: "community-connect",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: process.env.PROFILE,
          region: process.env.AWS_REGION as any,
        },
      },
    };
  },
  async run() {
    const result = frontend();

    return {
      ...result,
    };
  },
});
