/**
 * Standard Markdown Template for Article Details & Notes.
 * Uses ### headings for automatic section splitting by the markdown parser.
 */
export const ARTICLE_MARKDOWN_TEMPLATE = `### 1. Definition & Core Purpose
**[Topic Title]** is [concise, authoritative definition of the technology, architecture, or pattern].

At its core, it provides [fundamental capability] and serves as [primary role in the software system].

---

### 2. Why It Exists / Problem It Solves
Prior to this, developers and architectures faced significant challenges:
- **[Challenge 1 / Legacy Pain Point]:** [Detailed explanation of why previous solutions were inefficient, unsafe, or difficult to maintain].
- **[Challenge 2 / Operational Friction]:** [How this caused bugs, performance bottlenecks, or downtime in production].

**[Topic Title]** was introduced to solve these problems by:
1. [Core solution mechanism 1]
2. [Core solution mechanism 2]
3. [Core solution mechanism 3]

---

### 3. How It Works & Architecture Flow
The execution flow and internal lifecycle operate through distinct phases:

\`\`\`text
[ Client / Input ] ──► [ Pipeline / Engine ] ──► [ Component Processing ] ──► [ Output / Execution ]
\`\`\`

Key architectural components:
1. **[Component A]:** [Role and runtime behavior]
2. **[Component B]:** [Memory management, queuing, or compilation]
3. **[Component C]:** [State management and termination]

---

### 4. Code Examples & Real-World Implementations
Below is a production-grade implementation illustrating proper configuration and usage:

\`\`\`csharp
// Example: Idiomatic production implementation
using System;
using System.Threading;
using System.Threading.Tasks;

public sealed class ProcessManager
{
    private readonly ILogger _logger;

    public ProcessManager(ILogger logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ProcessResult> ExecuteAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting execution for request {RequestId}", requestId);
        
        // Execute business logic with non-blocking async
        await Task.Delay(100, cancellationToken);
        
        return new ProcessResult(Success: true, Message: "Completed successfully");
    }
}

public readonly record struct ProcessResult(bool Success, string Message);
\`\`\`

---

### 5. Advantages and Limitations
| Key Advantages & Strengths | Limitations & Architectural Trade-offs |
| :--- | :--- |
| **High Performance:** Minimal allocations and fast throughput. | **Complexity:** Requires understanding of underlying lifecycle. |
| **Type Safety:** Compile-time checking prevents runtime errors. | **Tooling / Dependencies:** Requires modern SDK toolchains. |
| **Maintainability:** Clear separation of concerns and testability. | **Learning Curve:** Team discipline needed to avoid anti-patterns. |

---

### 6. Evolution Across .NET Versions
| Release / Era | Key Changes & Milestones |
| :--- | :--- |
| **.NET Framework 4.x** | Legacy implementation; monolithic and machine-wide execution. |
| **.NET Core 1.0–3.1** | Re-architected as open-source, modular, and cross-platform on Linux/macOS. |
| **Modern .NET (.NET 8/9/10 LTS)** | Native AOT compatibility, Dynamic PGO, zero-allocation Span<T> optimizations. |

---

### 7. Common Mistakes & Best Practices
- **Mistake 1: [Common Anti-Pattern]**
  - *Symptom:* [Memory leak, thread starvation, or concurrency crash].
  - *Best Practice:* [Use the recommended idiomatic pattern].
- **Mistake 2: [Configuration or Lifecycle Mismatch]**
  - *Symptom:* [Captive dependency, unhandled socket exhaustion].
  - *Best Practice:* [Register with correct lifetime or use factory patterns].

---

### 8. Technical Interview Questions & Answers
**Q1: [High-Frequency Conceptual Interview Question]**
- **30-Second Summary Answer:** [Direct, crisp explanation suitable for a rapid technical screen].
- **Detailed Technical Answer:** [Nuanced discussion including runtime mechanics, threading, and architectural trade-offs].

**Q2: [Scenario-Based / Production Incident Question]**
- **30-Second Summary Answer:** [Root cause diagnosis approach and primary mitigation].
- **Detailed Technical Answer:** [Step-by-step diagnostic workflow using telemetry, profiling tools, and structural fixes].

---

### 9. Official Documentation & References
- [Microsoft Learn Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [Source Code on GitHub (.NET Runtime)](https://github.com/dotnet/runtime)

---

### 10. Quick Revision Summary (30-60 Seconds)
- [Pivotal architectural takeaway 1]
- [Core rule or lifetime constraint to remember 2]
- [Primary performance pitfall to avoid 3]
- [Modern .NET best practice 4]
`;

/**
 * AI Agent Prompt template for generating complete articles
 * matching the exact structure required by the knowledge hub.
 */
export function getAgentPrompt(topicName: string = '[Topic Name]'): string {
  return `You are a Principal Software Engineer authoring a definitive, production-grade technical article for the topic "${topicName}" in an Engineering Knowledge Base.

Please output ONLY the Markdown content according to the exact template below.

CRITICAL FORMATTING RULES:
1. Use "### 1.", "### 2.", etc. for each major section heading so the parser automatically splits them into discrete sections.
2. In Section "### 8. Technical Interview Questions & Answers":
   - Format each question header exactly as: **Q1: [Question text]**, **Q2: [Question text]**, etc.
   - For answers, use:
     * **30-Second Summary Answer:** [Concise elevator pitch]
     * **Detailed Technical Answer:** [In-depth architectural & runtime nuances]
     * **Interviewer Tip:** [Optional pro-tip]
   - Following this exact format allows the reader to automatically render each question as an interactive, collapsible accordion!
3. Ensure code blocks are written in idiomatic, modern C# (C# 12/14) with syntax highlighting (\`\`\`csharp).
4. Separate sections with horizontal rules (---).
5. Output pure Markdown only. Do not include introductory conversational pleasantries.

---

${ARTICLE_MARKDOWN_TEMPLATE.replace(/\[Topic Title\]/g, topicName)}`;
}
