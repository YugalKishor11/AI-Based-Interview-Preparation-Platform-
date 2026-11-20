import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaArt } from '../../shared/ui/PersonaArt';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import { SEED_PERSONAS } from '../../data/mock/seed';
import { Persona } from '../../data/contracts';
import { ArrowRight, ArrowLeft, GitCompare, Sparkles, Volume2 } from 'lucide-react';
import { ttsService, TTSState } from '../../shared/audio/ttsService';
import { getVoiceConfig, SAMPLE_PREVIEW_TEXT } from '../../shared/audio/voiceRegistry';

export const InterviewerSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem('prepsphere_selected_persona_id') || 'p4';
  });
  const [comparePersonas, setComparePersonas] = useState<[Persona, Persona] | null>(null);
  const [previewMsg, setPreviewMsg] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());

  useEffect(() => {
    return ttsService.subscribe(setTtsState);
  }, []);

  const handleSelectPersona = (id: string) => {
    setSelectedId(id);
    const persona = SEED_PERSONAS.find((p) => p.id === id);
    const voice = getVoiceConfig(id);
    try {
      localStorage.setItem('prepsphere_selected_persona_id', id);
      localStorage.setItem('prepsphere_selected_voice_id', voice.id);
    } catch {}
  };

  const handleVoicePreview = async (persona: Persona) => {
    const voice = getVoiceConfig(persona.id);
    setPreviewMsg(`Previewing ${persona.name} (${voice.styleDescription}): "${SAMPLE_PREVIEW_TEXT}"`);
    try {
      await ttsService.previewVoice(persona.id);
    } catch (err) {
      console.warn('Voice preview error:', err);
    }
  };

  const handleOpenCompare = () => {
    setComparePersonas([SEED_PERSONAS[0], SEED_PERSONAS[3]]);
  };

  const handleContinue = () => {
    handleSelectPersona(selectedId);
    navigate(`/app/interview/check?personaId=${selectedId}`);
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="ai">Virtual AI Interviewers</Badge>
            <span className="text-xs text-txt-muted">Select an interviewer persona</span>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
            Select Your AI Interviewer
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Personas are virtual AI interviewers with specific evaluation approaches. They are never presented as real people.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleOpenCompare} className="gap-1.5">
            <GitCompare className="w-4 h-4 text-secondary" /> Compare Personas
          </Button>
          <Button variant="primary" onClick={handleContinue} className="gap-1.5">
            Proceed to Device Check <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {previewMsg && (
        <div className="p-3 rounded-xl bg-primary/20 border border-primary/40 text-xs font-semibold text-txt flex items-center gap-2 animate-in fade-in">
          <Volume2 className="w-4 h-4 text-primary shrink-0" />
          <span>{previewMsg}</span>
        </div>
      )}

      {/* 4 Persona Art Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SEED_PERSONAS.map((persona) => {
          const voice = getVoiceConfig(persona.id);
          const isThisSpeaking = ttsState.isSpeaking && ttsState.activeVoiceId === voice.id;
          const isThisLoading = ttsState.isLoading && ttsState.activeVoiceId === voice.id;

          return (
            <PersonaArt
              key={persona.id}
              persona={persona}
              selected={selectedId === persona.id}
              isPlayingVoice={isThisSpeaking}
              isLoadingVoice={isThisLoading}
              onSelect={() => handleSelectPersona(persona.id)}
              onPreviewVoice={() => handleVoicePreview(persona)}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-border/15">
        <Button variant="ghost" onClick={() => navigate('/app/interview/new')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Configuration
        </Button>
        <Button variant="primary" onClick={handleContinue}>
          Confirm {SEED_PERSONAS.find((p) => p.id === selectedId)?.name} & Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Side-by-Side Comparison Drawer */}
      {comparePersonas && (
        <Sheet open={Boolean(comparePersonas)} onOpenChange={() => setComparePersonas(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Compare Virtual Personas</SheetTitle>
              <SheetDescription>
                Side-by-side comparison of conversational pacing, style, and probing depth.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {comparePersonas.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-surface/70 border border-border/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-head font-bold text-sm text-txt">{p.name}</span>
                    <Badge variant="ai">{p.style}</Badge>
                  </div>
                  <p className="text-xs text-secondary font-semibold">{p.title}</p>
                  <p className="text-xs text-txt-2 leading-relaxed">{p.description}</p>
                  <div className="text-[11px] text-txt-muted pt-2 border-t border-border/10">
                    Languages: <strong className="text-txt">{p.languages}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-elevated/60 text-[11px] italic text-txt-2">
                    "{p.sampleLine}"
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      handleSelectPersona(p.id);
                      setComparePersonas(null);
                    }}
                    className="w-full mt-2"
                  >
                    Select {p.name.split(' ')[0]}
                  </Button>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
