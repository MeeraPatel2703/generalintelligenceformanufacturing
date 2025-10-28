/**
 * CHATBOT SIDEBAR
 * NLP-powered chatbot for querying simulation data and running scenarios
 */

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatbotState, QueryResult, ComparisonResult, BottleneckAnalysis } from '../types/chatbot';
import { ExtractedSystem } from '../types/extraction';
import { ComprehensiveSimulationResults } from '../types/simulation';
import '../styles/chatbot.css';

interface Props {
  system: ExtractedSystem;
  currentResults?: ComprehensiveSimulationResults;
  onRunScenario?: (parameters: any) => Promise<ComprehensiveSimulationResults>;
  onClose: () => void;
}

export function ChatbotSidebar({ system, currentResults, onRunScenario, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when sidebar mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your simulation assistant. I can help you:

**Query data:**
- "What was the average throughput?"
- "Show me cycle times"
- "What's the utilization of each machine?"

**Run scenarios:**
- "Run a scenario with Machine1 capacity of 3"
- "Test doubling the arrival rate"
- "Simulate with 5 replications"

**Compare results:**
- "Compare the last two scenarios"
- "Which scenario had better throughput?"

**Analyze bottlenecks:**
- "What's the primary bottleneck?"
- "Which machine is most utilized?"
- "Analyze queue lengths"

**Optimize:**
- "Optimize for maximum throughput"
- "What changes would improve performance?"

What would you like to know?`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call backend chatbot service
      const response = await (window as any).electron.chatbot.sendMessage({
        message: input.trim(),
        system,
        currentResults,
        conversationHistory: messages.slice(-10), // Last 10 messages for context
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        functionCall: response.functionCall,
        functionResult: response.functionResult,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If function result includes running a scenario, trigger the callback
      if (response.functionCall?.name === 'runScenario' && response.functionResult?.results) {
        if (onRunScenario) {
          // Optionally update parent component with new results
          // onRunScenario is already handled by the backend
        }
      }

    } catch (error) {
      console.error('[ChatbotSidebar] Error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        metadata: { isError: true },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear chat history?')) {
      setMessages([]);
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Handle function results with special formatting
    if (message.functionResult) {
      return (
        <div>
          <div style={{ marginBottom: '10px' }}>{message.content}</div>
          {renderFunctionResult(message.functionCall?.name, message.functionResult)}
        </div>
      );
    }

    // Regular message with markdown-style formatting
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.6',
          overflowWrap: 'break-word'
        }}
        dangerouslySetInnerHTML={{
          __html: formatMessageContent(message.content)
        }}
      />
    );
  };

  const formatMessageContent = (content: string): string => {
    // Bold: **text**
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-primary); font-weight: 600; display: inline;">$1</strong>');
    // Italic: *text*
    content = content.replace(/\*(.*?)\*/g, '<em style="display: inline;">$1</em>');
    // Code: `code`
    content = content.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; display: inline;">$1</code>');
    // Remove bullet points and emojis
    content = content.replace(/^[•●○✓✗✅❌⚠️🚨🏆➤▶️⏸🔄✕💬🗑️🤖📋]/gm, '');
    content = content.replace(/[👋🎬🔬💡🚀]/g, '');

    return content;
  };

  const renderFunctionResult = (functionName?: string, result?: any) => {
    if (!result) return null;

    switch (functionName) {
      case 'querySimulationData':
        return renderQueryResult(result);
      case 'compareScenarios':
        return renderComparisonResult(result);
      case 'analyzeBottleneck':
        return renderBottleneckAnalysis(result);
      case 'getStatistics':
        return renderStatistics(result);
      case 'runScenario':
        return renderScenarioResult(result);
      default:
        return <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>;
    }
  };

  const renderQueryResult = (result: QueryResult) => (
    <div className="chatbot-result-table">
      <table>
        <thead>
          <tr>
            {result.metrics.map(metric => (
              <th key={metric}>{metric}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.data.map((row, i) => (
            <tr key={i}>
              {result.metrics.map(metric => (
                <td key={metric}>{formatValue(row[metric])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.summary && (
        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Summary: {result.summary.count} records,
          Mean: {result.summary.mean?.toFixed(2)},
          Range: [{result.summary.min?.toFixed(2)}, {result.summary.max?.toFixed(2)}]
        </div>
      )}
    </div>
  );

  const renderComparisonResult = (result: ComparisonResult) => (
    <div className="chatbot-comparison">
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            {Object.keys(result.scenarios[0]?.metrics || {}).map(metric => (
              <th key={metric}>{metric}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.scenarios.map(scenario => (
            <tr key={scenario.id}>
              <td><strong>{scenario.name}</strong></td>
              {Object.entries(scenario.metrics).map(([metric, value]) => (
                <td key={metric}>{formatValue(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.winner && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid #10b981' }}>
          <strong style={{ color: '#10b981' }}>WINNER:</strong> {result.winner.scenarioId} ({result.winner.metric}: {formatValue(result.winner.value)})
        </div>
      )}
    </div>
  );

  const renderBottleneckAnalysis = (result: BottleneckAnalysis) => (
    <div className="chatbot-bottleneck">
      <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px' }}>
        <strong style={{ color: '#ef4444' }}>PRIMARY BOTTLENECK:</strong> {result.primaryBottleneck}
      </div>
      {result.bottlenecks.map(bottleneck => (
        <div key={bottleneck.resourceId} style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-primary)' }}>{bottleneck.resourceId}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Utilization: {(bottleneck.utilization * 100).toFixed(1)}% - Queue: {bottleneck.queueLength.toFixed(1)} - Impact: {bottleneck.impactScore}/100
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {bottleneck.recommendations.map((rec, i) => (
              <div key={i} style={{ marginTop: '4px', paddingLeft: '12px', borderLeft: '2px solid var(--color-primary)' }}>{rec}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStatistics = (result: any) => (
    <div className="chatbot-statistics">
      <pre style={{ fontSize: '0.85rem', overflow: 'auto', backgroundColor: 'var(--color-bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );

  const renderScenarioResult = (result: any) => (
    <div className="chatbot-scenario-result">
      <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '4px', marginBottom: '10px', color: '#10b981', fontWeight: 600 }}>
        SCENARIO COMPLETED SUCCESSFULLY
      </div>
      {result.results && (
        <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
          <div><strong>Throughput:</strong> {result.results.throughput?.mean?.toFixed(2)} per hour</div>
          <div><strong>Cycle Time:</strong> {result.results.cycleTime?.mean?.toFixed(2)} minutes</div>
          <div><strong>Replications:</strong> {result.results.executiveSummary?.replications}</div>
        </div>
      )}
    </div>
  );

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div
      className="chatbot-sidebar"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '420px',
        height: '100vh',
        backgroundColor: 'var(--color-bg-secondary)',
        borderLeft: '2px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}
    >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em' }}>
                AI ASSISTANT
              </h3>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {system.systemName}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px 10px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s',
                lineHeight: '1',
              }}
              title="Close AI Assistant"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              ×
            </button>
          </div>
          <button
            onClick={handleClearHistory}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              padding: '6px 10px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s',
              width: '100%',
            }}
            title="Clear chat history"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            CLEAR HISTORY
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}>
          {messages.map(message => (
            <div
              key={message.id}
              className={`chatbot-message chatbot-message--${message.role}`}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: message.role === 'user'
                  ? 'var(--color-primary)'
                  : message.metadata?.isError
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'var(--color-bg-tertiary)',
                color: message.role === 'user' ? '#000' : 'var(--color-text-primary)',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                border: message.metadata?.isError ? '1px solid #ef4444' : '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {renderMessageContent(message)}
              <div style={{
                fontSize: '0.65rem',
                color: message.role === 'user' ? 'rgba(0,0,0,0.5)' : 'var(--color-text-secondary)',
                marginTop: '8px',
                opacity: 0.7,
                fontFamily: 'var(--font-mono)',
              }}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chatbot-typing-indicator" style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                padding: '10px 18px',
                backgroundColor: !input.trim() || isLoading ? 'var(--color-bg-tertiary)' : 'var(--color-primary)',
                color: !input.trim() || isLoading ? 'var(--color-text-secondary)' : '#000',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? '···' : 'SEND'}
            </button>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '8px', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            Press ENTER to send | SHIFT+ENTER for new line
          </div>
        </div>
      </div>
  );
}
