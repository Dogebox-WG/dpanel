import { ConnectError, Code, createClient } from "@connectrpc/connect";
import type { AuthenticateResponse } from "/gen/authenticate/v1/authenticate_pb.ts";
import { AuthenticateService } from "/gen/authenticate/v1/authenticate_pb.ts";
import { getTransport } from "/api/transport.ts";
import { store } from "/state/store.js";

type LoginRequest = {
  password: string;
};

type LoginErrorResponse = {
  error: "CHECK-CREDS";
};

export async function postLogin(body: LoginRequest): Promise<AuthenticateResponse | LoginErrorResponse> {
  const client = createClient(AuthenticateService, getTransport());
  try {
    const res = await client.authenticate({ password: body.password });
    if (res.token) {
      store.updateState({ networkContext: { token: res.token } });
    }
    return res;
  } catch (err) {
    if (err instanceof ConnectError && err.code === Code.InvalidArgument) {
      return { error: "CHECK-CREDS" };
    }
    throw err;
  }
}
