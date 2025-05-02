import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { PropsWithChildren } from "react";
import { AutoConnectProvider } from "@/components/AutoConnectProvider";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import AptosHealthcareChat from "@/components/AptosHealthcareChat";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Medical Records",
  description:
    "Aptos Medical Records DApp",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex justify-center min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
       
          <AutoConnectProvider>
            <ReactQueryClientProvider>
              <WalletProvider>
                {children}
                <AptosHealthcareChat />
                
              </WalletProvider>
            </ReactQueryClientProvider>
          </AutoConnectProvider>
        
      </body>
    </html>
  );
}