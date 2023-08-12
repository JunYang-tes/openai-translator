import { Provider } from "./type";
import { fetchSSE } from '../utils'
import * as utils from '../../common/utils'
import { urlJoin } from "url-join-ts";
import { body, error, message } from "./openai-familly";
export const extract = (resp: any) => {
  const { choices } = resp
  if (!choices || choices.length === 0) {
    throw new Error("No result")
  }
  const { finish_reason: finishReason } = choices[0]
  if (finishReason) {
    return {
      type: 'finished' as const,
      reason: finishReason
    }
  }

  const { content = '', role } = choices[0].delta
  return {
    type: 'message' as const,
    content
  }
}

export const openai: Provider = async (param) => {
  const apiKey = await utils.getApiKey();
  const settings = await utils.getSettings()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }
  const url = urlJoin(settings.apiURL, settings.apiURLPath)
  await fetchSSE(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(await body(param)),
    signal: param.signal,
    onMessage: message(param, extract),
    onError: error(param)
  })
}
