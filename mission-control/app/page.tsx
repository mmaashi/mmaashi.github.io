import { Clock, Zap, CheckSquare, Briefcase, Target, Brain, Terminal, Settings, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-blue-500/30 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-slate-900 px-4 py-2 rounded-lg">
                    <Briefcase className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    MOUSA Control Panel
                  </h1>
                  <p className="text-blue-300/60 text-sm mt-1">Command Center & Productivity Hub</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-200 transition-all hover:scale-105">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main className="mx-auto max-w-7xl px-6 py-12">
          {/* Goals Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-7 w-7 text-amber-400" />
              <h2 className="text-2xl font-bold text-white">Your Goals</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GoalCard title="Build Mission Control" progress={45} color="cyan" description="Create the ultimate productivity dashboard" />
              <GoalCard title="Master OpenClaw Integration" progress={60} color="blue" description="Connect all tools and automate workflows" />
              <GoalCard title="Optimize Daily Routine" progress={30} color="purple" description="Streamline tasks and decision-making" />
            </div>
          </section>

          {/* Main Features Grid */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-7 w-7 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Quick Access</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<CheckSquare className="h-6 w-6" />}
                title="Tasks"
                description="Manage your todo list"
                status="Coming Soon"
                color="blue"
              />

              <FeatureCard
                icon={<Clock className="h-6 w-6" />}
                title="Schedule"
                description="View upcoming events"
                status="Coming Soon"
                color="purple"
              />

              <FeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="AI Insights"
                description="Get daily recommendations"
                status="Coming Soon"
                color="emerald"
              />

              <FeatureCard
                icon={<Briefcase className="h-6 w-6" />}
                title="Projects"
                description="Track active work streams"
                status="Coming Soon"
                color="orange"
              />
            </div>
          </section>

          {/* Command Panel Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="h-7 w-7 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Command Console</h2>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-slate-900/80 backdrop-blur border border-green-500/30 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-green-400 font-mono text-sm">ready for commands</p>
                </div>
                <input
                  type="text"
                  placeholder="Type a command... (coming soon)"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded text-green-200 placeholder-green-600/50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50"
                  disabled
                />
                <p className="text-green-600/60 text-xs mt-4 font-mono">
                  Available: weather | tasks | schedule | run-agent | custom-action
                </p>
              </div>
            </div>
          </section>

          {/* Sub-Agent Space */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-7 w-7 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Sub-Agent Dashboard</h2>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-slate-900/80 backdrop-blur border border-purple-500/30 rounded-lg p-12 text-center">
                <div className="inline-block p-4 bg-purple-500/10 rounded-lg mb-4">
                  <Brain className="h-8 w-8 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Autonomous Agent Ready</h3>
                <p className="text-purple-300/70 mb-6 max-w-lg mx-auto">
                  Space reserved for sub-agent integration. In the future, your personal AI assistant will live here and execute complex tasks in the background.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge text="Background Tasks" />
                  <Badge text="Parallel Execution" />
                  <Badge text="Real-time Updates" />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Active Goals" value="3" color="amber" />
              <StatCard label="Tasks Today" value="—" color="blue" />
              <StatCard label="Automation Rules" value="1" color="green" />
              <StatCard label="System Health" value="100%" color="emerald" />
            </div>
          </section>

          {/* Footer/Info */}
          <section className="border-t border-blue-500/20 pt-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  What's Next
                </h3>
                <ul className="space-y-3 text-blue-300/70 text-sm">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                    <span>Things 3 task integration (pull your todos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                    <span>Calendar & event overview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                    <span>Live command execution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                    <span>Sub-agent integration & monitoring</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  System Info
                </h3>
                <div className="space-y-2 text-blue-300/70 text-sm font-mono">
                  <p>Framework: <span className="text-cyan-300">Next.js 15</span></p>
                  <p>Styling: <span className="text-cyan-300">Tailwind CSS</span></p>
                  <p>Language: <span className="text-cyan-300">TypeScript</span></p>
                  <p>Status: <span className="text-green-400">● Active</span></p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

interface GoalCardProps {
  title: string;
  progress: number;
  color: 'cyan' | 'blue' | 'purple';
  description: string;
}

function GoalCard({ title, progress, color, description }: GoalCardProps) {
  const colorMap = {
    cyan: { bg: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', bar: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    blue: { bg: 'from-blue-500/20 to-purple-500/10', border: 'border-blue-500/30', text: 'text-blue-400', bar: 'bg-gradient-to-r from-blue-500 to-purple-500' },
    purple: { bg: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/30', text: 'text-purple-400', bar: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  };

  const colors = colorMap[color];

  return (
    <div className={`relative group bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-6 backdrop-blur transition-all hover:scale-105`}>
      <h3 className={`${colors.text} font-bold mb-2`}>{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
        <div className={`${colors.bar} h-full rounded-full transition-all`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className={`${colors.text} text-xs mt-2 font-mono`}>{progress}% complete</p>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
  color: 'blue' | 'purple' | 'emerald' | 'orange';
}

function FeatureCard({ icon, title, description, status, color }: FeatureCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20',
  };

  return (
    <div className={`rounded-lg border bg-gradient-to-br ${colorClasses[color]} p-6 backdrop-blur transition-all hover:scale-105 cursor-pointer group`}>
      <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="mb-2 font-bold text-white">{title}</h3>
      <p className="mb-4 text-sm text-slate-300">{description}</p>
      <p className="text-xs text-slate-500 group-hover:text-slate-400">{status}</p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: 'amber' | 'blue' | 'green' | 'emerald';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-lg p-6 backdrop-blur text-center`}>
      <p className="text-slate-400 text-xs font-mono mb-2">{label}</p>
      <p className={`text-3xl font-black ${colors[color].split(' ')[2]}`}>{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-xs font-medium">
      {text}
    </span>
  );
}
