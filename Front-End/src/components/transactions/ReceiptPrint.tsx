import { useSettings } from '../../contexts/SettingsContext';
import type { HistoryTransaction } from '../../types/historyTransaction';

interface ReceiptPrintProps {
  transaction: HistoryTransaction;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ReceiptPrint({ transaction: t, shopName, shopAddress, shopPhone }: ReceiptPrintProps) {
  const { settings } = useSettings();
  const paperSize = settings?.receipt_paper_size || '58mm';
  
  const orderLabel = t.order_type === 'takeaway' ? 'Take-away' : 'Dine-in';
  const meth = String(t.payment_method || 'Cash');
  const isCash = meth === 'Cash' || String(t.raw_payment_method || '').toLowerCase() === 'cash';

  const subtotal = t.subtotal ?? 0;
  const discount = t.discount_amount ?? 0;
  const total = t.total_amount ?? 0;

  return (
    <div id="receipt-print-area" className="receipt-print-host">
      <div className="receipt-inner font-mono text-[10px] leading-tight text-black">
        <div className="text-center font-bold">{shopName}</div>
        {shopAddress ? <div className="text-center mt-1 whitespace-pre-wrap">{shopAddress}</div> : null}
        {shopPhone ? <div className="text-center mt-1">{shopPhone}</div> : null}
        <div className="my-2 border-t border-black" />
        <div>Tanggal : {fmtDateTime(t.created_at)}</div>
        <div>Kasir&nbsp;&nbsp;: {t.cashier_name || '-'}</div>
        <div>No. Meja : {t.table_number?.trim() || '-'}</div>
        <div>Tipe&nbsp;&nbsp;&nbsp;: {orderLabel}</div>
        <div className="my-2 border-t border-black" />
        {t.items.map((it, idx) => (
          <div key={idx} className="mt-2">
            <div className="font-semibold">{it.product_name} {it.notes ? `- ${it.notes}` : ''}</div>
            <div className="flex justify-between gap-2">
              <span>{it.quantity} x Rp{formatMoney(it.unit_price)}</span>
              <span>Rp{formatMoney(Number(it.subtotal))}</span>
            </div>
          </div>
        ))}
        <div className="my-2 border-t border-black" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp{formatMoney(subtotal)}</span>
        </div>
        {(t.tax_amount !== undefined && t.tax_amount > 0) && (
          <div className="flex justify-between">
            <span>{settings?.tax_label || 'Pajak'} ({t.tax_rate || 0}%)</span>
            <span>Rp{formatMoney(t.tax_amount)}</span>
          </div>
        )}
        {(t.service_charge !== undefined && t.service_charge > 0) && (
          <div className="flex justify-between">
            <span>{settings?.service_charge_label || 'Service'}</span>
            <span>Rp{formatMoney(t.service_charge)}</span>
          </div>
        )}
        {discount > 0 ? (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>- Rp{formatMoney(discount)}</span>
          </div>
        ) : null}
        <div className="mt-1 flex justify-between font-bold">
          <span>TOTAL</span>
          <span>Rp{formatMoney(total)}</span>
        </div>
        {isCash && t.amount_paid != null ? (
          <>
            <div className="my-2 border-t border-black" />
            <div className="flex justify-between">
              <span>Bayar</span>
              <span>Rp{formatMoney(Number(t.amount_paid))}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembali</span>
              <span>Rp{formatMoney(Number(t.change_amount ?? 0))}</span>
            </div>
          </>
        ) : null}
        <div className="my-2 border-t border-black" />
        <div className="text-center">Metode: {meth}</div>
        {t.notes ? (
          <>
            <div className="my-2 border-t border-black" />
            <div>Catatan: {t.notes}</div>
          </>
        ) : null}
        <div className="my-2 border-t border-black" />
        <div className="text-center">
          {settings?.receipt_footer ? (
            <div className="whitespace-pre-wrap">{settings.receipt_footer}</div>
          ) : (
            <>
              <div>Terima kasih telah berkunjung!</div>
              <div>Sampai jumpa kembali :)</div>
            </>
          )}
        </div>
      </div>
      <style>{`
        .receipt-print-host {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperSize};
            padding: 0;
            margin: 0;
            font-family: ui-monospace, monospace;
          }
          @page {
            size: ${paperSize} auto;
            margin: 2mm;
          }
        }
      `}</style>
    </div>
  );
}
