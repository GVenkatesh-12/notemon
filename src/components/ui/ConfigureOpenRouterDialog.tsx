import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, RefreshCw, Trash2 } from 'lucide-react';
import { SkeuoButton } from './SkeuoButton';
import { SkeuoInput } from './SkeuoInput';
import {
  clearOpenRouterConfig,
  fetchOpenRouterCredits,
  fetchOpenRouterModels,
  getOpenRouterConfig,
  saveOpenRouterConfig,
  type OpenRouterModel,
} from '../../api/openRouter';

interface ConfigureOpenRouterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatPrice(price?: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) return 'n/a';
  return `$${(value * 1_000_000).toFixed(2)}/M`;
}

export function ConfigureOpenRouterDialog({ isOpen, onClose }: ConfigureOpenRouterDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('');
  const [manualModelId, setManualModelId] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [creditsMessage, setCreditsMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const config = getOpenRouterConfig();
    setApiKey(config.apiKey);
    setModelId(config.modelId);
    setManualModelId(config.modelId);
    setError('');
    setCreditsMessage('');
  }, [isOpen]);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === modelId),
    [modelId, models]
  );

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    if (!query) return models.slice(0, 80);
    return models
      .filter((model) =>
        `${model.name} ${model.id}`.toLowerCase().includes(query)
      )
      .slice(0, 80);
  }, [modelSearch, models]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    setError('');
    try {
      const loaded = await fetchOpenRouterModels(apiKey.trim() || undefined);
      setModels(loaded);
      if (!modelId && loaded[0]) {
        setModelId(loaded[0].id);
        setManualModelId(loaded[0].id);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load OpenRouter models.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const checkCredits = async () => {
    if (!apiKey.trim()) {
      setError('Enter an OpenRouter API key first.');
      return;
    }

    setIsCheckingCredits(true);
    setError('');
    setCreditsMessage('');
    try {
      const credits = await fetchOpenRouterCredits(apiKey.trim());
      if (credits.remaining === null) {
        setCreditsMessage('Credits endpoint responded, but the balance format was not recognized.');
      } else {
        setCreditsMessage(
          `Balance: $${credits.remaining.toFixed(4)} remaining ($${(credits.totalUsage ?? 0).toFixed(4)} used)`
        );
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not read OpenRouter credits for this key.';
      setCreditsMessage(`Balance unavailable: ${msg}`);
    } finally {
      setIsCheckingCredits(false);
    }
  };

  const handleSave = () => {
    const chosenModelId = manualModelId.trim() || modelId.trim();
    if (!apiKey.trim()) {
      setError('OpenRouter API key is required.');
      return;
    }
    if (!chosenModelId) {
      setError('Select or enter an OpenRouter model.');
      return;
    }

    const model = models.find((item) => item.id === chosenModelId) || selectedModel;
    saveOpenRouterConfig({
      apiKey: apiKey.trim(),
      modelId: chosenModelId,
      modelName: model?.name,
      pricing: model?.pricing,
    });
    toast.success('OpenRouter configuration saved.');
    onClose();
  };

  const handleClear = () => {
    clearOpenRouterConfig();
    setApiKey('');
    setModelId('');
    setManualModelId('');
    setCreditsMessage('');
    toast.success('OpenRouter configuration removed.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative skeuo-panel rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={20} className="text-blue-500" />
          <h3 className="text-xl font-bold text-[var(--text-color)]">Configure OpenRouter API</h3>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <SkeuoInput
            label="OpenRouter API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            showPasswordToggle
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <SkeuoInput
              label="Search Models"
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search by model name or id"
            />
            <div className="flex items-end">
              <SkeuoButton
                type="button"
                onClick={loadModels}
                disabled={isLoadingModels}
                className="h-[50px] w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isLoadingModels ? 'animate-spin' : ''} />
                Models
              </SkeuoButton>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold opacity-80 pl-1">AI Model</label>
            <select
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value);
                setManualModelId(e.target.value);
              }}
              className="skeuo-inset px-4 py-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500/50 text-[var(--text-color)] bg-[var(--bg-color)]"
            >
              <option value="">Select a model</option>
              {filteredModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.id})
                </option>
              ))}
            </select>
            {selectedModel?.pricing && (
              <span className="text-xs opacity-60 pl-1">
                Pricing estimate: {formatPrice(selectedModel.pricing.prompt)} input,{' '}
                {formatPrice(selectedModel.pricing.completion)} output
              </span>
            )}
          </div>

          <SkeuoInput
            label="Model ID"
            type="text"
            value={manualModelId}
            onChange={(e) => setManualModelId(e.target.value)}
            placeholder="openai/gpt-5.2"
          />

          {creditsMessage && (
            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg text-sm opacity-80 border border-[var(--border-color)]">
              {creditsMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <div className="flex gap-2">
              <SkeuoButton
                type="button"
                variant="ghost"
                onClick={checkCredits}
                disabled={isCheckingCredits}
                className="text-sm font-medium"
              >
                {isCheckingCredits ? 'Checking...' : 'Check Balance'}
              </SkeuoButton>
              <SkeuoButton
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-sm font-medium text-red-500 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Clear
              </SkeuoButton>
            </div>

            <div className="flex justify-end gap-3">
              <SkeuoButton
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-sm font-medium"
              >
                Cancel
              </SkeuoButton>
              <SkeuoButton
                type="button"
                onClick={handleSave}
                className="bg-blue-500 text-white hover:bg-blue-600 border-blue-600/50 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.2),inset_-2px_-2px_5px_rgba(0,0,0,0.2),2px_2px_5px_rgba(0,0,0,0.1)] text-sm font-medium px-5 py-2"
              >
                Save
              </SkeuoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
