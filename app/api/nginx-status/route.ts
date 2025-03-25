import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Replace with your actual Nginx status URL
    const nginxStatusUrl = process.env.NGINX_STATUS_URL || "http://localhost/nginx_status"

    // Add timeout to the fetch request to avoid long hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(nginxStatusUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/plain",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Return error status but with fallback data
      return new NextResponse(
        JSON.stringify({
          error: `Failed to fetch Nginx status: ${response.status}`,
          connectionStatus: "offline",
          // Return a minimal valid Nginx status format so the client can continue
          fallbackData: "Active connections: 0 \nserver accepts handled requests\n 0 0 0",
        }),
        {
          status: 200, // Return 200 so the client can still process the response
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const text = await response.text()
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    // Return error status but with fallback data
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch Nginx status",
        connectionStatus: "offline",
        // Return a minimal valid Nginx status format so the client can continue
        fallbackData: "Active connections: 0 \nserver accepts handled requests\n 0 0 0",
      }),
      {
        status: 200, // Return 200 so the client can still process the response
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

