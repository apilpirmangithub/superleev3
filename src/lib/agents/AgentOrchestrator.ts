import { IAgent } from "@/types/agents";
import { 
  AgentContext, 
  OrchestratorResult, 
  AgentParseResult,
  AgentHelp
} from "@/types/agents";
import { SwapAgent } from "./SwapAgent";
import { RegisterAgent } from "./RegisterAgent";

/**
 * Orchestrator that manages all agents and routes prompts to the appropriate agent
 */
export class AgentOrchestrator {
  private agents: IAgent[] = [];

  constructor() {
    this.initializeAgents();
  }

  // ===== Public Methods =====

  /**
   * Process a user prompt and route it to the appropriate agent
   */
  async processPrompt(prompt: string, context?: AgentContext): Promise<OrchestratorResult> {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return {
        type: "unknown",
        suggestions: this.getAllHelp()
      };
    }

    // Handle help requests
    if (this.isHelpRequest(trimmedPrompt)) {
      return {
        type: "unknown",
        suggestions: this.getAllHelp()
      };
    }

    // Find capable agents
    const capableAgents = this.findCapableAgents(trimmedPrompt, context);

    if (capableAgents.length === 0) {
      return {
        type: "unknown",
        suggestions: this.getAllHelp()
      };
    }

    if (capableAgents.length === 1) {
      // Single agent can handle this
      const agent = capableAgents[0];
      try {
        const result = await agent.parse(trimmedPrompt, context);
        return {
          type: "handled",
          agent: agent.name,
          result
        };
      } catch (error) {
        console.error(`Error in agent ${agent.name}:`, error);
        return {
          type: "unknown",
          suggestions: [agent.getHelp()]
        };
      }
    }

    // Multiple agents can handle this - choose by priority
    const bestAgent = this.selectBestAgent(capableAgents, trimmedPrompt, context);
    try {
      const result = await bestAgent.parse(trimmedPrompt, context);
      return {
        type: "handled",
        agent: bestAgent.name,
        result
      };
    } catch (error) {
      console.error(`Error in agent ${bestAgent.name}:`, error);
      return {
        type: "ambiguous",
        suggestions: capableAgents.map(agent => agent.getHelp())
      };
    }
  }

  /**
   * Execute an intent using the specified agent
   */
  async executeIntent(
    agentName: string, 
    intent: any, 
    context?: AgentContext
  ): Promise<any> {
    const agent = this.getAgent(agentName);
    if (!agent) {
      throw new Error(`Agent "${agentName}" not found`);
    }

    return agent.execute(intent, context);
  }

  /**
   * Get all available agents
   */
  getAgents(): IAgent[] {
    return [...this.agents];
  }

  /**
   * Get specific agent by name
   */
  getAgent(name: string): IAgent | undefined {
    return this.agents.find(agent => agent.name === name);
  }

  /**
   * Get help for all agents
   */
  getAllHelp(): AgentHelp[] {
    return this.agents.map(agent => agent.getHelp());
  }

  /**
   * Add a new agent to the orchestrator
   */
  addAgent(agent: IAgent): void {
    // Check if agent with same name already exists
    const existingIndex = this.agents.findIndex(a => a.name === agent.name);
    if (existingIndex >= 0) {
      // Replace existing agent
      this.agents[existingIndex] = agent;
    } else {
      // Add new agent
      this.agents.push(agent);
    }

    // Sort by priority (lower number = higher priority)
    this.agents.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove an agent from the orchestrator
   */
  removeAgent(name: string): boolean {
    const index = this.agents.findIndex(agent => agent.name === name);
    if (index >= 0) {
      this.agents.splice(index, 1);
      return true;
    }
    return false;
  }

  // ===== Private Methods =====

  /**
   * Initialize default agents
   */
  private initializeAgents(): void {
    this.addAgent(new SwapAgent());
    this.addAgent(new RegisterAgent());
  }

  /**
   * Check if the prompt is asking for help
   */
  private isHelpRequest(prompt: string): boolean {
    const helpKeywords = [
      "help", "bantuan", "tolong", "gimana", "bagaimana", 
      "cara", "contoh", "example", "apa aja", "what can"
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    return helpKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  /**
   * Find agents that can handle the given prompt
   */
  private findCapableAgents(prompt: string, context?: AgentContext): IAgent[] {
    return this.agents.filter(agent => {
      try {
        return agent.canHandle(prompt, context);
      } catch (error) {
        console.warn(`Error checking capability for agent ${agent.name}:`, error);
        return false;
      }
    });
  }

  /**
   * Select the best agent from multiple capable agents
   */
  private selectBestAgent(
    agents: IAgent[], 
    prompt: string, 
    context?: AgentContext
  ): IAgent {
    // Sort by priority (already sorted in addAgent, but just to be sure)
    const sortedAgents = [...agents].sort((a, b) => a.priority - b.priority);

    // For now, just return the highest priority agent
    // In the future, we could implement more sophisticated selection logic
    // such as confidence scoring, keyword matching strength, etc.
    
    return sortedAgents[0];
  }

  /**
   * Calculate confidence score for an agent handling a specific prompt
   * (Future enhancement for better agent selection)
   */
  private calculateConfidence(
    agent: IAgent, 
    prompt: string, 
    context?: AgentContext
  ): number {
    let confidence = 0;

    const lowerPrompt = prompt.toLowerCase();

    // Check trigger word matches
    const triggerMatches = agent.triggers.filter(trigger => 
      lowerPrompt.includes(trigger.toLowerCase())
    ).length;
    
    confidence += triggerMatches * 0.3;

    // Boost confidence based on context
    if (agent.name === "RegisterAgent" && context?.hasAttachedFile) {
      confidence += 0.4;
    }

    if (agent.name === "SwapAgent" && /(?:>|→|->|\sto\s|\ske\s)/i.test(prompt)) {
      confidence += 0.4;
    }

    // Normalize to 0-1 range
    return Math.min(confidence, 1.0);
  }
}

// Export singleton instance
export const orchestrator = new AgentOrchestrator();
