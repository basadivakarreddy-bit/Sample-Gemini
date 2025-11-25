import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { SendIcon, PlusIcon, StopIcon, ImageIcon, XIcon, MicIcon } from './Icons';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled: boolean;
  isStreaming: boolean;
  onStop: () => void;
}

const MAX_IMAGE_SIZE_MB = 10;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isStreaming, onStop }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialInputRef = useRef<string>('');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || disabled) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          alert(`File too large. Max ${MAX_IMAGE_SIZE_MB}MB.`);
          return;
      }
      if (!file.type.startsWith('image/')) {
          alert("Only image files are supported.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        
        setAttachments(prev => [...prev, {
            mimeType: file.type,
            data: base64Data
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence/phrase
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Store the text before we started listening so we can append efficiently
    initialInputRef.current = input;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Combine previous text + final + interim
      // Add a space if we are appending to existing text
      const prefix = initialInputRef.current ? initialInputRef.current + ' ' : '';
      const currentText = prefix + finalTranscript + interimTranscript;
      
      setInput(currentText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Once it ends, the final text is already in `input` via onresult
      // We update the ref for next time just in case, though onstart resets it.
      initialInputRef.current = input; 
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="relative flex flex-col bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-300">
        
        {/* Attachment Preview Area */}
        {attachments.length > 0 && (
            <div className="flex gap-3 p-3 bg-gray-800/50 overflow-x-auto">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative group shrink-0">
                        <img 
                            src={`data:${att.mimeType};base64,${att.data}`} 
                            alt="preview" 
                            className="h-16 w-16 object-cover rounded-lg border border-gray-600" 
                        />
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-gray-700 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors border border-gray-600"
                        >
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex items-end gap-2 p-3">
          {/* File Input Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            title="Attach image"
            disabled={disabled || isStreaming}
          >
            <PlusIcon className="w-6 h-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : (isStreaming ? "Gemini is thinking..." : "Ask anything...")}
            className="flex-1 max-h-[200px] py-3 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none overflow-y-auto scrollbar-thin"
            rows={1}
            disabled={disabled}
          />

          {/* Mic Button */}
           <button
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-red-500/10 text-red-500 animate-pulse ring-1 ring-red-500/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Dictate"
            disabled={disabled || isStreaming}
          >
            <MicIcon className="w-6 h-6" />
          </button>

          {/* Send/Stop Button */}
          {isStreaming ? (
             <button
                onClick={onStop}
                className="p-3 bg-gray-800 text-red-400 rounded-full hover:bg-gray-700 hover:text-red-300 transition-all duration-200"
             >
                <StopIcon className="w-6 h-6" />
             </button>
          ) : (
            <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`p-3 rounded-full transition-all duration-200 ${
                (!input.trim() && attachments.length === 0) || disabled
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                }`}
            >
                <SendIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-3 text-xs text-gray-500">
        Gemini 2.5 Flash can make mistakes. Check important info.
      </div>
    </div>
  );
};

export default ChatInput;