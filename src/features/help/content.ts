import type { Permission } from "@/types/auth";

export const HELP_CATEGORIES = [
  "Getting started",
  "Feature guides",
  "Use cases",
  "Edge cases",
  "Troubleshooting",
  "FAQs",
  "Support",
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  summary: string;
  keywords: string[];
  paragraphs?: string[];
  steps?: string[];
  bullets?: string[];
  note?: string;
  href?: string;
  permission?: Permission;
}

/**
 * Product help content. Written against the actual SmartOS workflows and
 * business rules, including the immutable stock ledger, order state machine,
 * plan limits and role matrix. Keep examples free of customer data.
 */
export const HELP_ARTICLES: HelpArticle[] = [
  // ---------------------------------------------------------------- Getting started
  {
    id: "first-hour",
    title: "Set up SmartOS in your first hour",
    category: "Getting started",
    summary: "Create the workspace, invite the core team, add a first title and check the onboarding checklist.",
    keywords: ["setup", "onboarding", "first", "workspace", "start", "checklist", "branding"],
    steps: [
      "Register the organisation and confirm the admin account. The person who registers becomes the first ORG_ADMIN.",
      "Open Settings and set the organisation name, logo and brand colours. These appear across the workspace and on the sign-in screens.",
      "Invite the people who actually need access. Give each person the narrowest role that lets them do their job.",
      "Add one real book and one real contributor. This makes the editorial, production and royalty screens meaningful during training.",
      "Work through the onboarding checklist on the dashboard. Each user gets their own checklist, so progress is not shared.",
    ],
    note: "Plan limits apply immediately: FREE allows 5 users and 100 books, GROWTH allows 50 and 2,000, and SCALE is unlimited.",
    href: "/settings",
  },
  {
    id: "roles-explained",
    title: "Roles and what each person can do",
    category: "Getting started",
    summary: "The role matrix drives navigation, API access and every destructive action.",
    keywords: ["roles", "permissions", "access", "admin", "editor", "designer", "warehouse", "sales", "finance", "author", "viewer"],
    paragraphs: [
      "SmartOS never decides access in the browser alone. The server sends the caller's effective permissions and the same permissions guard every API endpoint and navigation entry.",
    ],
    bullets: [
      "ORG_ADMIN: everything inside the organisation except changing the plan. Manages users, invites, branding, audit and settings.",
      "EDITOR: books, manuscripts, contributors and tasks, including deletion. No customers, orders or money.",
      "AUTHOR: can add and update books, manuscripts and contributors, and read tasks. Cannot delete other people's work or manage users.",
      "DESIGNER: read-only across books, manuscripts, contributors, tasks and production. No edits.",
      "PRODUCTION: print jobs, warehouses and inventory. No editorial or sales access.",
      "WAREHOUSE: stock movements, transfers and warehouse maintenance, plus read-only production and tasks.",
      "SALES: customers, orders, and read-only stock and warehouses. Cannot post finance entries.",
      "FINANCE: ledger, budgets, royalties and sales reports, plus read-only orders.",
      "VIEWER: read-only across the publishing pipeline. Cannot see sales, money, users or audit.",
      "PLATFORM_ADMIN: platform-wide authority, including plan changes. It cannot be granted by an organisation invite.",
    ],
    note: "If a page or button is missing, the role usually explains why. Ask an ORG_ADMIN to confirm your role before treating it as a bug.",
    href: "/users",
    permission: "users.read",
  },
  {
    id: "invite-team",
    title: "Invite and onboard your team",
    category: "Getting started",
    summary: "Invitations are single-use, expire, and require the invitee to accept the current legal documents.",
    keywords: ["invite", "invitation", "team", "users", "onboarding", "expired", "accept", "role"],
    steps: [
      "Open Users and choose Invite user (or the invitation action on mobile).",
      "Enter the work email and select a role. INVITES are valid for 7 days by default; you can choose 1 to 30 days.",
      "Copy the invitation link and send it through your normal channel. The plaintext token is shown only once.",
      "The invitee opens the link, enters their name and a password of at least 8 characters, and accepts the Terms of Service and Privacy Policy.",
      "After acceptance they are signed in, placed in the invited organisation with the chosen role, and given their own onboarding checklist.",
    ],
    bullets: [
      "An invitation is single-use. Accepting it marks it used and it cannot be replayed.",
      "Revoke a pending invitation from Users if it was sent to the wrong address or role.",
      "An email may already have an account in another organisation. Joining a new organisation creates a separate membership for that workspace.",
      "An ORG_ADMIN cannot invite a PLATFORM_ADMIN. That role is platform-level only.",
    ],
    note: "If the organisation is at its plan's user limit, the invitation cannot be accepted until a user is removed or the plan changes.",
    href: "/users",
    permission: "users.read",
  },
  {
    id: "plans-limits",
    title: "Plans, user limits and book limits",
    category: "Getting started",
    summary: "Know what each plan allows before inviting a large team or importing a catalogue.",
    keywords: ["plan", "billing", "limit", "quota", "free", "growth", "scale", "users", "books", "upgrade"],
    bullets: [
      "FREE: up to 5 active users and 100 books.",
      "GROWTH: up to 50 active users and 2,000 books.",
      "SCALE: unlimited users and books, within fair-use infrastructure limits.",
      "Only a PLATFORM_ADMIN can change an organisation's plan.",
      "User limits count memberships in the organisation, not pending invitations.",
      "Book limits count catalogue records, including archived titles. Archive a title rather than deleting it if you need the history.",
    ],
    note: "Hitting a limit returns a PLAN_LIMIT error. The action is blocked; the data already saved is not affected.",
    href: "/settings",
    permission: "org.plan.write",
  },
  {
    id: "navigation-mobile",
    title: "Find your way on desktop and phone",
    category: "Getting started",
    summary: "The desktop sidebar and mobile dock expose the same destinations; the floating action owns the page's main task.",
    keywords: ["navigation", "mobile", "sidebar", "dock", "fab", "menu", "more", "account", "help", "legal"],
    paragraphs: [
      "On desktop, the left sidebar groups destinations into Content, Operations, Commerce and More. Sections collapse to keep the rail compact, and the account menu sits at the bottom.",
      "On phones, the bottom dock carries four primary destinations plus More. The top bar holds search and the account sheet. Page-level actions move into a floating action button above the dock so the main task stays reachable with one hand.",
    ],
    bullets: [
      "Account menu: Profile, Settings, Help and Legal, plus account switching and logout.",
      "More sheet: Reports, Users, Audit log, Profile and Settings, filtered by your permissions.",
      "The floating action opens the same create/edit modal as the desktop page header.",
      "Keyboard users can close menus and sheets with Escape; focus stays visible throughout.",
    ],
    href: "/help",
  },

  // ---------------------------------------------------------------- Feature guides
  {
    id: "catalogue",
    title: "Books: build and maintain the catalogue",
    category: "Feature guides",
    summary: "Create titles, track their publishing status and find them by title or ISBN.",
    keywords: ["books", "catalogue", "title", "isbn", "status", "draft", "published", "archive", "delete"],
    steps: [
      "Open Books and choose New book (or the floating action on mobile).",
      "Enter the title. ISBN is optional but recommended; search matches both title and ISBN.",
      "Set the status: DRAFT, IN_EDIT, DESIGNED, PRINTING, PUBLISHED or ARCHIVED.",
      "Save. Status is a workflow label, not an automatic gate: changing it does not create production, stock or sales records.",
    ],
    bullets: [
      "Use ARCHIVED for titles you no longer actively sell. Archived titles remain in history and count toward the plan limit.",
      "Deleting a book requires books.delete and is blocked once the book has inventory history. Archive instead when in doubt.",
      "Production, inventory, orders and royalties all reference the book, so keep titles stable once those records exist.",
    ],
    note: "The catalogue does not store cover files or full bibliographic metadata yet. Use the title and ISBN fields consistently with your external catalogue.",
    href: "/books",
    permission: "books.read",
  },
  {
    id: "editorial",
    title: "Manuscripts: move a title through editorial",
    category: "Feature guides",
    summary: "Track submissions, review, editing, proofs and approval without losing the current stage.",
    keywords: ["manuscripts", "editorial", "submitted", "review", "editing", "proof", "approved", "due date", "file"],
    steps: [
      "Open Manuscripts and submit a manuscript with its title, optional file URL and due date.",
      "Move it forward through SUBMITTED, REVIEW, EDITING, PROOF and APPROVED as work progresses.",
      "Use tasks for individual editorial actions and deadlines; the manuscript status records the stage, not the task list.",
    ],
    bullets: [
      "The file URL links to an external draft; SmartOS does not version or OCR the file.",
      "Keep a manuscript in REVIEW while feedback is open, and move it to EDITING only when changes are being made.",
      "APPROVED means the editorial stage is complete. It does not publish the book or start a print run.",
      "Anyone with manuscripts.write can change the stage. Deletion requires manuscripts.delete.",
    ],
    href: "/manuscripts",
    permission: "manuscripts.read",
  },
  {
    id: "tasks",
    title: "Tasks: plan work across the team",
    category: "Feature guides",
    summary: "Capture work with a priority and due date, then move it through the board.",
    keywords: ["tasks", "todo", "in progress", "review", "done", "priority", "due date", "board"],
    steps: [
      "Create a task with a title, optional description, priority (LOW, MEDIUM, HIGH) and due date.",
      "Move it from TODO to IN_PROGRESS, then REVIEW, then DONE as the work actually moves.",
      "Use REVIEW for work waiting on another person's check, not for work you have not started.",
    ],
    bullets: [
      "Tasks are organisation-wide. The current form captures priority and due date; it does not yet let you choose an assignee, even though the task record supports one.",
      "The board is a workflow view, not a timesheet. It does not calculate effort or cost.",
      "Deleting a task removes it from the board but does not delete the book, manuscript or contributor it refers to.",
    ],
    href: "/tasks",
    permission: "tasks.read",
  },
  {
    id: "contributors",
    title: "Contributors: keep authors and rights holders findable",
    category: "Feature guides",
    summary: "Record authors, editors, illustrators, translators and other contributors once, then reuse them in contracts.",
    keywords: ["contributors", "author", "editor", "illustrator", "translator", "contract", "email", "bio"],
    paragraphs: [
      "Contributors are the people behind a title. SmartOS supports AUTHOR, EDITOR, ILLUSTRATOR, TRANSLATOR and OTHER. A contributor can be linked to royalty contracts, so keep names and email addresses accurate.",
      "The bio field is free text and should not contain sensitive personal data. Store only what you need to run the publishing relationship.",
    ],
    bullets: [
      "Email is optional; without it you cannot contact the contributor from SmartOS. A contributor is separate from a SmartOS user account.",
      "Deleting a contributor requires contributors.delete and is blocked when a royalty contract references them.",
      "A contributor is not automatically a SmartOS user. Invite them separately if they need to sign in.",
    ],
    href: "/contributors",
    permission: "contributors.read",
  },
  {
    id: "production",
    title: "Production: plan a job, print in runs, post to stock",
    category: "Feature guides",
    summary: "A print job moves PLANNED to IN_PROGRESS to COMPLETED; each run must be posted before the job can complete.",
    keywords: ["production", "print", "job", "run", "printer", "quantity", "post", "stock", "complete", "cancel"],
    steps: [
      "Create a print job for a book with a quantity, optional manuscript, printer and due date.",
      "Start the job when printing begins. Runs cannot be posted until the job is IN_PROGRESS.",
      "Add one or more print runs with the quantity produced in each batch.",
      "Post each run into a warehouse. Posting writes an IN stock movement and is immutable.",
      "Complete the job only after every run is posted. A job with unposted runs cannot be completed.",
    ],
    bullets: [
      "Unposted runs can be deleted. Posted runs cannot be deleted or edited; correct them with an inventory adjustment.",
      "The job quantity is the plan. The sum of runs is what was actually produced and posted.",
      "Cancelling a job is possible only while it has no posted stock. Cancel and delete are blocked once stock exists.",
      "Posting into the wrong warehouse cannot be undone by deleting the run; record an OUT movement from the wrong warehouse and an IN movement into the right one, with a reason.",
    ],
    note: "A posted run is an accounting event. Treat the post action as final and train the team to confirm the warehouse before clicking it.",
    href: "/production",
    permission: "production.read",
  },
  {
    id: "inventory",
    title: "Inventory: stock levels, movements and transfers",
    category: "Feature guides",
    summary: "Stock is derived from an append-only movement ledger; transfers move copies between warehouses atomically.",
    keywords: ["inventory", "warehouse", "stock", "movement", "in", "out", "adjustment", "transfer", "negative", "ledger"],
    steps: [
      "Create at least one warehouse before recording stock.",
      "Record a receipt as IN, a dispatch as OUT, or a correction as ADJUSTMENT. The quantity is signed: IN positive, OUT negative.",
      "Use Transfer stock to move copies between two warehouses. Both the OUT and IN sides are written together.",
      "Filter the movement history by book or warehouse when reconciling.",
    ],
    bullets: [
      "Stock cannot go negative through normal movements. An ORG_ADMIN may use ADJUSTMENT to correct an exceptional discrepancy.",
      "A warehouse with any movement history cannot be deleted. Rename it or leave it inactive instead.",
      "The movement ledger is the source of truth. The stock table is a derived view, not something you edit directly.",
      "Every movement should have a reason so the audit trail explains why the number changed.",
    ],
    href: "/inventory",
    permission: "inventory.read",
  },
  {
    id: "orders",
    title: "Orders: draft, confirm, fulfil or cancel",
    category: "Feature guides",
    summary: "Orders need at least one item to confirm; fulfilment deducts stock and posts a SALES transaction in one go.",
    keywords: ["orders", "sales", "draft", "confirmed", "fulfilled", "cancelled", "customer", "items", "stock", "warehouse"],
    steps: [
      "Create a draft order for a customer with one or more book lines, quantities and unit prices.",
      "Confirm the order when the customer has committed. A draft with no items cannot be confirmed.",
      "Fulfil from a warehouse. Fulfilment deducts stock for every line and posts a SALES transaction atomically.",
      "Cancel an order only while it is DRAFT or CONFIRMED. Fulfilled orders must be handled with a refund, not a cancellation.",
    ],
    bullets: [
      "Order totals are calculated from the line quantities and unit prices at the time of the order.",
      "Fulfilment fails if any line lacks enough stock in the selected warehouse; nothing is partially deducted.",
      "A fulfilled order cannot be cancelled. Record a REFUND in Finance and reference the fulfilled order.",
      "Deleting a customer does not erase their order history; the order remains for reconciliation.",
    ],
    href: "/orders",
    permission: "orders.read",
  },
  {
    id: "customers",
    title: "Customers: individuals, schools, bookshops and distributors",
    category: "Feature guides",
    summary: "Keep customer contact details and credit limits in one place for the order desk.",
    keywords: ["customers", "customer", "individual", "school", "bookshop", "distributor", "credit limit", "contact"],
    paragraphs: [
      "Customers are the organisations or people who place orders. SmartOS supports INDIVIDUAL, SCHOOL, BOOKSHOP and DISTRIBUTOR types.",
      "The credit limit is a reference field for your team. SmartOS does not currently block an order automatically when the limit is exceeded, so the order desk must review it.",
    ],
    bullets: [
      "Email and phone are optional; add at least one contact route for real customers.",
      "Deleting a customer requires customers.write and is blocked once the customer has orders. Keep the record instead.",
      "Customer records can contain personal data. Apply your organisation's retention and access rules.",
    ],
    href: "/customers",
    permission: "customers.read",
  },
  {
    id: "finance",
    title: "Finance: expenses, refunds and budgets",
    category: "Feature guides",
    summary: "Manual entries are limited to EXPENSE and REFUND; sales and royalty payouts are posted by the system.",
    keywords: ["finance", "ledger", "expense", "refund", "budget", "category", "transaction", "sales", "royalty", "payout"],
    steps: [
      "Record an EXPENSE with an amount in GHS, an optional category and a description.",
      "Record a REFUND only against a fulfilled order. Choose the order from the list; a free-text reference is not accepted.",
      "Create a budget with a planned amount and period. The category matches expense categories so spend can be compared.",
    ],
    bullets: [
      "Sales transactions are created automatically when an order is fulfilled.",
      "Royalty payouts are created automatically when an approved statement is marked paid.",
      "Manual SALE and ROYALTY_PAYOUT entries are not allowed: they would duplicate system postings.",
      "Budgets are planning tools, not hard spending limits. Overspend is shown but not blocked.",
      "Amounts are handled in GHS throughout the interface.",
    ],
    href: "/finance",
    permission: "finance.read",
  },
  {
    id: "royalties",
    title: "Royalties: contracts, statements and payouts",
    category: "Feature guides",
    summary: "A statement is generated from fulfilled sales minus refunds, then approved and paid in order.",
    keywords: ["royalties", "contract", "rate", "statement", "draft", "approved", "paid", "period", "payout", "author"],
    steps: [
      "Create a royalty contract for a contributor, optionally limited to one book, with a rate between 0 and 1 (0.10 = 10%) and a start date.",
      "Keep the contract ACTIVE while it applies. Only active contracts can generate statements.",
      "Generate a statement for a period. Net equals fulfilled sales minus refunds in that period; payable equals net times the rate.",
      "Review the DRAFT statement, then approve it. Approval snapshots the calculation.",
      "Mark an approved statement PAID when the payment has actually been made. This posts the royalty payout transaction.",
    ],
    bullets: [
      "A contract with no book applies to all of that contributor's books.",
      "Statements cannot skip states: DRAFT to APPROVED to PAID.",
      "A terminated contract stops generating new statements but keeps its history.",
      "The statement is a record of a calculation, not proof of payment. Reconcile it with the ledger and your bank.",
    ],
    href: "/royalties",
    permission: "royalties.read",
  },
  {
    id: "reports-audit",
    title: "Reports, audit log and legal acceptance evidence",
    category: "Feature guides",
    summary: "Use reports for sales and editorial summaries, the audit log for mutations, and acceptance records for consent evidence.",
    keywords: ["reports", "audit", "log", "legal", "acceptance", "consent", "compliance", "versions", "evidence", "export"],
    paragraphs: [
      "Reports summarise sales and editorial activity from the live data. They are read-only and never change records.",
      "The audit log records mutations with the actor, action and record. Entries are append-only. Only users with audit.read can open it.",
      "Legal acceptances are stored separately from the audit log. Each row records the user, organisation, document code, version, content hash, context, IP address, user agent and timestamp.",
    ],
    bullets: [
      "A legal acceptance is created during registration or invitation acceptance, after the backend validates the exact current versions.",
      "If a document is republished, users must accept the new version before completing a gated flow. Old acceptance rows remain for history.",
      "Administrators with audit.read can review organisation-wide acceptance evidence on the Audit log page. Contact support for a formal export.",
    ],
    href: "/audit",
    permission: "audit.read",
  },

  // ---------------------------------------------------------------- Use cases
  {
    id: "use-new-title",
    title: "Use case: launch a new title end to end",
    category: "Use cases",
    summary: "A safe order of operations from catalogue record to first sale.",
    keywords: ["use case", "new title", "launch", "workflow", "end to end", "publish", "first sale"],
    steps: [
      "Create the book in DRAFT and add its ISBN.",
      "Add the author and any editor or illustrator as contributors.",
      "Submit the manuscript and move it through editorial to APPROVED.",
      "Create a royalty contract for the author, scoped to that book.",
      "Create a print job, start it, add runs, then post each run into the warehouse that physically received the copies.",
      "Move the book status to PUBLISHED, create a customer and a draft order, confirm it, then fulfil it from that warehouse.",
      "Generate a royalty statement after the period closes; review, approve and mark it paid after payment.",
    ],
    note: "Do not mark a print run posted before the physical copies are counted into the warehouse. Posted stock is intentionally hard to reverse.",
  },
  {
    id: "use-reprint",
    title: "Use case: reprint a title that is running low",
    category: "Use cases",
    summary: "Check stock, plan the reprint, then post the new copies without overwriting history.",
    keywords: ["use case", "reprint", "low stock", "reorder", "production", "warehouse", "stock"],
    steps: [
      "Filter Inventory by the book and confirm the available quantity per warehouse.",
      "Create a new print job for the reprint. Do not reopen or edit the completed original job.",
      "Start the job when printing begins, add runs as batches arrive, and post each run into the receiving warehouse.",
      "Complete the job after the last run is posted.",
      "Confirm the stock level increased by the run total and spot-check the movement ledger.",
    ],
  },
  {
    id: "use-direct-sales",
    title: "Use case: sell direct and reconcile the cash",
    category: "Use cases",
    summary: "From customer and order to stock deduction and a sales transaction.",
    keywords: ["use case", "direct sales", "cash", "reconcile", "order", "fulfil", "sales", "refund"],
    steps: [
      "Create or update the customer with a contact route and credit limit.",
      "Create a draft order with each book, quantity and agreed unit price.",
      "Confirm the order when the customer commits.",
      "Fulfil from the warehouse that will actually ship the copies.",
      "Check Finance for the automatically posted SALES transaction, and Inventory for the stock deduction.",
      "If the customer returns copies, record a REFUND against the fulfilled order and decide separately whether stock should be adjusted.",
    ],
  },
  {
    id: "use-royalty-run",
    title: "Use case: run a royalty cycle",
    category: "Use cases",
    summary: "Close a period, generate statements, approve them and record payment.",
    keywords: ["use case", "royalty run", "period", "statements", "approve", "pay", "author", "reconcile"],
    steps: [
      "Confirm all orders for the period are fulfilled or cancelled, and refunds are recorded.",
      "Confirm each contributor's contract is ACTIVE and the rate is correct.",
      "Generate a statement per contract for the period and review the net and payable figures.",
      "Approve the statements that are correct. Approval snapshots the calculation.",
      "Pay the contributors, then mark each statement PAID so the payout posts to the ledger.",
      "Archive the statements with your payment evidence for the next audit.",
    ],
    note: "If a contract was wrong during the period, correct the contract before generating. Re-generating a DRAFT statement is safer than editing an approved one.",
  },

  // ---------------------------------------------------------------- Edge cases
  {
    id: "edge-posted-wrong-warehouse",
    title: "A print run was posted to the wrong warehouse",
    category: "Edge cases",
    summary: "Posted runs cannot be deleted or edited. Correct the stock with two reasoned movements.",
    keywords: ["edge case", "posted", "wrong warehouse", "mistake", "reverse", "adjustment", "transfer", "immutable"],
    paragraphs: [
      "Posting a run is permanent by design: it represents physical stock entering a warehouse and is part of the audit trail. The Post action cannot be undone by deleting the run.",
    ],
    steps: [
      "Record an OUT movement from the wrong warehouse for the posted quantity, with a clear reason such as Wrong warehouse correction.",
      "Record an IN movement into the correct warehouse for the same quantity, with the matching reason.",
      "If both warehouses are valid, a single transfer is preferable because it writes both sides atomically.",
      "Tell an administrator so the audit trail can be reviewed. Do not use a negative ADJUSTMENT unless the movement model genuinely does not fit.",
    ],
  },
  {
    id: "edge-negative-stock",
    title: "Stock would go negative",
    category: "Edge cases",
    summary: "Normal movements and fulfilment are blocked when stock is insufficient; only an admin adjustment can override.",
    keywords: ["edge case", "negative stock", "insufficient", "fulfil", "out", "adjustment", "admin", "override"],
    paragraphs: [
      "SmartOS refuses an OUT movement, transfer or order fulfilment that would take a warehouse below zero. This protects the ledger from impossible physical states.",
      "An ORG_ADMIN can record an ADJUSTMENT to correct an exceptional discrepancy, including a negative delta. That ability is deliberately narrow: it should be rare, explained and reviewed.",
    ],
    bullets: [
      "Check whether the stock is in a different warehouse before adjusting.",
      "Check whether the receipt was posted to the wrong book or warehouse.",
      "A failed fulfilment is atomic: no line is deducted when any line is short.",
    ],
  },
  {
    id: "edge-cancel-order",
    title: "When can an order be cancelled?",
    category: "Edge cases",
    summary: "Only DRAFT and CONFIRMED orders can be cancelled. Fulfilled orders need a refund.",
    keywords: ["edge case", "cancel", "order", "fulfilled", "refund", "draft", "confirmed", "stock"],
    paragraphs: [
      "Cancellation stops an order before stock leaves the warehouse. Once an order is FULFILLED, stock has been deducted and a SALES transaction has been posted, so cancellation would silently rewrite history.",
      "For a fulfilled order, record a REFUND in Finance and reference the order. Decide separately whether returned copies should be received back into stock with an IN movement.",
    ],
  },
  {
    id: "edge-delete-warehouse",
    title: "Why can't I delete a warehouse?",
    category: "Edge cases",
    summary: "A warehouse with movement history is part of the stock ledger and cannot be removed.",
    keywords: ["edge case", "warehouse", "delete", "history", "movement", "inactive", "rename"],
    paragraphs: [
      "Deleting a warehouse would orphan its movements and break historical stock reconciliation. SmartOS therefore blocks deletion as soon as the warehouse has any movement history.",
      "Rename it to make its status clear (for example Closed - Lekki) and stop using it for new receipts. Create a new warehouse for future stock.",
    ],
  },
  {
    id: "edge-refund",
    title: "Why does a refund need a fulfilled order?",
    category: "Edge cases",
    summary: "Refunds must point at real revenue so the ledger cannot contain unexplained money.",
    keywords: ["edge case", "refund", "order", "fulfilled", "finance", "ledger", "sales"],
    paragraphs: [
      "A REFUND is money going back to a customer. Requiring a fulfilled order ties it to a sale and prevents a refund being used as a disguised expense or an arbitrary negative entry.",
      "If the original order was never fulfilled, there is no sale to refund. Record the payment as an EXPENSE with a clear description instead, or correct the order first if it was fulfilled incorrectly.",
    ],
  },
  {
    id: "edge-legal-version",
    title: "The legal version changed while I was signing up",
    category: "Edge cases",
    summary: "The backend rejects stale acceptances; re-open the documents, review the new version and accept again.",
    keywords: ["edge case", "legal", "version", "stale", "terms", "privacy", "acceptance", "registration", "invite", "LEGAL_ACCEPTANCE_REQUIRED"],
    paragraphs: [
      "Registration and invitation acceptance send the exact document versions that were displayed. If an administrator publishes a new version in between, the server refuses the request with LEGAL_ACCEPTANCE_REQUIRED and field errors for the affected document.",
      "This is intentional. Continuing would record consent to text the person never saw.",
    ],
    steps: [
      "Reload the page so the current versions are fetched.",
      "Open both documents from the consent block and review the changed version.",
      "Tick both boxes again and resubmit.",
    ],
    note: "If the documents cannot load, do not proceed. Retry, or contact support; the server will not accept the flow without current versions.",
  },
  {
    id: "edge-role-change",
    title: "What happens when a role or plan changes?",
    category: "Edge cases",
    summary: "Permissions are read live, so navigation and API access change on the next request; plan limits apply immediately.",
    keywords: ["edge case", "role change", "plan change", "permissions", "session", "refresh", "limit"],
    paragraphs: [
      "The server reads the user's live role on every session check. A change can remove navigation entries and make API calls fail even before the current access token expires.",
      "Plan changes take effect immediately for limits. If the organisation is already above a new lower limit, existing data remains but new users or books may be blocked until usage falls below the limit.",
    ],
    bullets: [
      "Refresh the page or sign in again if the interface still shows old permissions.",
      "A removed permission does not delete the user's past audit entries or legal acceptances.",
      "Only a PLATFORM_ADMIN can change the plan; an ORG_ADMIN can change roles.",
    ],
  },

  // ---------------------------------------------------------------- Troubleshooting
  {
    id: "trouble-sign-in",
    title: "I can't sign in",
    category: "Troubleshooting",
    summary: "Check the account scope, second factor and rate limits before resetting the password.",
    keywords: ["troubleshooting", "login", "sign in", "password", "2fa", "passkey", "locked", "rate limit", "email"],
    steps: [
      "Confirm the email and password. Passwords are case-sensitive.",
      "If the same email belongs to several organisations, sign in with the organisation explicitly or use the account switcher.",
      "If two-factor authentication is enabled, enter the current six-digit code or an unused backup code.",
      "If a passkey is registered, use the passkey option or sign in with your password and then manage passkeys in Settings.",
      "Too many failed attempts trigger a temporary rate limit. Wait for the window to pass before trying again.",
    ],
    bullets: [
      "A password reset invalidates existing sessions and refresh tokens.",
      "If the account is inactive, an administrator must reactivate it; a password reset will not help.",
      "Never share a password reset link or a backup code.",
    ],
    note: "If you still cannot sign in, ask an ORG_ADMIN to confirm your account is active and your role has not changed.",
  },
  {
    id: "trouble-missing-page",
    title: "A page or button is missing",
    category: "Troubleshooting",
    summary: "Navigation is permission-driven; the API is the final authority.",
    keywords: ["troubleshooting", "missing", "page", "button", "permission", "navigation", "role", "forbidden"],
    paragraphs: [
      "SmartOS hides destinations your role cannot use. A missing Users page, Finance section or Delete button is usually a permission decision, not a rendering bug.",
      "If a direct link returns 403, the backend has confirmed that your role lacks the required permission.",
    ],
    steps: [
      "Open your profile or account menu and check your role.",
      "Compare it with the role matrix in this Help centre.",
      "Ask an ORG_ADMIN to adjust your role if the task is part of your job.",
      "Refresh after a role change so the navigation reloads.",
    ],
  },
  {
    id: "trouble-stale-data",
    title: "A list or total looks out of date",
    category: "Troubleshooting",
    summary: "Refresh the list, check filters and remember that stock is derived from posted movements.",
    keywords: ["troubleshooting", "stale", "refresh", "filter", "stock", "total", "cache", "movement"],
    steps: [
      "Check active filters and the page number; a status filter can hide the record you expect.",
      "Refresh the page to fetch fresh data from the server.",
      "For stock, check the movement ledger rather than assuming the level is wrong. A level changes only when a movement is posted.",
      "For orders, confirm whether the order is DRAFT, CONFIRMED or FULFILLED; totals and available actions differ by state.",
    ],
    bullets: [
      "Browser back can show a cached view. Refresh after another user changes shared data.",
      "If a number still looks wrong, note the book, warehouse, movement ID and timestamp before contacting support.",
    ],
  },
  {
    id: "trouble-uploads",
    title: "Logo or avatar upload fails",
    category: "Troubleshooting",
    summary: "Check the file type and size, then whether image hosting is configured.",
    keywords: ["troubleshooting", "upload", "logo", "avatar", "image", "size", "cloudinary", "501", "file"],
    bullets: [
      "Use a PNG, JPEG or WebP image. The browser prepares avatars at display size before upload.",
      "Keep the original file small; the server accepts uploads up to 5MB after preparation.",
      "A 501 response means hosted image storage is not configured for this deployment. Use an image URL or ask the administrator.",
      "If the upload succeeds but the old image remains, refresh the page; the profile or organisation cache may still hold the previous URL.",
    ],
    href: "/settings",
    permission: "org.settings.write",
  },
  {
    id: "trouble-invite",
    title: "An invitation link is invalid or expired",
    category: "Troubleshooting",
    summary: "Invitations are single-use and time-limited; issue a fresh one instead of reusing an old link.",
    keywords: ["troubleshooting", "invite", "invalid", "expired", "single use", "token", "accept"],
    paragraphs: [
      "An invitation token becomes invalid when it expires, is revoked, or has already been accepted. The error deliberately does not reveal which of those happened.",
    ],
    steps: [
      "Ask an ORG_ADMIN to check Users for a pending invitation.",
      "Revoke the old invitation if it is still listed.",
      "Create a new invitation for the same email and role, then send the new link.",
      "Remember that the invitee must also accept the current Terms and Privacy Policy.",
    ],
    href: "/users",
    permission: "users.read",
  },
  {
    id: "trouble-support-request",
    title: "What to include in a support request",
    category: "Troubleshooting",
    summary: "Good context shortens resolution: workspace, record, time and exact error.",
    keywords: ["troubleshooting", "support", "request", "error", "screenshot", "workspace", "record", "reproduce"],
    bullets: [
      "Your organisation name and the email address of the affected user.",
      "The page and record involved, including a book title, order number, statement period or warehouse name.",
      "The exact time, including your timezone, and whether other users saw the same thing.",
      "The steps that led to the problem and what you expected instead.",
      "The full error message or error code, plus a screenshot if it is visual.",
      "Any action you already tried, such as refreshing, signing out or retrying the operation.",
    ],
    note: "Do not send passwords, passkey data, invitation tokens or full customer personal data in a support message.",
    href: "/help",
  },

  // ---------------------------------------------------------------- FAQs
  {
    id: "faq-export",
    title: "Can I export my data?",
    category: "FAQs",
    summary: "Not yet as a self-service bulk export. Request an organisation export from support.",
    keywords: ["faq", "export", "data", "backup", "csv", "download", "portability"],
    paragraphs: [
      "SmartOS does not currently offer a one-click workspace export. Lists can be read on screen and reports can be printed, but a structured bulk export must be requested from support.",
      "During termination, the organisation administrator can request an export within the agreed post-termination window. The export covers Customer Data, subject to legal retention and security checks.",
    ],
    note: "If portability is a procurement requirement, confirm the current export process and format before signing a long-term contract.",
  },
  {
    id: "faq-delete-org",
    title: "How do I delete my organisation?",
    category: "FAQs",
    summary: "Deletion is a controlled support action because it affects every user and record in the workspace.",
    keywords: ["faq", "delete", "organisation", "workspace", "terminate", "close", "data"],
    paragraphs: [
      "An organisation administrator cannot delete the workspace from the interface. This prevents an accidental click from destroying the catalogue, stock ledger, financial history and audit trail.",
      "Contact support from the administrator's email address. We will verify authority, explain the export and retention steps, and schedule deletion.",
      "Deletion removes active data after the export/retention window. Backup copies expire on their normal rotation, and records required by law may be retained longer.",
    ],
    href: "/help",
  },
  {
    id: "faq-multi-org",
    title: "Can one email belong to several organisations?",
    category: "FAQs",
    summary: "Yes. Memberships are per organisation, and sign-in resolves the right account by password or organisation.",
    keywords: ["faq", "multiple organisations", "email", "account switcher", "membership", "ambiguous"],
    paragraphs: [
      "The same email can have a separate membership in more than one organisation. Each membership has its own role, onboarding checklist and access.",
      "If the same password opens more than one membership, sign-in asks for the organisation. If the passwords differ, the correct membership is resolved automatically.",
      "Use Add account in the account menu, or sign in with a different email, to switch between memberships.",
    ],
  },
  {
    id: "faq-currency",
    title: "Which currency does SmartOS use?",
    category: "FAQs",
    summary: "The interface currently formats money in Ghanaian cedi (GHS).",
    keywords: ["faq", "currency", "ghs", "cedi", "money", "finance", "order", "royalty", "tax"],
    paragraphs: [
      "Orders, transactions, budgets and royalty statements are displayed in GHS. The interface does not yet support multi-currency transactions or automatic exchange-rate conversion.",
      "Store amounts in the currency your organisation actually uses for the transaction, and keep any foreign-currency reconciliation in your accounting system.",
    ],
    note: "If you operate in another currency, confirm the deployment's currency requirements before entering financial history.",
  },
  {
    id: "faq-audit",
    title: "Who can see the audit log and legal acceptances?",
    category: "FAQs",
    summary: "audit.read controls organisation-wide activity; acceptance evidence is available to the user and to organisation auditors.",
    keywords: ["faq", "audit", "who", "admin", "legal acceptance", "privacy", "consent", "evidence", "recent activity", "activity feed"],
    paragraphs: [
      "The audit log is available to ORG_ADMIN and PLATFORM_ADMIN through audit.read. Other roles do not see the navigation entry and receive 403 from the API.",
      "The dashboard's recent-activity feed follows the same rule. Users without audit.read see only their own actions; organisation administrators see the organisation-wide feed, limited to the organisation they administer.",
      "Organisation administrators with audit access can review legal acceptance evidence on the Audit log page. Each user's own records can be provided on request through the privacy process.",
      "Acceptance rows are immutable. They record the document code, version, content hash, context, invite (where applicable), IP address, user agent and timestamp.",
    ],
    href: "/audit",
    permission: "audit.read",
  },
  {
    id: "faq-my-activity",
    title: "What appears in my recent activity?",
    category: "FAQs",
    summary: "Your dashboard feed contains only actions recorded against your own account.",
    keywords: ["faq", "recent activity", "activity", "feed", "dashboard", "own", "privacy", "audit", "history"],
    paragraphs: [
      "Every user has a personal recent-activity feed on the dashboard. It lists the most recent actions recorded against their own account, with a short description and the time of the action.",
      "The feed never contains another user's activity. Organisation-wide activity is administrative data: only holders of audit.read can see it, and only for the organisation they belong to.",
      "Activity comes from the append-only audit log. Deactivating a user does not erase their past entries, and entries cannot be edited from the interface.",
      "If you need a formal record of your own actions for compliance, contact an organisation administrator. They can review the organisation audit log, and the privacy process can provide your records on request.",
    ],
    href: "/dashboard",
  },
  {
    id: "faq-offline",
    title: "Does SmartOS work offline?",
    category: "FAQs",
    summary: "No. It is a connected web app; install it to the home screen for a faster, app-like shell, not offline editing.",
    keywords: ["faq", "offline", "pwa", "install", "mobile", "network", "connection"],
    paragraphs: [
      "SmartOS needs a connection to the API for every read and write. It does not queue offline edits or merge conflicting changes.",
      "The web app can be installed to a phone's home screen and opens in a standalone window, but that is a presentation improvement rather than offline support. Do not start a stock posting or fulfilment on an unreliable connection.",
    ],
  },
  {
    id: "faq-security",
    title: "How is my data protected?",
    category: "FAQs",
    summary: "Tenant isolation, role permissions, hashed credentials, rotating refresh tokens, rate limits and audit logging.",
    keywords: ["faq", "security", "data protection", "isolation", "encryption", "password", "token", "audit", "tenant"],
    bullets: [
      "Workspaces are logically isolated by organisation on every query.",
      "Passwords are stored as bcrypt hashes; refresh and reset tokens are stored as SHA-256 hashes.",
      "Refresh tokens rotate, and reuse revokes the token family.",
      "Role permissions are enforced by the API, not only hidden in the interface.",
      "Login, password reset and passkey attempts are rate limited.",
      "Security-relevant mutations are written to the append-only audit log.",
      "Transport is encrypted in production; database and backup encryption depend on the deployment.",
    ],
    note: "Read the Privacy Policy for the data categories, retention periods and your rights.",
    href: "/legal?doc=privacy",
  },

  // ---------------------------------------------------------------- Support
  {
    id: "support-contact",
    title: "Contact support",
    category: "Support",
    summary: "Where to go for product help, access problems and suspected data issues.",
    keywords: ["support", "contact", "help", "issue", "bug", "security", "incident", "email"],
    paragraphs: [
      "Use your organisation's agreed support channel or the support contact listed in your order form. Include the details from the support request checklist so the team can reproduce the issue quickly.",
      "For a suspected security incident, do not wait for normal support hours. Contact the administrator and the security contact immediately, and avoid taking actions that could destroy evidence such as deleting audit records or rewriting stock history.",
    ],
    note: "Support can help with how SmartOS works and with access problems. We cannot give legal, tax or accounting advice.",
    href: "/help",
  },
  {
    id: "support-legal",
    title: "Legal and privacy requests",
    category: "Support",
    summary: "How to exercise a data right, ask about a legal version, or request acceptance evidence.",
    keywords: ["support", "legal", "privacy", "data subject", "access", "deletion", "dpo", "complaint", "acceptance", "evidence"],
    paragraphs: [
      "For a data-subject request, include your name, organisation, the right you are exercising and enough detail to locate the records. If the data is in an organisation workspace, the organisation is normally the controller and should be contacted first.",
      "For a question about which legal version applied to an account, include the account email and the approximate date. The acceptance record contains the exact version and content hash.",
      "For a legal notice, use the contact details published in the Terms of Service. For a privacy complaint, use the privacy contact in the Privacy Policy; you also have the right to complain to a supervisory authority.",
    ],
    href: "/legal",
  },
];

/** Case-insensitive search across titles, summaries, keywords and body text. */
export function searchHelp(articles: HelpArticle[], query: string): HelpArticle[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return articles;
  const terms = needle.split(/\s+/).filter(Boolean);
  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.category,
      ...article.keywords,
      ...(article.paragraphs ?? []),
      ...(article.steps ?? []),
      ...(article.bullets ?? []),
      article.note ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
