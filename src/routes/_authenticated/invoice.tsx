import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Download, FileText, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/invoice")({
  ssr: false,
  head: () => ({ meta: [{ title: "Invoice Generator — BlogiFy" }] }),
  component: InvoicePage,
});

type LineItem = { id: string; description: string; quantity: number; unitPrice: number };

const BANK = {
  beneficiary: "Jalal Jamal Nasser",
  bank: "Citibank",
  address: "Canada Square, Canary Wharf London, E14 5LB United Kingdom",
  account: "56466303",
  sort: "185008",
  iban: "GB02CITI18500856466303",
  bic: "CITIGB2L",
};

const CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const generateInvoiceNo = () =>
  `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

function InvoicePage() {
  const [invoiceNo, setInvoiceNo] = useState<string>(() => generateInvoiceNo());
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(plusDays(todayISO(), 14));
  const [currency, setCurrency] = useState("GBP");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("Thank you for your business.");

  const [busy, setBusy] = useState(false);

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "";
  const fmt = (n: number) =>
    `${symbol}${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );
  const taxAmount = useMemo(() => subtotal * ((Number(taxRate) || 0) / 100), [subtotal, taxRate]);
  const total = subtotal + taxAmount;

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addItem = () =>
    setItems((prev) => [...prev, { id: uid(), description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  async function downloadPDF() {
    if (!clientName.trim()) {
      alert("Please enter a client name.");
      return;
    }
    setBusy(true);
    try {
      const [{ default: jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = (autoTableMod as { default: (doc: unknown, opts: unknown) => void }).default;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 40;

      // Header band
      doc.setFillColor(19, 20, 31);
      doc.rect(0, 0, pageW, 90, "F");
      doc.setFillColor(0, 212, 255);
      doc.rect(0, 90, pageW, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("BlogiFy", M, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 210);
      doc.text("jalalnasser.com", M, 62);
      doc.text("info@jalalnasser.com", M, 76);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE", pageW - M, 45, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 210);
      doc.text(`#${invoiceNo}`, pageW - M, 62, { align: "right" });

      // Meta / Bill to
      let y = 130;
      doc.setTextColor(60, 60, 70);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", M, y);
      doc.text("INVOICE DATE", pageW - M - 160, y);
      doc.text("DUE DATE", pageW - M, y, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 30);
      y += 16;
      doc.text(clientName || "-", M, y);
      doc.text(issueDate, pageW - M - 160, y);
      doc.text(dueDate, pageW - M, y, { align: "right" });

      doc.setFontSize(10);
      doc.setTextColor(90, 90, 110);
      const addrLines = doc.splitTextToSize(clientAddress || "", 240);
      let by = y + 14;
      addrLines.forEach((ln: string) => {
        doc.text(ln, M, by);
        by += 12;
      });
      if (clientEmail) {
        doc.text(clientEmail, M, by);
        by += 12;
      }

      const tableStart = Math.max(by + 16, y + 60);

      autoTable(doc, {
        startY: tableStart,
        head: [["Description", "Qty", "Unit Price", "Amount"]],
        body: items.map((i) => [
          i.description || "-",
          String(i.quantity),
          fmt(Number(i.unitPrice) || 0),
          fmt((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)),
        ]),
        margin: { left: M, right: M },
        styles: { fontSize: 10, cellPadding: 8, textColor: [30, 30, 40] },
        headStyles: { fillColor: [19, 20, 31], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 50, halign: "right" },
          2: { cellWidth: 90, halign: "right" },
          3: { cellWidth: 90, halign: "right" },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Totals
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      const rightX = pageW - M;
      const labelX = pageW - M - 180;
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 110);

      const rows: Array<[string, string, boolean]> = [
        ["Subtotal", fmt(subtotal), false],
        [`Tax (${taxRate || 0}%)`, fmt(taxAmount), false],
        ["Total", `${fmt(total)} ${currency}`, true],
      ];
      let ry = finalY;
      rows.forEach(([label, val, bold]) => {
        if (bold) {
          doc.setFillColor(19, 20, 31);
          doc.rect(labelX - 8, ry - 4, rightX - labelX + 12, 24, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(label, labelX, ry + 12);
          doc.text(val, rightX, ry + 12, { align: "right" });
          ry += 28;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(90, 90, 110);
          doc.text(label, labelX, ry + 8);
          doc.setTextColor(20, 20, 30);
          doc.text(val, rightX, ry + 8, { align: "right" });
          ry += 18;
        }
      });

      // Payment instructions
      let py = ry + 20;
      if (py > pageH - 200) {
        doc.addPage();
        py = M;
      }
      doc.setDrawColor(220, 224, 232);
      doc.line(M, py, pageW - M, py);
      py += 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 30);
      doc.text("Payment Instructions", M, py);
      py += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 90);
      doc.text("Please transfer the total amount to the following UK bank account:", M, py);
      py += 18;

      const pay: Array<[string, string]> = [
        ["Beneficiary Name", BANK.beneficiary],
        ["Bank Name", BANK.bank],
        ["Bank Address", BANK.address],
        ["Account Number", BANK.account],
        ["Sort Code", BANK.sort],
        ["IBAN", BANK.iban],
        ["BIC / SWIFT", BANK.bic],
      ];
      autoTable(doc, {
        startY: py,
        body: pay,
        theme: "plain",
        margin: { left: M, right: M },
        styles: { fontSize: 10, cellPadding: { top: 3, bottom: 3, left: 0, right: 0 } },
        columnStyles: {
          0: { cellWidth: 130, textColor: [110, 110, 130], fontStyle: "bold" },
          1: { textColor: [20, 20, 30] },
        },
      });

      const afterPay = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      if (notes.trim()) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 140);
        doc.setFont("helvetica", "italic");
        const nl = doc.splitTextToSize(notes, pageW - 2 * M);
        doc.text(nl, M, afterPay);
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 160);
      doc.text(
        `BlogiFy · jalalnasser.com · Generated ${new Date().toLocaleDateString("en-GB")}`,
        pageW / 2,
        pageH - 20,
        { align: "center" }
      );

      doc.save(`${invoiceNo}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Invoice Generator">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          <section className="surface-card rounded-2xl border border-border p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
              <FileText className="size-4 text-brand" /> Invoice details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Invoice #</Label>
                <div className="flex gap-2">
                  <input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setInvoiceNo(generateInvoiceNo())}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-brand hover:border-brand transition-colors"
                    title="Generate new invoice number"
                  >
                    <RefreshCw className="size-3.5" />
                    New
                  </button>
                </div>
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Issue date" type="date" value={issueDate} onChange={setIssueDate} />
              <Field label="Due date" type="date" value={dueDate} onChange={setDueDate} />
            </div>
          </section>

          <section className="surface-card rounded-2xl border border-border p-6">
            <h2 className="font-display font-semibold mb-4">Bill to</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name *" value={clientName} onChange={setClientName} />
              <Field label="Client email" type="email" value={clientEmail} onChange={setClientEmail} />
              <div className="sm:col-span-2">
                <Label>Client address</Label>
                <textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          <section className="surface-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold">Line items</h2>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
              >
                <Plus className="size-4" /> Add item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="grid gap-2 sm:grid-cols-12 items-start">
                  <input
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    className={`${inputCls} sm:col-span-6`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                    className={`${inputCls} sm:col-span-2`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Unit price"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                    className={`${inputCls} sm:col-span-3`}
                  />
                  <button
                    onClick={() => removeItem(it.id)}
                    className="sm:col-span-1 h-10 grid place-items-center rounded-lg border border-border hover:border-destructive hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tax rate (%)</Label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>
        </div>

        {/* Preview */}
        <aside className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="surface-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Summary</span>
                <span className="text-xs font-mono text-muted-foreground">{invoiceNo}</span>
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Subtotal" value={fmt(subtotal)} />
                <Row label={`Tax (${taxRate || 0}%)`} value={fmt(taxAmount)} />
                <div className="h-px bg-border my-2" />
                <Row label="Total" value={`${fmt(total)} ${currency}`} bold />
              </dl>

              <button
                onClick={downloadPDF}
                disabled={busy}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60 transition-colors"
              >
                <Download className="size-4" />
                {busy ? "Generating…" : "Download PDF"}
              </button>
            </div>

            <div className="surface-card rounded-2xl border border-border p-6 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground mb-1">Payment (printed on PDF)</p>
              <p>{BANK.beneficiary} · {BANK.bank}</p>
              <p>Acc {BANK.account} · Sort {BANK.sort}</p>
              <p className="font-mono">{BANK.iban}</p>
              <p className="font-mono">{BANK.bic}</p>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-brand" : ""}>{value}</span>
    </div>
  );
}
