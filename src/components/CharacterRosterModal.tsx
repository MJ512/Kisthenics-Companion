import React, { useState } from 'react';
import { CHARACTER_CATALOG } from '../utils/characterRegistry';
import { CharacterAsset } from '../types';
import { playCompanionSound } from '../utils/audio';
import { X, Play, Volume2 } from 'lucide-react';

interface CharacterRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCharacter: (character: CharacterAsset) => void;
}

export const CharacterRosterModal: React.FC<CharacterRosterModalProps> = ({
  isOpen,
  onClose,
  onTestCharacter,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterAsset>(CHARACTER_CATALOG[0]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-modal-enter w-full flex flex-col"
        style={{
          maxWidth: 880,
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)',
          color: 'var(--color-text-primary)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>
              Companion Characters
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
              All 12 authentic companion personalities
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body — two-column */}
        <div
          className="flex-1 overflow-hidden"
          style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}
        >
          {/* Left: Character grid — 4 columns */}
          <div
            className="modal-scroll overflow-y-auto"
            style={{
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              alignContent: 'start',
              borderRight: '1px solid var(--color-divider)',
            }}
          >
            {CHARACTER_CATALOG.map((char) => {
              const isSelected = selectedChar.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setSelectedChar(char)}
                  className="char-card"
                  style={{
                    gap: 6,
                    padding: '8px 6px 10px',
                    position: 'relative',
                    borderColor: isSelected ? 'var(--color-primary)' : undefined,
                    background: isSelected ? 'var(--color-primary-soft)' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px rgba(193, 95, 60, 0.2)' : undefined,
                  }}
                  aria-pressed={isSelected}
                  title={`${char.emotion} — ${char.catchphrase}`}
                >
                  {/* Large artwork area */}
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={char.avatarUrl}
                      alt={char.emotion}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center bottom',
                        maxWidth: 'none',
                        maxHeight: 'none',
                      }}
                      className="select-none"
                      draggable={false}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    {char.emotion}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-text-tertiary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {char.action}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Detail panel */}
          <div
            className="modal-scroll overflow-y-auto flex flex-col"
            style={{
              padding: '20px 16px',
              background: 'var(--color-surface-soft)',
            }}
          >
            {/* Character large preview */}
            <div className="flex flex-col items-center text-center flex-1" style={{ gap: 12 }}>
              {/* Full-width hero artwork */}
              <div
                className="relative"
                style={{ width: '100%', height: 280 }}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-25 blur-2xl pointer-events-none"
                  style={{ background: selectedChar.glowColor }}
                />
                <img
                  src={selectedChar.avatarUrl}
                  alt={selectedChar.emotion}
                  className="relative anim-idle-breathing select-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center bottom',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
                  }}
                  draggable={false}
                />
              </div>

              {/* Name + action */}
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {selectedChar.emotion}
                </h3>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: 4,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '11px',
                    fontWeight: 500,
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(193, 95, 60, 0.18)',
                  }}
                >
                  {selectedChar.action}
                </div>
              </div>

              {/* Catchphrase */}
              <div
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                  color: 'var(--color-primary)',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                "{selectedChar.catchphrase}"
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {selectedChar.description}
              </p>

              {/* Keywords */}
              <div style={{ width: '100%', textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 6,
                  }}
                >
                  Keyword triggers
                </div>
                <div className="flex flex-wrap" style={{ gap: 4 }}>
                  {selectedChar.keywords.slice(0, 8).map((kw) => (
                    <span
                      key={kw}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: '10px',
                        fontWeight: 500,
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-tertiary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingTop: 14,
                marginTop: 'auto',
                borderTop: '1px solid var(--color-divider)',
              }}
            >
              <button
                type="button"
                onClick={() => playCompanionSound(selectedChar.soundType)}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '12px', padding: '8px 12px', justifyContent: 'center' }}
              >
                <Volume2 size={12} />
                Hear chime
              </button>

              <button
                type="button"
                onClick={() => {
                  onTestCharacter(selectedChar);
                  onClose();
                }}
                className="btn-primary"
                style={{ width: '100%', fontSize: '12px', padding: '9px 12px', justifyContent: 'center' }}
              >
                <Play size={12} />
                Preview alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
