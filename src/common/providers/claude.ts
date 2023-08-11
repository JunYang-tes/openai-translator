import { Provider } from "./type";
import * as utils from "../../common/utils";
import { getUniversalFetch } from "../universal-fetch";

async function getOrgId(sessionKey: string) {
  const fetch = getUniversalFetch()
  const resp = await fetch("https://claude.ai/api/organizations", {
    headers: {
      "content-type": "application/json",
      "cookie": `sessionKey=${sessionKey}`
    }
  })
  const data = await resp.json()
  return data[0].uuid
}

async function createConversationId(sessionKey: string, orgId: string, name: string, id: string) {
  const resp = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations`, {
    headers: {
      "content-type": "application/json",
      "cookie": `sessionKey=${sessionKey}`
    },
    method: "POST",
    body: JSON.stringify({
      name,
      uuid: id
    })
  })
  console.debug(await resp.json())
  return id
}

async function sendMessage(
  sessionKey: string,
  message: string,
  orgId: string,
  conversationId: string,
  param: {
    onMessage(data: string): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(error: any): void;
    signal: AbortSignal;
  }
) {
  utils.fetchSSE("https://claude.ai/api/append_message", {
    headers: {
      "content-type": "application/json",
      "cookie": `sessionKey=${sessionKey}`
    },
    method: "POST",
    body: JSON.stringify({
      organization_uuid: orgId,
      conversation_uuid: conversationId,
      attachments: [],
      text: message,
      completion: {
        prompt: message,
        incremental: true,
        mode: "claude-2"
      }
    }),
    ...param
  })
    .catch(e=>param.onError(e.message ?? "Failed to send message"))
}

let orgId: string = ''
let conversationId: string = 'b9d6b6ab-e436-4649-b5ab-734bebce43aa'

async function init() {
  const sessionKey = await utils.getApiKey()
  if (orgId == '') {
    orgId = await getOrgId(sessionKey)
    try {
      conversationId = await createConversationId(sessionKey, orgId, "opanai-translator", conversationId)
    } catch (e) {
      console.log(e)
    }
  }

}


export const claude: Provider = async (param) => {
  const sessionKey = await utils.getApiKey()
  await init()
  sendMessage(
    sessionKey,
    `${param.rolePrompt}
    ${param.commandPrompt}
    ${param.contentPrompt}`,
    orgId,
    conversationId,
    {
      signal: param.signal,
      onMessage: (data) => {
        param.onMessage({
          content: JSON.parse(data).completion,
          role: "",
          isWordMode: param.isWordMode
        })
      },
      onError: param.onError
    }
  )
}
