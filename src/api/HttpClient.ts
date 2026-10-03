export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export interface HttpClient {
  request<T>(path: string, options?: RequestInit): Promise<T>
}
export class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
          : // Credit card checkout can take up to 30s for the customer plus 60s for the payment.
            AbortSignal.timeout(options.method === 'POST' ? 105000 : 20000),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new ApiError(
        'Não foi possível acessar a API. Verifique sua conexão e tente novamente.',
        0,
      )
    }
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : null
      const message =
        response.status === 404
          ? 'Não encontrado.'
          : response.status === 422
            ? 'Verifique os dados enviados.'
            : 'O servidor não conseguiu concluir a solicitação. Tente novamente.'
      throw new ApiError(message, response.status, detail)
    }
    if (body === null) throw new ApiError('A API retornou uma resposta inválida.', response.status)
    return body as T
  }
}
