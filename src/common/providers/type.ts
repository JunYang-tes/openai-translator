export type ProviderParam = {
  rolePrompt: string
  commandPrompt: string
  contentPrompt: string
  isWordMode: boolean
  onMessage: (
    message: string
  ) => void,
  onError: (error: string) => void;
  onFinish: (reason: string) => void;
  onStatusCode?: (statusCode: number) => void;
  signal: AbortSignal;
}
export type Provider = (params: ProviderParam) => Promise<any>
