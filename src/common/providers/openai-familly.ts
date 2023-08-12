import { ProviderParam } from "./type";
import * as utils from '../../common/utils'
import { Provider } from "styletron-react";

export function error(param: ProviderParam) {
  return (err: any) => {
    if (err instanceof Error) {
      param.onError(err.message)
      return
    }
    if (typeof err === 'string') {
      param.onError(err)
      return
    }
    if (typeof err === 'object') {
      const { detail } = err
      if (detail) {
        param.onError(detail)
        return
      }
    }
    const { error } = err
    if (error instanceof Error) {
      param.onError(error.message)
      return
    }
    if (typeof error === 'object') {
      const { message } = error
      if (message) {
        if (typeof message === 'string') {
          param.onError(message)
        } else {
          param.onError(JSON.stringify(message))
        }
        return
      }
    }
    param.onError('Unknown error')
  }
}

export async function body(param: ProviderParam) {
  const settings = await utils.getSettings()
  const { rolePrompt, commandPrompt, contentPrompt } = param
  const messages = [
    {
      role: 'system',
      content: rolePrompt,
    },
    {
      role: 'user',
      content: commandPrompt,
    },
  ]
  if (contentPrompt) {
    messages.push({
      role: 'user',
      content: contentPrompt,
    })
  }
  return {
    model: settings.apiModel,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    stream: true,
    messages
  }
}
export type Message =
  | {
    type: 'finished',
    reason: string
  }
  | { type: 'message', content: string }
export function message(param: ProviderParam,
  extract: (data: any) => Message) {
  let finished = false
  return (msg: string) => {
    if (finished) return
    let resp
    try {
      resp = JSON.parse(msg)
      // eslint-disable-next-line no-empty
    } catch {
      param.onFinish('stop')
      finished = true
      return
    }
    const data = extract(resp)
    if (data.type === 'finished') {
      param.onFinish(data.reason)
      finished = true
    } else {
      param.onMessage(data.content)
    }
  }
}

