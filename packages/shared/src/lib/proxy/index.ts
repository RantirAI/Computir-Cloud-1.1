import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";

export const ProxyConfig = Type.Object({
  ...BaseModelSchema,
  defaultHeaders: Type.Record(Type.String(), Type.String({ minLength: 1 })),
  baseUrl: Type.String({
    pattern: '^https?://.+$',
  }),
  provider: Type.String({ minLength: 1 }),
  platformId: Type.String(),
})

export type ProxyConfig = Static<typeof ProxyConfig>;