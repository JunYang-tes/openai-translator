export type Provider = (params: {
  rolePrompt: string
  commandPrompt: string
  contentPrompt: string
  isWordMode: boolean
  onMessage: (
    message: {
      content: string;
      role: string;
      isWordMode: boolean
      isFullText?: boolean
    }
  ) => void,
  onError: (error: string) => void;
  onFinish: (reason: string) => void;
  onStatusCode?: (statusCode: number) => void;
  signal: AbortSignal;
}) => Promise<any>
