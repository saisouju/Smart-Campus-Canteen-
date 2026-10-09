import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { TopCustomer } from '@canteen/shared';
import { formatCurrency } from '@/utils/format';

const MEDALS = ['text-amber-500', 'text-slate-400', 'text-orange-700'];

export interface TopCustomersTableProps {
  customers: TopCustomer[];
}

/** All-time leaderboard ranked by items ordered. A bar per row shows share of the leader's count. */
export function TopCustomersTable({ customers }: TopCustomersTableProps) {
  const leader = customers[0]?.items ?? 0;
  return (
    <TableContainer>
      <Table size="small" aria-label="Top customers">
        <TableHead>
          <TableRow>
            <TableCell className="w-12">#</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell className="min-w-40">Items ordered</TableCell>
            <TableCell align="right">Orders</TableCell>
            <TableCell align="right">Spent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" className="py-10 text-ink-muted">
                No orders yet.
              </TableCell>
            </TableRow>
          )}
          {customers.map((c, i) => (
            <TableRow key={c.userId} hover>
              <TableCell>
                {i < 3 ? (
                  <EmojiEventsRounded fontSize="small" className={MEDALS[i]} aria-label={`Rank ${i + 1}`} />
                ) : (
                  <span className="pl-1 text-sm font-semibold text-ink-muted tabular-nums">{i + 1}</span>
                )}
              </TableCell>
              <TableCell>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-ink-muted">
                  {c.email} · <span className="capitalize">{c.role}</span>
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${leader ? (c.items / leader) * 100 : 0}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm font-semibold tabular-nums">{c.items}</span>
                </div>
              </TableCell>
              <TableCell align="right" className="tabular-nums">
                {c.orders}
              </TableCell>
              <TableCell align="right" className="tabular-nums">
                {formatCurrency(c.spent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
