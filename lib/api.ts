const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type ApiInit = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, init: ApiInit = {}) {
  const { auth = true, ...rest } = init;

  const headers = new Headers(rest.headers || {});
  if (!headers.has("Content-Type") && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && typeof window !== "undefined") {
    const token =
      window.localStorage.getItem("dl_token") ??
      window.sessionStorage.getItem("dl_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(API_URL + path, {
    ...rest,
    headers,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}
