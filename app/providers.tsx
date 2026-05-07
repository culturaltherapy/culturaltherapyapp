"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1
      }
    }
  });

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
