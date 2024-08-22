import { startMock, stopMock, installMock, uninstallMock } from "./action/action.mocks.js"
import { mock as bootstrapMocks } from "./bootstrap/bootstrap.mocks.js"
import { postResponse as pupConfigPost, getResponse as pupConfigGetById, getAllResponse as pupConfigGetAll } from "./config/config.mocks.js";
import { getResponse as dkmGet } from "./keys/get-keylist.mocks.js";
import { postResponse as dkmCreate } from "./keys/create-key.mocks.js";
import { postResponse as authLogin } from "./login/login.mocks.js"
import { getResponse as networkList } from "./network/get-networks.mocks.js";
import { postResponse as networkSet } from "./network/set-network.mocks.js";
import { postResponse as changePass } from "./password/change-pass.mocks.js"
import { getResponse as checkReflector } from "./reflector/get-ip.mocks.js";
import { getResponse as apModeFacts } from "./setup/get-bootstrap.mocks.js";

export const mocks = [
  bootstrapMocks,
  installMock,
  uninstallMock,
  startMock,
  stopMock,
  pupConfigGetAll,
  pupConfigGetById,
  pupConfigPost,
  dkmGet,
  dkmCreate,
  authLogin,
  networkList,
  networkSet,
  changePass,
  checkReflector,
  apModeFacts
]
