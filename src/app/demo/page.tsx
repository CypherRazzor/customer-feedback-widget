import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Feedback Widget — Demo",
  description:
    "Live demo of the embeddable Customer Feedback Widget. Click any element to leave feedback.",
};

export default function DemoPage() {
  return (
    <>
      {/* Load the widget in demo mode — no token or API needed */}
      <Script
        src="/widget.js"
        data-demo="true"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-gray-50 font-sans">
        {/* Hero */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <span className="font-semibold text-gray-900">FeedbackWidget</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Demo
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-gray-900">
              How it works
            </a>
            <a href="#install" className="hover:text-gray-900">
              Installation
            </a>
            <a
              href="https://github.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Docs →
            </a>
          </nav>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
          {/* Intro */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              One script. Instant feedback.
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Let customers point at exactly the element they want changed.
              Screenshots included, zero setup required.
            </p>
            <p className="text-sm text-blue-600 font-medium bg-blue-50 inline-block px-4 py-2 rounded-full">
              👇 The widget is already active — click the button in the bottom
              right to try it!
            </p>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Customer clicks the widget",
                  desc: "A floating button appears on your site. Customers click it to enter feedback mode.",
                },
                {
                  step: "2",
                  title: "Pick any element",
                  desc: "They hover over the page and click the element they want to comment on. A screenshot is captured automatically.",
                },
                {
                  step: "3",
                  title: "You receive structured feedback",
                  desc: "The element selector, screenshot, comment, and session info land in your admin dashboard.",
                },
              ].map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="bg-white rounded-xl border border-gray-200 p-6 space-y-2"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                    {step}
                  </div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Installation */}
          <section id="install" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Installation</h2>
            <p className="text-gray-600">
              Add a single{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                &lt;script&gt;
              </code>{" "}
              tag to any page. No npm, no bundler, no framework lock-in.
            </p>

            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">
                  HTML embed snippet
                </span>
              </div>
              <pre className="p-4 text-sm font-mono text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                {`<script
  src="https://your-app.com/widget.js"
  data-token="YOUR_PROJECT_TOKEN"
></script>`}
              </pre>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  data-token
                </p>
                <p className="text-sm text-gray-700">
                  Required. Your project preview token, available in the admin
                  dashboard.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  data-api
                </p>
                <p className="text-sm text-gray-700">
                  Optional. Override the API base URL if hosting the feedback
                  server on a separate domain.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  data-session
                </p>
                <p className="text-sm text-gray-700">
                  Optional. Provide a custom session ID to group feedback from
                  the same reviewer.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  data-demo
                </p>
                <p className="text-sm text-gray-700">
                  Set to{" "}
                  <code className="bg-gray-100 px-1 rounded font-mono text-xs">
                    true
                  </code>{" "}
                  for a no-API demo mode — simulates success without sending
                  data. Used on this page.
                </p>
              </div>
            </div>
          </section>

          {/* Sample content for picking */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Sample content — try selecting elements below
            </h2>
            <p className="text-gray-500 text-sm">
              Open the widget (bottom right) and click any card, button, or
              heading to leave feedback on it.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Product Card Example
                </h3>
                <p className="text-sm text-gray-500">
                  This card represents a typical UI element. Click it in
                  feedback mode to annotate it.
                </p>
                <button className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Add to cart
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Pricing Plan Example
                </h3>
                <p className="text-sm text-gray-500">
                  Another selectable element. Perfect for collecting feedback on
                  pricing copy or CTA button wording.
                </p>
                <button className="w-full border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  Get started free
                </button>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 space-y-2 sm:col-span-2">
                <p className="text-sm font-semibold text-blue-800">
                  💡 Tip: feedback is grouped by session
                </p>
                <p className="text-sm text-blue-700">
                  Customers can leave multiple annotations in a single session
                  before submitting — reducing noise and grouping related
                  comments together.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="border-t border-gray-200 mt-16 px-6 py-8 text-center text-xs text-gray-400">
          Customer Feedback Widget — embeddable via CDN or npm
        </footer>
      </main>
    </>
  );
}
