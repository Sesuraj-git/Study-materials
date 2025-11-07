import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  workspaces,
  messages,
  studySessions,
  matches,
} from "@/lib/schema";
import { count, sum, desc } from "drizzle-orm";
import {
  Bell,
  Search,
  ChevronDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Grid,
  Plus,
} from "lucide-react";

async function getData() {
  const [[uc], [wc], [mc], [hs]] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(workspaces),
    db.select({ c: count() }).from(messages),
    db.select({ h: sum(studySessions.durationHours) }).from(studySessions),
  ]);
  const latestMatches = await db.select().from(matches).limit(3);
  const recent = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(5);
  return {
    studyPartners: Math.max((uc?.c ?? 0) - 1, 0),
    activeWorkspaces: wc?.c ?? 0,
    messages: mc?.c ?? 0,
    studyHours: hs?.h ?? 0,
    latestMatches,
    recent,
  };
}

export const Header = () => {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex itemscenter gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 grid place-items-center text-white shadow">
            <Target className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">StudyBuddy</span>
        </div>
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {["Dashboard", "Notes", "Flashcards", "Settings"].map((item, i) => (
            <a
              key={item}
              href={`/${item.toLowerCase()}`}
              className={`px-3 py-2 rounded-lg hover:bg-gray-100 transition ${
                i === 0 ? "bg-indigo-50 text-indigo-700" : "text-gray-600"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
          </button>
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] grid place-items-center rounded-full bg-rose-500 text-white">
              3
            </span>
          </button>
          <form action="/api/auth/logout" method="post">
            <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">
              Logout
            </button>
          </form>
          <div className="flex items-center gap-2 bg-white rounded-full border px-2 py-1 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop"
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="hidden sm:block text-sm font-medium">You</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default async function Dashboard() {
  const token = (await cookies()).get("sb_token")?.value;
  const decoded = token ? verifyToken<{ userId: string }>(token) : null;
  if (!decoded) {
    redirect("/login");
  }
  const data = await getData();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-400 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">
                Welcome back! <span className="inline-block">👋</span>
              </h2>
              <p className="text-white/90 mt-1">
                You have 3 new notifications and 11 potential study partners
                waiting.
              </p>
            </div>
            <a
              href="/notes"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl border border-white/20"
            >
              <Plus className="h-4 w-4" /> Upload Note
            </a>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat
            title="Study Partners"
            value={String(data.studyPartners)}
            trend="+12% vs last week"
            iconBg="bg-violet-100 text-violet-700"
          >
            <Users className="h-5 w-5" />
          </Stat>
          <Stat
            title="Active Workspaces"
            value={String(data.activeWorkspaces)}
            trend="+8% vs last week"
            iconBg="bg-emerald-100 text-emerald-700"
          >
            <Grid className="h-5 w-5" />
          </Stat>
          <Stat
            title="Messages"
            value={String(data.messages)}
            trend="+23% vs last week"
            iconBg="bg-orange-100 text-orange-700"
          >
            <MessageSquare className="h-5 w-5" />
          </Stat>
          <Stat
            title="Study Hours"
            value={`${data.studyHours}h`}
            trend="+15% vs last week"
            iconBg="bg-green-100 text-green-700"
          >
            <Clock className="h-5 w-5" />
          </Stat>
        </section>
      </main>
    </div>
  );
}

function Stat({
  title,
  value,
  trend,
  iconBg,
  children,
}: {
  title: string;
  value: string;
  trend: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-emerald-600">{trend}</p>
        </div>
        <div
          className={`h-10 w-10 rounded-xl grid place-items-center ${iconBg}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
