import React, { useEffect } from 'react';
import type { AppCopy } from '../../i18n';
import { ClientGameState } from '../../shared/types';
import { FoldedChit } from '../ui/FoldedChit';
import { ROLE_ARTWORK } from '../ui/RoleVisuals';
import { sound } from '../../utils/sound';

interface SlotSelectionScreenProps {
  copy: AppCopy;
  state: ClientGameState;
  pendingSlotIndex: number | null;
  onSelectSlot: (slotIndex: number) => void;
}

export const SlotSelectionScreen: React.FC<SlotSelectionScreenProps> = ({
  copy,
  state,
  pendingSlotIndex,
  onSelectSlot,
}) => {
  const totalSlots = state.slots.length;
  const remainingCount = state.slots.filter((s) => s.claimedByPlayerId === null).length;
  const myChosenSlot = state.mySlotIndex;
  const hasChosen = myChosenSlot !== null;
  const isWaitingForClaim = pendingSlotIndex !== null;

  // Preload the 4 role crest illustrations while picking chits so role reveal flips with zero image decode lag
  useEffect(() => {
    Object.values(ROLE_ARTWORK).forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  const gridColsClass =
    totalSlots <= 4
      ? 'grid-cols-2 max-w-md'
      : totalSlots <= 6
      ? 'grid-cols-2 sm:grid-cols-3 max-w-xl'
      : totalSlots <= 8
      ? 'grid-cols-2 sm:grid-cols-4 max-w-2xl'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-3xl';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 min-h-[calc(100dvh-72px)] flex flex-col items-center">
      <div className="text-center max-w-md mx-auto mb-6">
        <div className="text-xs text-[#D9A441] font-medium mb-1.5">
          <span>{copy.roundIntro.roundOf(state.currentRound, state.settings.totalRounds)}</span>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            {copy.slotSelection.remainingCount(remainingCount, totalSlots)}
          </span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#F6EFE0]">
          {hasChosen
            ? copy.slotSelection.chosenTitle
            : copy.slotSelection.choosePrompt(totalSlots)}
        </h1>

        <p className="mt-2 text-sm sm:text-base text-[#C5BFA8]">
          {hasChosen ? copy.slotSelection.chosenSubtitle : copy.slotSelection.tapInstruction}
        </p>
      </div>

      <div className={`w-full mx-auto grid gap-3.5 sm:gap-4 ${gridColsClass}`}>
        {state.slots.map((slot) => (
          <FoldedChit
            key={slot.index}
            slot={slot}
            isMine={slot.claimedByPlayerId === state.myPlayerId}
            isPending={pendingSlotIndex === slot.index && !hasChosen}
            disabled={hasChosen || isWaitingForClaim}
            animationsEnabled={state.settings.animationsEnabled}
            copy={copy}
            onSelect={(idx) => {
              sound.playTap();
              onSelectSlot(idx);
            }}
          />
        ))}
      </div>

      <div className="mt-8 w-full max-w-xl border-t border-[#263047] pt-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#9FA8BD]">
          {state.players.map((p) => (
            <span
              key={p.id}
              className={p.hasPickedSlot ? 'text-[#D9A441] font-semibold' : 'text-[#7B8499]'}
            >
              {p.name} {p.hasPickedSlot ? '✓' : '…'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
