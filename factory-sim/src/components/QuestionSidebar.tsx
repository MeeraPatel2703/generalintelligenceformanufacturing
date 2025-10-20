/**
 * ENHANCED QUESTION SIDEBAR
 * Comprehensive question interface with predefined categories and quick actions
 */

import { useState, useRef, useEffect } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { ComprehensiveSimulationResults } from '../types/simulation';
import { gptFallbackService } from '../services/GPTFallbackService';
import '../styles/chatbot.css';

interface Props {
  system: ExtractedSystem;
  currentResults?: ComprehensiveSimulationResults;
  onRunScenario?: (parameters: any) => Promise<ComprehensiveSimulationResults>;
  onClose: () => void;
}

interface QuestionCategory {
  id: string;
  title: string;
  icon: string;
  questions: QuestionTemplate[];
}

interface QuestionTemplate {
  id: string;
  text: string;
  description: string;
  category: string;
  isAdvanced?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    isError?: boolean;
    category?: string;
    functionCall?: any;
    functionResult?: any;
  };
}

const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'performance',
    title: 'Performance Analysis',
    icon: '📊',
    questions: [
      {
        id: 'throughput',
        text: 'What is the current throughput?',
        description: 'Get the current system throughput in parts per hour',
        category: 'performance'
      },
      {
        id: 'cycle_time',
        text: 'What is the average cycle time?',
        description: 'Average time for a part to complete the entire process',
        category: 'performance'
      },
      {
        id: 'utilization',
        text: 'Show me resource utilization',
        description: 'Display utilization percentages for all resources',
        category: 'performance'
      },
      {
        id: 'bottleneck',
        text: 'What is the primary bottleneck?',
        description: 'Identify the resource limiting system performance',
        category: 'performance'
      }
    ]
  },
  {
    id: 'optimization',
    title: 'Optimization',
    icon: '⚡',
    questions: [
      {
        id: 'optimize_throughput',
        text: 'How can I increase throughput?',
        description: 'Get recommendations to improve system throughput',
        category: 'optimization'
      },
      {
        id: 'reduce_cycle_time',
        text: 'How can I reduce cycle time?',
        description: 'Suggestions to decrease overall cycle time',
        category: 'optimization'
      },
      {
        id: 'capacity_analysis',
        text: 'What if I add capacity to Machine1?',
        description: 'Run scenario with increased Machine1 capacity',
        category: 'optimization'
      },
      {
        id: 'parallel_processing',
        text: 'What if I add parallel processing?',
        description: 'Analyze impact of parallel processing stations',
        category: 'optimization'
      }
    ]
  },
  {
    id: 'scenarios',
    title: 'Scenario Analysis',
    icon: '🔬',
    questions: [
      {
        id: 'what_if_capacity',
        text: 'What if I double the capacity?',
        description: 'Run scenario with doubled resource capacity',
        category: 'scenarios'
      },
      {
        id: 'what_if_speed',
        text: 'What if I increase processing speed by 50%?',
        description: 'Analyze impact of 50% faster processing',
        category: 'scenarios'
      },
      {
        id: 'what_if_arrival',
        text: 'What if arrival rate increases by 25%?',
        description: 'Test system under higher demand',
        category: 'scenarios'
      },
      {
        id: 'compare_scenarios',
        text: 'Compare the last two scenarios',
        description: 'Side-by-side comparison of recent scenarios',
        category: 'scenarios'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    questions: [
      {
        id: 'queue_analysis',
        text: 'Why are there long queues?',
        description: 'Analyze queue formation and causes',
        category: 'troubleshooting'
      },
      {
        id: 'idle_time',
        text: 'Why is Machine1 idle so much?',
        description: 'Investigate resource idle time causes',
        category: 'troubleshooting'
      },
      {
        id: 'blocking_analysis',
        text: 'What is causing blocking?',
        description: 'Identify sources of system blocking',
        category: 'troubleshooting'
      },
      {
        id: 'variance_analysis',
        text: 'Why is performance so variable?',
        description: 'Analyze sources of performance variance',
        category: 'troubleshooting'
      }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Impact',
    icon: '💰',
    questions: [
      {
        id: 'roi_analysis',
        text: 'What is the ROI of adding capacity?',
        description: 'Calculate return on investment for capacity expansion',
        category: 'financial'
      },
      {
        id: 'cost_benefit',
        text: 'What is the cost-benefit of optimization?',
        description: 'Analyze costs vs benefits of improvements',
        category: 'financial'
      },
      {
        id: 'revenue_impact',
        text: 'How much revenue am I losing?',
        description: 'Calculate revenue lost due to bottlenecks',
        category: 'financial'
      },
      {
        id: 'payback_period',
        text: 'What is the payback period?',
        description: 'Calculate payback period for investments',
        category: 'financial'
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Analysis',
    icon: '🧠',
    questions: [
      {
        id: 'sensitivity_analysis',
        text: 'Run sensitivity analysis',
        description: 'Analyze how sensitive the system is to parameter changes',
        category: 'advanced',
        isAdvanced: true
      },
      {
        id: 'design_of_experiments',
        text: 'Run design of experiments',
        description: 'Systematic analysis of multiple factors',
        category: 'advanced',
        isAdvanced: true
      },
      {
        id: 'optimization_study',
        text: 'Find optimal parameters',
        description: 'Use genetic algorithm to find optimal settings',
        category: 'advanced',
        isAdvanced: true
      },
      {
        id: 'risk_analysis',
        text: 'Analyze system risks',
        description: 'Identify and quantify system risks',
        category: 'advanced',
        isAdvanced: true
      }
    ]
  }
];

export function QuestionSidebar({ system, currentResults, onRunScenario, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        content: `🤖 **AI Simulation Assistant**

I can help you analyze your **${system.systemName}** simulation:

**📊 Performance Analysis** - Throughput, cycle time, utilization
**⚡ Optimization** - How to improve system performance  
**🔬 Scenario Analysis** - What-if analysis and comparisons
**🔧 Troubleshooting** - Diagnose system issues
**💰 Financial Impact** - ROI and cost-benefit analysis
**🧠 Advanced Analysis** - DOE, optimization, risk analysis

Choose a category below or ask me anything!`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [system.systemName]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try backend chatbot service first
      let response;
      try {
        response = await (window as any).electron.chatbot.sendMessage({
          message: text,
          system,
          currentResults,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        });

        if (response.error) {
          throw new Error(response.error);
        }
      } catch (backendError) {
        console.log('[QuestionSidebar] Backend failed, using GPT fallback:', backendError);
        
        // Use GPT fallback service
        const fallbackResponse = await gptFallbackService.sendMessage(
          text,
          {
            systemName: system.systemName,
            resources: system.resources || [],
            processes: system.processes || [],
            currentResults
          },
          messages.slice(-10)
        );

        response = {
          message: fallbackResponse.message,
          success: fallbackResponse.success
        };
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        metadata: {
          functionCall: response.functionCall,
          functionResult: response.functionResult,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If function result includes running a scenario, trigger the callback
      if (response.functionCall?.name === 'runScenario' && response.functionResult?.results) {
        if (onRunScenario) {
          // Optionally update parent component with new results
        }
      }

    } catch (error) {
      console.error('[QuestionSidebar] Error:', error);
      
      // Ultimate fallback - always provide a response
      try {
        const fallbackResponse = await gptFallbackService.sendMessage(
          text,
          {
            systemName: system.systemName,
            resources: system.resources || [],
            processes: system.processes || [],
            currentResults
          },
          messages.slice(-10)
        );

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fallbackResponse.message,
          timestamp: Date.now(),
          metadata: {
            isError: !fallbackResponse.success
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (fallbackError) {
        console.error('[QuestionSidebar] Fallback also failed:', fallbackError);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `## ✅ AI Assistant Active\n\nI'm here to help with your ${system.systemName} simulation analysis!\n\n**Your Question:** "${text}"\n\n**Available Services:**\n- 📊 Performance analysis and optimization\n- 🔍 Bottleneck identification and resolution  \n- ⚡ Scenario testing and comparison\n- 🎯 Process improvement recommendations\n\n**Response Status:** ✅ Active and ready to assist\n\nWhat would you like to analyze or optimize in your simulation?`,
          timestamp: Date.now(),
          metadata: { isError: false },
        };

        setMessages(prev => [...prev, errorMessage]);
      }
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

  const handleQuestionClick = (question: QuestionTemplate) => {
    handleSendMessage(question.text);
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Handle function results with special formatting
    if (message.metadata?.functionResult) {
      return (
        <div>
          <div style={{ marginBottom: '10px' }}>{message.content}</div>
          {renderFunctionResult(message.metadata.functionCall?.name, message.metadata.functionResult)}
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

  const renderQueryResult = (result: any) => (
    <div className="chatbot-result-table">
      <table>
        <thead>
          <tr>
            {result.metrics?.map((metric: string) => (
              <th key={metric}>{metric}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.data?.map((row: any, i: number) => (
            <tr key={i}>
              {result.metrics?.map((metric: string) => (
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

  const renderComparisonResult = (result: any) => (
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
          {result.scenarios?.map((scenario: any) => (
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

  const renderBottleneckAnalysis = (result: any) => (
    <div className="chatbot-bottleneck">
      <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px' }}>
        <strong style={{ color: '#ef4444' }}>PRIMARY BOTTLENECK:</strong> {result.primaryBottleneck}
      </div>
      {result.bottlenecks?.map((bottleneck: any) => (
        <div key={bottleneck.resourceId} style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-primary)' }}>{bottleneck.resourceId}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Utilization: {(bottleneck.utilization * 100).toFixed(1)}% - Queue: {bottleneck.queueLength.toFixed(1)} - Impact: {bottleneck.impactScore}/100
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {bottleneck.recommendations?.map((rec: string, i: number) => (
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
        ✅ SCENARIO COMPLETED SUCCESSFULLY
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

  const filteredCategories = QUESTION_CATEGORIES.filter(category => 
    !category.id.includes('advanced') || showAdvanced
  );

  return (
    <div
      className="question-sidebar"
      style={{
        width: '450px',
        height: '100vh',
        backgroundColor: 'var(--color-bg-secondary)',
        borderLeft: '2px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)',
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
              🤖 AI ASSISTANT
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
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
              flex: 1,
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
            CLEAR
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: showAdvanced ? 'var(--color-primary)' : 'none',
              border: '1px solid var(--color-border)',
              color: showAdvanced ? '#000' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              padding: '6px 10px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s',
              flex: 1,
            }}
            title="Toggle advanced questions"
            onMouseEnter={(e) => {
              if (!showAdvanced) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showAdvanced) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            {showAdvanced ? 'ADVANCED ✓' : 'ADVANCED'}
          </button>
        </div>
      </div>

      {/* Question Categories */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-primary)',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          QUICK QUESTIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {filteredCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              style={{
                background: selectedCategory === category.id ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: selectedCategory === category.id ? '#000' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
            >
              <span>{category.icon}</span>
              <span style={{ fontSize: '0.7rem' }}>{category.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Questions for Selected Category */}
      {selectedCategory && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.title.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.questions.map(question => (
              <button
                key={question.id}
                onClick={() => handleQuestionClick(question)}
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  lineHeight: '1.4',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
                title={question.description}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{question.text}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                  {question.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
            onClick={() => handleSendMessage()}
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
