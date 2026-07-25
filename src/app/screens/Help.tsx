import React, { useMemo, useState } from 'react'

export function Help(): React.ReactNode {
  const sections = useMemo(() => getHelpSections(), [])
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s, i) => [s.id, i === 0]))
  )

  function toggleSection(id: string): void {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Skister is the easiest way to share ski equipment with trusted people — private communities, invites, modern skier tools and optional Premium.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              aria-expanded={Boolean(openIds[section.id])}
              aria-controls={`help-${section.id}`}
            >
              <span className="font-semibold">{section.title}</span>
              <span className="text-muted-foreground" aria-hidden="true">
                {openIds[section.id] ? '−' : '+'}
              </span>
            </button>
            {openIds[section.id] ? (
              <div id={`help-${section.id}`} className="px-4 pb-4 text-sm text-muted-foreground">
                <ul className="list-disc space-y-2 pl-5">
                  {section.items.map((item) => (
                    <li key={item.title}>
                      <span className="text-foreground/90">{item.title}</span>
                      {item.description ? <div className="mt-1">{item.description}</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-2">
        <a
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold"
          href="/help.html"
          target="_blank"
          rel="noreferrer"
        >
          Website Help
        </a>
        <a
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold"
          href="/terms.html"
          target="_blank"
          rel="noreferrer"
        >
          Terms
        </a>
        <a
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold"
          href="/privacy.html"
          target="_blank"
          rel="noreferrer"
        >
          Privacy
        </a>
      </section>
    </main>
  )
}

function getHelpSections(): HelpSection[] {
  return [
    {
      id: 'ski-network',
      title: 'Ski Network',
      items: [
        {
          title: 'What is a Ski Network?',
          description: 'Your private circle around where you ski — friends, family, ski clubs and local groups. A ski resort is a real-world place; your Ski Network in Skister is the private sharing layer in the app — not the resort itself. Within it you can also share camping, hiking and other outdoor equipment.'
        },
        {
          title: 'Choosing your Ski Network',
          description: 'Pick a hub based on your preferred ski resort, ski club, or local group in Profile or onboarding.'
        }
      ]
    },
    {
      id: 'getting-started',
      title: 'Getting started',
      items: [
        { title: 'How to add gear', description: 'Open My Gear, tap Add, choose an activity (skiing first), then the matching equipment category — skis, boots, helmets, camping, hiking and more. Include photos, brand/model, condition and optional purchase year or replacement value.' },
        { title: 'How to invite people', description: 'Use Invite Friends from Home Quick Access or Network to add friends, family, ski clubs or local groups you trust.' },
        { title: 'Home screen', description: 'Four primary cards — Borrow Gear, Share My Gear, Return Equipment and Scan QR — plus Quick Access for Find Ski Gear, My Reservations, My Gear and Invite Friends.' },
      ]
    },
    {
      id: 'borrowing-gear',
      title: 'Borrowing ski gear',
      items: [
        { title: 'How requests work', description: 'From Home, tap Borrow Gear (or Find Ski Gear) to request an item from someone in your private network and agree on pickup — not from strangers or a public listing.' },
        { title: 'Pickup & return flow', description: 'Confirm handoff (QR if enabled) and confirm condition on return. Use Return Equipment or My Reservations on Home for reminders.' },
      ]
    },
    {
      id: 'qr-handoff',
      title: 'QR handoff',
      items: [
        { title: 'Scan process', description: 'From Home, tap Scan QR — or open Scan on a rental — to confirm who received the gear.' },
        { title: 'What if scan fails', description: 'Do a manual confirmation and take a condition photo.' },
      ]
    },
    {
      id: 'condition-damage',
      title: 'Condition & damage',
      items: [
        { title: 'Why photos matter', description: 'Photos reduce misunderstandings and help resolve disputes.' },
        { title: 'How disputes are avoided', description: 'Confirm condition at pickup and return; communicate early.' }
      ]
    },
    {
      id: 'ratings-trust',
      title: 'Ratings & trust',
      items: [
        { title: 'How ratings work', description: 'After a rental, leave honest feedback.' },
        { title: 'Trust score explanation', description: 'A higher trust score reflects consistent positive behavior.' }
      ]
    },
    {
      id: 'common-issues',
      title: 'Common issues',
      items: [
        { title: 'QR not scanning', description: 'Use the manual code option and try again.' },
        { title: 'No gear visible', description: 'Check your network connections and access permissions.' },
        { title: 'App not updating', description: 'Restart the app (and try again after a stable connection).' }
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      items: [
        {
          title: 'What tools are available?',
          description:
            'Winter tools (DIN calculator, ski length finder, boot size converter), planning (trip planner, packing checklist), outdoor tools (snow conditions, gear maintenance) and more — adventure support beyond winter.',
        },
      ],
    },
    {
      id: 'subscription',
      title: 'Pricing & Premium',
      items: [
        {
          title: 'Is sharing free?',
          description:
            'Yes. Core sharing is free with no limits. Premium adds automation, maintenance logging, analytics and network insights — sharing is never behind a paywall.',
        },
        {
          title: 'What Premium includes',
          description:
            'Automatic pickup/return reminders, handover checklist, maintenance log, seasonal care, usage analytics and network gap alerts. Plans are shown in-app and on the website Pricing section.',
        },
      ],
    }
  ]
}

interface HelpSectionItem {
  title: string
  description?: string
}

interface HelpSection {
  id: string
  title: string
  items: HelpSectionItem[]
}

