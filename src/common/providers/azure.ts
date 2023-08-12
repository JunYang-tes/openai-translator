import { urlJoin } from 'url-join-ts';
import * as utils from '../../common/utils'
import { extract, openai } from "./openai";
import { Provider } from "./type";
import { body, error, message } from './openai-familly';
import { fetchSSE } from '../../common/utils';

export const legacyAzure: Provider = async (param) => {
  const {
    rolePrompt,
    commandPrompt,
    contentPrompt
  } = param
  const settings = await utils.getSettings()
  const apiKey = await utils.getApiKey()
  const body = {
    'prompt': `<|im_start|>system\n${rolePrompt}\n<|im_end|>\n<|im_start|>user\n${commandPrompt}\n${contentPrompt}\n<|im_end|>\n<|im_start|>assistant\n`,
    model: settings.apiModel,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    stream: true,
    stop: ['<|im_end|>']
  }
  const headers = {
    'api-key': apiKey
  }
  const url = urlJoin(settings.apiURL, settings.apiURLPath)
  let finished = false // finished can be called twice because event.data is 1. "finish_reason":"stop"; 2. [DONE]
  await utils.fetchSSE(
    url,
    {
      headers,
      body: JSON.stringify(body),
      signal: param.signal,
      onError: error(param),
      onMessage: message(param, (resp) => {

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
        return {
          type: 'message' as const,
          content: choices[0].text
        }
      })
    }
  )
}

export const azure: Provider = async (param) => {
  const settings = await utils.getSettings()
  if (settings.apiURLPath && settings.apiURLPath.indexOf('/chat/completions') < 0) {
    await legacyAzure(param)
  }
  const apiKey = await utils.getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'api-key': apiKey
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
