export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-request-id',
}

export type ApiResponse<T = any> = {
    ok: boolean;
    code?: string;
    message?: string;
    data?: T;
    error?: any;
    request_id?: string;
};

export const standardResponse = (
    body: ApiResponse,
    status: number = 200,
    headers: HeadersInit = {}
) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'x-content-type-options': 'nosniff',
            ...headers
        }
    });
}

export const normalizeError = (error: any): ApiResponse => {
    // Structured error handling
    console.error("Function Error:", error);
    return {
        ok: false,
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        error: error // Include raw if needed for debugging, or screen it
    };
}
