import "@testing-library/jest-dom";

import { matchers } from "@emotion/jest";
import type { MatchersObject } from "@vitest/expect";

expect.extend(matchers as unknown as MatchersObject);
