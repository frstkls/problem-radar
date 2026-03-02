import "./globals.css";

export const metadata = {
  title: "ProblemRadar — AI-Powered Problem Discovery",
  description:
    "Discover real problems and unmet needs by scanning Reddit, forums, reviews, and social media. Find your next startup idea.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
