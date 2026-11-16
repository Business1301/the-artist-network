// How It Works — shows both the client and artist sides per PROJECT_PLAN.md §5.6

const clientSteps = [
  {
    number: "01",
    icon: "🔍",
    title: "Discover Artists",
    description: "Browse by category, location or event type. Explore portfolios and find the creative professional that fits your vision.",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 border-purple-100",
    textColor: "text-purple-700",
  },
  {
    number: "02",
    icon: "💬",
    title: "Explore Portfolios",
    description: "View each artist's work, specialities and experience. Get a clear picture of their style before reaching out.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50 border-pink-100",
    textColor: "text-pink-700",
  },
  {
    number: "03",
    icon: "🤝",
    title: "Connect & Plan",
    description: "Review portfolio samples, technical rider terms, and connect with creative talent or plan upcoming events.",
    color: "from-orange-400 to-amber-500",
    bg: "bg-orange-50 border-orange-100",
    textColor: "text-orange-700",
  },
];

const artistSteps = [
  {
    number: "01",
    icon: "✏️",
    title: "Create a Profile",
    description: "Build your professional presence. Add your bio, specialities, location and the services you offer.",
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50 border-teal-100",
    textColor: "text-teal-700",
  },
  {
    number: "02",
    icon: "🖼️",
    title: "Showcase Your Talent",
    description: "Upload portfolio images, add links to your videos or performances, and let your work speak for itself.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-100",
    textColor: "text-blue-700",
  },
  {
    number: "03",
    icon: "📅",
    title: "Manage Schedule & Grow",
    description: "Maintain your private performance calendar, block unavailable dates, connect your social profiles, and prepare for client opportunities.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 border-violet-100",
    textColor: "text-violet-700",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof clientSteps)[0];
  index: number;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl shadow-lg`}
          aria-hidden="true"
        >
          {step.icon}
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-xs font-extrabold text-gray-500 shadow-sm">
          {index + 1}
        </div>
      </div>
      <div className={`w-full p-6 rounded-2xl border ${step.bg} flex-1`}>
        <h3 className={`text-lg font-bold mb-2 ${step.textColor}`}>{step.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Whether you&apos;re hiring creative talent or showcasing your own — getting started is straightforward.
          </p>
        </div>

        {/* Two-column layout: For Clients | For Artists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* For Clients */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-md" aria-hidden="true">
                🏢
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">For businesses &amp; event organizers</p>
                <h3 className="text-xl font-extrabold text-gray-900">Hiring an Artist</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {clientSteps.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>

          {/* Divider (mobile) */}
          <div className="lg:hidden border-t border-dashed border-gray-200" />

          {/* For Artists */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-lg shadow-md" aria-hidden="true">
                🎨
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">For artists &amp; creatives</p>
                <h3 className="text-xl font-extrabold text-gray-900">Growing Your Career</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {artistSteps.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
