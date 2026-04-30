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
        <p className="mt-1 text-sm text-muted-foreground">Quick answers for common questions.</p>
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
      id: 'getting-started',
      title: 'Getting started',
      items: [
        { title: 'How to add gear', description: 'Open Inventory, tap Add, and include photos + condition.' },
        { title: 'How to invite people', description: 'Use the invite flow to add friends/family to your network.' }
      ]
    },
    {
      id: 'borrowing-gear',
      title: 'Borrowing gear',
      items: [
        { title: 'How requests work', description: 'Request an item from someone in your network and agree on pickup.' },
        { title: 'Pickup & return flow', description: 'Confirm handoff (QR if enabled) and confirm condition on return.' }
      ]
    },
    {
      id: 'qr-handoff',
      title: 'QR handoff',
      items: [
        { title: 'Scan process', description: 'Scan the owner’s code to confirm who received the gear.' },
        { title: 'What if scan fails', description: 'Do a manual confirmation and take a condition photo.' }
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
      id: 'subscription',
      title: 'Subscription (if enabled)',
      items: [{ title: 'What premium includes', description: 'Premium features are shown in-app when available.' }]
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

