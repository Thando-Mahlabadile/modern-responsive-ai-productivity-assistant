import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Home,
  Lightbulb,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Target,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workmate AI — Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft emails, summarise meetings, and plan focused work in one AI productivity workspace.",
      },
      { property: "og:title", content: "Workmate AI — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarise meetings, and plan focused work in one AI productivity workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkmateApp,
});

type View = "dashboard" | "email" | "meeting" | "chat" | "settings";
type Tone = "Formal" | "Friendly" | "Persuasive";
type Activity = { title: string; detail: string; time: string; icon: typeof Mail };

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "email", label: "Email Generator", icon: Mail },
  { id: "meeting", label: "Meeting Summariser", icon: FileText },
  { id: "chat", label: "AI Assistant", icon: MessageSquareText },
  { id: "settings", label: "Settings", icon: Settings },
];

const featureCards = [
  {
    id: "email" as View,
    title: "Smart Email Generator",
    copy: "Turn a few clear points into a professional, ready-to-send email.",
    icon: Mail,
    accent: "bg-secondary text-secondary-foreground",
    action: "Draft an email",
  },
  {
    id: "meeting" as View,
    title: "Meeting Summariser",
    copy: "Transform raw notes into decisions, owners, deadlines, and next steps.",
    icon: ClipboardCheck,
    accent: "bg-accent text-accent-foreground",
    action: "Summarise notes",
  },
  {
    id: "chat" as View,
    title: "AI Workplace Assistant",
    copy: "Brainstorm, plan, rewrite, and solve everyday workplace challenges.",
    icon: BrainCircuit,
    accent: "bg-success/15 text-success-foreground",
    action: "Start a conversation",
  },
];

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function WorkmateApp() {
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [defaultTone, setDefaultTone] = useState<Tone>("Formal");
  const [concise, setConcise] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const navigate = (next: View) => {
    setView(next);
    setMobileOpen(false);
  };
  const record = (activity: Activity) => setActivities((items) => [activity, ...items].slice(0, 5));
  const pageTitle = navItems.find((item) => item.id === view)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
          <button className="flex items-center gap-3" onClick={() => navigate("dashboard")}>
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <WandSparkles className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-base font-extrabold">Workmate AI</span>
              <span className="block text-xs text-muted-foreground">Work smarter, calmly</span>
            </span>
          </button>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={view === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${view === item.id ? "font-bold text-primary" : "text-muted-foreground"}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon />
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="m-4 rounded-lg border border-sidebar-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-primary" />
            Responsible AI
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Always review workplace-ready content before sharing.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8 lg:h-20">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <div>
              <p className="truncate text-lg font-extrabold md:text-xl">{pageTitle}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Your focused workplace toolkit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-success" />
              Live AI
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              TM
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <div className="animate-rise-in" key={view}>
            {view === "dashboard" && <Dashboard onNavigate={navigate} activities={activities} />}
            {view === "email" && <EmailGenerator defaultTone={defaultTone} record={record} />}
            {view === "meeting" && <MeetingSummariser record={record} concise={concise} />}
            {view === "chat" && <WorkplaceChat record={record} concise={concise} />}
            {view === "settings" && (
              <SettingsView
                tone={defaultTone}
                setTone={setDefaultTone}
                concise={concise}
                setConcise={setConcise}
              />
            )}
          </div>
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
          <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              AI-generated content may contain errors. Review outputs before using them for
              workplace decisions or communication.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Dashboard({
  onNavigate,
  activities,
}: {
  onNavigate: (view: View) => void;
  activities: Activity[];
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold text-primary">YOUR WORKSPACE</p>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-4xl">
            Good afternoon.
          </h1>
          <p className="mt-2 text-muted-foreground">What would you like to move forward today?</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          Thursday, 24 September
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {featureCards.map((feature) => (
          <Panel
            key={feature.id}
            className="group flex min-h-64 flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <span className={`grid size-11 place-items-center rounded-lg ${feature.accent}`}>
              <feature.icon className="size-5" />
            </span>
            <h2 className="mt-6 text-lg font-extrabold">{feature.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {feature.copy}
            </p>
            <Button
              variant="ghost"
              className="mt-5 w-fit px-0 text-primary hover:bg-transparent"
              onClick={() => onNavigate(feature.id)}
            >
              {feature.action}
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-extrabold">Recent activity</h2>
              <p className="text-xs text-muted-foreground">Created during this session</p>
            </div>
          </div>
          {activities.length ? (
            <div className="divide-y divide-border">
              {activities.map((item, index) => (
                <div className="flex items-center gap-4 px-5 py-4" key={`${item.title}-${index}`}>
                  <span className="grid size-9 place-items-center rounded-md bg-muted">
                    <item.icon className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-muted">
                  <PanelLeftClose className="size-5 text-muted-foreground" />
                </span>
                <p className="mt-3 text-sm font-bold">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your generated work will appear here.
                </p>
              </div>
            </div>
          )}
        </Panel>
        <Panel className="bg-primary p-6 text-primary-foreground">
          <p className="text-sm font-bold opacity-80">PRODUCTIVITY TIP</p>
          <Lightbulb className="mt-8 size-7" />
          <h2 className="mt-4 text-xl font-extrabold">Start with the outcome.</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            Tell Workmate what “done” looks like. Clear outcomes produce clearer drafts, plans, and
            summaries.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function EmailGenerator({
  defaultTone,
  record,
}: {
  defaultTone: Tone;
  record: (activity: Activity) => void;
}) {
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generate = async () => {
    if (!purpose.trim() || !context.trim()) {
      setError("Add the purpose and recipient context before generating.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "email", purpose, context, tone }),
      });
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !data.text) throw new Error(data.error || "Could not generate the email.");
      setResult(data.text);
      setLoading(false);
      record({ title: "Email draft created", detail: purpose, time: "Just now", icon: Mail });
    } catch (generationError) {
      setLoading(false);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate the email. Please try again.",
      );
    }
  };
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="WRITE WITH CLARITY"
        title="Smart Email Generator"
        copy="Give the essentials. Get a polished draft that still sounds like you."
      />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel className="p-5 md:p-6">
          <div className="space-y-5">
            <Field label="What is this email about?">
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Project timeline update"
              />
            </Field>
            <Field label="Recipient and context">
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-32"
                placeholder="Who are you writing to, and what do they already know?"
              />
            </Field>
            <Field label="Tone">
              <div className="grid grid-cols-3 gap-2">
                {(["Formal", "Friendly", "Persuasive"] as Tone[]).map((item) => (
                  <Button
                    key={item}
                    variant={tone === item ? "default" : "outline"}
                    onClick={() => setTone(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </Field>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" size="lg" onClick={generate} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Crafting your email…
                </>
              ) : (
                <>
                  <WandSparkles />
                  Generate email
                </>
              )}
            </Button>
          </div>
        </Panel>
        <ResultPanel
          title="Your email"
          subtitle={
            result ? "Edit anything before you send it." : "Your generated draft will appear here."
          }
          actions={
            result && (
              <>
                <CopyButton text={result} />
                <Button size="sm" onClick={generate} disabled={loading}>
                  <RotateCcw />
                  Regenerate
                </Button>
              </>
            )
          }
        >
          {loading ? (
            <LoadingBlock label="Writing a polished draft…" />
          ) : result ? (
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="min-h-[480px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          ) : (
            <EmptyResult
              icon={<Mail />}
              title="Ready when you are"
              copy="Complete the brief and generate a professional email in seconds."
            />
          )}
        </ResultPanel>
      </div>
    </div>
  );
}

function MeetingSummariser({
  record,
  concise,
}: {
  record: (activity: Activity) => void;
  concise: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sections, setSections] = useState<Record<string, string> | null>(null);
  const summarise = async () => {
    if (notes.trim().length < 40) {
      setError("Add a little more detail so the summary can identify useful outcomes.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "meeting", notes, concise }),
      });
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !data.text) throw new Error(data.error || "Could not summarise the notes.");
      setSections(parseMeetingSections(data.text));
      setLoading(false);
      record({
        title: "Meeting notes summarised",
        detail: `${notes.split(/\s+/).length} words processed`,
        time: "Just now",
        icon: ClipboardCheck,
      });
    } catch (summaryError) {
      setLoading(false);
      setError(
        summaryError instanceof Error
          ? summaryError.message
          : "Could not summarise the notes. Please try again.",
      );
    }
  };
  const allText = sections
    ? Object.entries(sections)
        .map(([key, value]) => `${key}\n${value}`)
        .join("\n\n")
    : "";
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="FROM NOTES TO NEXT STEPS"
        title="Meeting Notes Summariser"
        copy="Capture the signal, clarify ownership, and leave every meeting with momentum."
      />
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel className="p-5 md:p-6">
          <Field
            label="Meeting notes"
            hint={`${notes.trim() ? notes.trim().split(/\s+/).length : 0} words`}
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[420px] resize-none"
              placeholder="Paste your raw meeting notes here…"
            />
          </Field>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button className="mt-5 w-full" size="lg" onClick={summarise} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="animate-spin" />
                Finding the key outcomes…
              </>
            ) : (
              <>
                <WandSparkles />
                Summarise meeting
              </>
            )}
          </Button>
        </Panel>
        <ResultPanel
          title="Meeting intelligence"
          subtitle={
            sections
              ? "Review and refine the extracted outcomes."
              : "Structured insights will appear here."
          }
          actions={sections && <CopyButton text={allText} label="Copy all" />}
        >
          {loading ? (
            <LoadingBlock label="Organising notes…" />
          ) : sections ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(sections).map(([title, value], index) => (
                <div
                  key={title}
                  className={`rounded-md border border-border bg-background p-4 ${index === 0 || index === 4 ? "sm:col-span-2" : ""}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold">
                      {title === "Summary" ? (
                        <FileText className="text-primary" />
                      ) : title === "Action Items" ? (
                        <Target className="text-primary" />
                      ) : title === "Decisions" ? (
                        <CheckCircle2 className="text-primary" />
                      ) : title === "Deadlines" ? (
                        <CalendarClock className="text-primary" />
                      ) : (
                        <Lightbulb className="text-primary" />
                      )}
                      {title}
                    </h3>
                    <CopyButton text={value} label="" />
                  </div>
                  <Textarea
                    value={value}
                    onChange={(e) =>
                      setSections((current) =>
                        current ? { ...current, [title]: e.target.value } : current,
                      )
                    }
                    className="min-h-28 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyResult
              icon={<ClipboardCheck />}
              title="Turn discussion into direction"
              copy="Add notes to extract the summary, actions, decisions, deadlines, and key points."
            />
          )}
        </ResultPanel>
      </div>
    </div>
  );
}

const suggestions = [
  "Plan my priorities for this week",
  "Rewrite a message to sound more confident",
  "Brainstorm ideas for a team workshop",
  "Create an agenda for a project kickoff",
];

const meetingMarkers = ["SUMMARY", "ACTION ITEMS", "DECISIONS", "DEADLINES", "KEY POINTS"];

function parseMeetingSections(text: string) {
  const sections: Record<string, string> = {};
  meetingMarkers.forEach((marker, index) => {
    const start = text.indexOf(`[${marker}]`);
    const nextMarker = meetingMarkers[index + 1];
    const end = nextMarker ? text.indexOf(`[${nextMarker}]`) : text.length;
    const title = marker
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    sections[title] = start >= 0 ? text.slice(start + marker.length + 2, end).trim() : "Not captured.";
  });
  return sections;
}

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function WorkplaceChat({
  record,
  concise,
}: {
  record: (activity: Activity) => void;
  concise: boolean;
}) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { concise } }),
    [concise],
  );
  const { messages, sendMessage, status, error, setMessages, clearError } = useChat({
    id: "workmate-session",
    transport,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);
  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || status === "submitted" || status === "streaming") return;
    clearError();
    await sendMessage({ text: clean });
    record({
      title: "AI Assistant conversation",
      detail: clean,
      time: "Just now",
      icon: MessageSquareText,
    });
  };
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="THINK IT THROUGH"
        title="AI Workplace Assistant"
        copy="A clear thinking partner for writing, planning, and productive work."
      />
      <Panel className="flex h-[min(720px,calc(100vh-230px))] min-h-[580px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bot />
            </span>
            <div>
              <p className="text-sm font-extrabold">Workmate</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" />
                Ready to help
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
              <RotateCcw />
              New chat
            </Button>
          )}
        </div>
        <Conversation>
          <ConversationContent className="mx-auto w-full max-w-3xl gap-5 p-5">
            {messages.length === 0 ? (
              <ConversationEmptyState>
                <div className="w-full py-8">
                  <span className="mx-auto grid size-14 place-items-center rounded-lg bg-secondary text-primary">
                    <BrainCircuit className="size-7" />
                  </span>
                  <h2 className="mt-5 text-xl font-extrabold">What can we make easier?</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Start with a task, a rough idea, or something you need to communicate.
                  </p>
                  <div className="mx-auto mt-7 grid max-w-xl gap-2 sm:grid-cols-2">
                    {suggestions.map((item) => (
                      <Button
                        key={item}
                        variant="outline"
                        className="h-auto justify-between whitespace-normal p-3 text-left text-xs"
                        onClick={() => send(item)}
                      >
                        {item}
                        <ChevronRight className="shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent
                    className={message.role === "user" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {editingId === message.id && message.role === "assistant" ? (
                      <Textarea
                        value={messageText(message)}
                        onChange={(event) =>
                          setMessages((current) =>
                            current.map((item) =>
                              item.id === message.id
                                ? { ...item, parts: [{ type: "text", text: event.target.value }] }
                                : item,
                            ),
                          )
                        }
                        className="min-h-36"
                        autoFocus
                      />
                    ) : (
                      message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>
                        ) : null,
                      )
                    )}
                  </MessageContent>
                  {message.role === "assistant" && messageText(message) && (
                    <div className="flex gap-2">
                      <CopyButton text={messageText(message)} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId((current) => (current === message.id ? null : message.id))}
                      >
                        {editingId === message.id ? <Check /> : <FileText />}
                        {editingId === message.id ? "Done" : "Edit"}
                      </Button>
                    </div>
                  )}
                </Message>
              ))
            )}
            {(status === "submitted" || (status === "streaming" && !messageText(messages.at(-1) ?? { id: "", role: "assistant", parts: [] }))) && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking through your request…</Shimmer>
                </MessageContent>
              </Message>
            )}
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </p>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border bg-background p-3 md:p-4">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={(message) => send(message.text ?? "")}>
              <PromptInputTextarea
                ref={inputRef}
                placeholder="Ask for help with writing, planning, or ideas…"
                className="min-h-16"
              />
              <PromptInputFooter>
                <span className="px-1 text-xs text-muted-foreground">
                  Enter to send · Shift + Enter for a new line
                </span>
                <PromptInputSubmit
                  status={status}
                  disabled={status === "submitted" || status === "streaming"}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SettingsView({
  tone,
  setTone,
  concise,
  setConcise,
}: {
  tone: Tone;
  setTone: (tone: Tone) => void;
  concise: boolean;
  setConcise: (value: boolean) => void;
}) {
  const disclaimerItems = [
  return (
    <div className="max-w-3xl space-y-6">
      <PageIntro
        eyebrow="MAKE IT YOURS"
        title="Settings"
        copy="Set simple defaults for your current Workmate session."
      />
      <Panel className="divide-y divide-border">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-extrabold">Default email tone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Used when you open the email generator.
            </p>
          </div>
          <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Formal">Formal</SelectItem>
              <SelectItem value="Friendly">Friendly</SelectItem>
              <SelectItem value="Persuasive">Persuasive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-extrabold">Concise responses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prefer shorter summaries and assistant responses.
            </p>
          </div>
          <Switch checked={concise} onCheckedChange={setConcise} aria-label="Concise responses" />
        </div>
      </Panel>
      <Panel className="p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-extrabold">Privacy by design</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              This prototype runs entirely in your browser. Nothing is sent to a server, and your
              session resets when the page reloads.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function PageIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold text-primary">{eyebrow}</p>
      <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
        {copy}
      </p>
    </div>
  );
}
function ResultPanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex min-h-20 flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="min-h-[420px] p-5">{children}</div>
    </Panel>
  );
}
function EmptyResult({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="grid min-h-[380px] place-items-center text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <h3 className="mt-4 font-extrabold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="grid min-h-[380px] place-items-center text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-lg bg-secondary text-primary">
          <RefreshCw className="animate-spin" />
        </span>
        <Shimmer className="mt-4">{label}</Shimmer>
        <div className="mx-auto mt-5 space-y-2">
          <div className="h-2 w-52 rounded-full bg-muted" />
          <div className="h-2 w-40 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
