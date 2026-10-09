import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { IntroSequence } from './IntroSequence';

const meta = {
  title: 'Brand/IntroSequence',
  component: IntroSequence,
  args: { onFinish: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof IntroSequence>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plays the full sequence; press Replay to run it again. */
export const Playback: Story = {
  render: function Render(args) {
    const [run, setRun] = useState(1);
    const [playing, setPlaying] = useState(true);
    return (
      <div className="flex min-h-screen items-center justify-center">
        {playing ? (
          <IntroSequence
            key={run}
            {...args}
            onFinish={() => {
              args.onFinish();
              setPlaying(false);
            }}
          />
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              setRun((r) => r + 1);
              setPlaying(true);
            }}
          >
            Replay intro
          </Button>
        )}
      </div>
    );
  },
};

/** Frozen on the first frame, handy for visual review of the layout. */
export const Paused: Story = { args: { paused: true } };

/** What users with "reduce motion" turned on see: a still title card, opacity only. */
export const ReducedMotion: Story = { args: { calm: true } };
