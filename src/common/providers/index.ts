import { azure } from "./azure";
import { chatgpt } from "./chatgpt";
import { claude } from "./claude";
import { openai } from "./openai";

export const providers = {
  Claude: claude,
  OpenAI: openai,
  ChatGPT: chatgpt,
  Azure:azure
}
