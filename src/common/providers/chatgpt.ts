import { fetchSSE } from '../utils'
import * as utils from '../../common/utils'
import { getUniversalFetch } from "../universal-fetch";
import { Provider } from "./type";
import { codeBlock } from 'common-tags';
import { v4 as uuidv4 } from 'uuid'

export const chatgpt: Provider = async (query) => {
  const { rolePrompt, commandPrompt, contentPrompt } = query
  const fetcher = getUniversalFetch()
  let resp: Response | null = null
  resp = await fetcher(utils.defaultChatGPTAPIAuthSession, { signal: query.signal })
  if (resp.status !== 200) {
    query.onError?.('Failed to fetch ChatGPT Web accessToken.')
    query.onStatusCode?.(resp.status)
    return
  }
  const settings = await utils.getSettings()
  const respJson = await resp?.json()
  const body = {
    action: 'next',
    messages: [
      {
        id: uuidv4(),
        role: 'user',
        content: {
          content_type: 'text',
          parts: [
            codeBlock`
                        ${rolePrompt}

                        ${commandPrompt}:
                        ${contentPrompt}
                        `,
          ],
        },
      },
    ],
    model: settings.apiModel, // 'text-davinci-002-render-sha'
    parent_message_id: uuidv4(),
    history_and_training_disabled: true,
  }
  let finished = false
  await fetchSSE(
    `${utils.defaultChatGPTWebAPI}/conversation`,
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${respJson.accessToken}`
      },

      onMessage: (msg) => {
        if (finished) return
        let resp
        try {
          resp = JSON.parse(msg)
          // eslint-disable-next-line no-empty
        } catch {
          query.onFinish('stop')
          finished = true
          return
        }

        if (resp.is_completion) {
          query.onFinish('stop')
          finished = true
          return
        }

        if (!resp.message) {
          return
        }

        const { content, author } = resp.message
        if (author.role === 'assistant') {
          const targetTxt = content.parts.join('')
          let textDelta = targetTxt.slice(length)
          // if (quoteProcessor) {
          //   textDelta = quoteProcessor.processText(textDelta)
          // }
          query.onMessage(targetTxt)
          length = targetTxt.length
        }
      },
      onError: (err) => {
        if (err instanceof Error) {
          query.onError(err.message)
          return
        }
        if (typeof err === 'string') {
          query.onError(err)
          return
        }
        if (typeof err === 'object') {
          const { detail } = err
          if (detail) {
            const { message } = detail
            if (message) {
              query.onError(`ChatGPT Web: ${message}`)
              return
            }
          }
          query.onError(`ChatGPT Web: ${JSON.stringify(err)}`)
          return
        }
        const { error } = err
        if (error instanceof Error) {
          query.onError(error.message)
          return
        }
        if (typeof error === 'object') {
          const { message } = error
          if (message) {
            if (typeof message === 'string') {
              query.onError(message)
            } else {
              query.onError(JSON.stringify(message))
            }
            return
          }
        }
        query.onError('Unknown error')
      },
    }
  )
}
