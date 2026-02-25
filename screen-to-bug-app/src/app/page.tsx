import Link from "next/link";
import JiraSettings from "@/components/JiraSettings";
import AzureDevOpsSettings from "@/components/AzureDevOpsSettings";
import GitHubSettings from "@/components/GitHubSettings";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
            S
          </div>
          <span className="font-semibold text-xl tracking-tight">Screen-to-Bug</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/reports" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Reports
          </Link>
          <div className="flex items-center gap-3">
            <JiraSettings />
            <AzureDevOpsSettings />
            <GitHubSettings />
          </div>
          <Link
            href="/record"
            className="px-5 py-2 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-all active:scale-95 text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-sm font-medium text-blue-400">
          ✨ Powered by Gemini 1.5 Flash
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Manual Testing,<br />Automated Documentation.
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Record a 10-second video of any bug. Our AI watches it, identifies the steps,
          and generates a professional bug report in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/record"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
          >
            Record a Bug
          </Link>
          <Link
            href="/reports"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded-2xl transition-all active:scale-95"
          >
            Review Reports
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Visual AI Reasoning",
              desc: "Gemini understands UI elements, error messages, and complex user flows natively.",
              icon: "👁️",
            },
            {
              title: "Step Generation",
              desc: "Automatically turns mouse clicks and screen changes into ordered reproduction steps.",
              icon: "⚡",
            },
            {
              title: "Zero Setup",
              desc: "No extensions required. Works directly in your browser using the MediaRecorder API.",
              icon: "☁️",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm text-left hover:border-zinc-700 transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-12 text-center text-zinc-600 text-sm">
        <p>© 2026 Screen-to-Bug Reporter AI. Prototype Phase.</p>
      </footer>
    </div>
  );
}
