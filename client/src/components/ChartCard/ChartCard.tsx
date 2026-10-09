import BarChartRounded from '@mui/icons-material/BarChartRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState, type ReactNode } from 'react';

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
  /** Column indexes to right-align (numeric). */
  numeric?: number[];
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Accessible table equivalent of the chart. */
  table: ChartTable;
  children: ReactNode;
}

/** Frame for a chart with a Chart/Table toggle so the data is never visual-only. */
export function ChartCard({ title, subtitle, table, children }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <Paper variant="outlined" className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label={`${title} view`}>
          <ToggleButton value="chart" aria-label="Chart view">
            <BarChartRounded fontSize="small" />
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table view">
            <TableRowsRounded fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {view === 'chart' ? (
        children
      ) : (
        <div className="overflow-x-auto">
          <Table size="small">
            <TableHead>
              <TableRow>
                {table.columns.map((c, i) => (
                  <TableCell key={c} align={table.numeric?.includes(i) ? 'right' : 'left'}>
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row, r) => (
                <TableRow key={r}>
                  {row.map((cell, i) => (
                    <TableCell key={i} align={table.numeric?.includes(i) ? 'right' : 'left'} className="tabular-nums">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Paper>
  );
}
