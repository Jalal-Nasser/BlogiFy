import { useState } from "react";
import { Copy, Check } from "lucide-react";

const WALLET = "0xEcf99d1d1289F7CCcF045F3ebFAAee97c8e74287";

export function DonationWidget() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="surface-card p-6 rounded-xl border border-yellow-500/20">
      <div className="flex items-center gap-2 mb-4">
        <img
          src="https://cryptologos.cc/logos/binance-coin-bnb-logo.svg"
          alt="BNB"
          className="w-6 h-6"
        />
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Support via Crypto
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        If you find this content helpful, feel free to send a tip — BNB / ETH / USDT (BEP-20 or ERC-20).
      </p>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${WALLET}&bgcolor=0d0d1a&color=F0B90B&margin=6`}
          alt="Wallet QR Code"
          className="rounded-lg border border-yellow-500/30"
          width={140}
          height={140}
        />
      </div>

      {/* Address + Copy */}
      <div className="flex items-center gap-2 bg-background/60 rounded-lg border border-border px-3 py-2">
        <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
          {WALLET}
        </span>
        <button
          onClick={copy}
          className="shrink-0 text-yellow-400 hover:text-yellow-300 transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
      {copied && (
        <p className="text-xs text-yellow-400 text-center mt-2">Address copied!</p>
      )}
    </div>
  );
}
