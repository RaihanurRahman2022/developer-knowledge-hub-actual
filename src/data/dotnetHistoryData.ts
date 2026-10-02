import { Section, Topic } from '../types';

export const dotnetHistorySection: Section = {
  id: 'sec-dotnet-01-history',
  slug: '01-history-and-evolution',
  subjectId: 'subj-dotnet',
  title: '01. History and Evolution',
  order: 1,
  description:
    'Comprehensive evolution of the .NET ecosystem: from the original Windows-only .NET Framework to open-source .NET Core and the unified high-performance Modern .NET platform.',
  topicIds: ['topic-dotnet-framework', 'topic-dotnet-core', 'topic-dotnet-modern'],
};

export const dotnetFrameworkTopic: Topic = {
  id: 'topic-dotnet-framework',
  slug: 'dotnet-framework',
  subjectId: 'subj-dotnet',
  sectionId: 'sec-dotnet-01-history',
  title: '.NET Framework',
  tags: ['.NET Framework', 'CLR', 'BCL', 'WinForms', 'WPF', 'WCF', 'ASP.NET', 'ADO.NET', 'EF6'],
  quickDefinition:
    'The foundational Windows-only managed runtime and application platform (2002–2016) introducing the Common Language Runtime (CLR), Base Class Library (BCL), JIT compilation, and enterprise desktop/web application frameworks.',
  quickRevisionBulletPoints: [
    'Definition: The original Windows-only managed runtime platform created by Microsoft in 2002 to solve DLL Hell, memory corruption, and unmanaged C++ complexity.',
    'Major Versions: 1.0 (2002, CLR 1.0), 2.0 (2005, Generics), 3.0 (2006, WPF/WCF/WF), 3.5 (2007, LINQ & EF1), 4.0 (2010, CLR 4.0 & TPL), 4.5 (2012, async/await), 4.8.1 (2022, final maintenance).',
    'Architecture: Managed code compiled by C#/VB compilers into Microsoft Intermediate Language (MSIL/IL), executed by the CLR via JIT compilation and Generational Garbage Collection.',
    'App Models: Windows Forms (GDI+), WPF (DirectX XAML vector UI), WCF (SOAP enterprise service bus), ASP.NET Web Forms (event-driven page abstraction, ViewState, PostBacks), ASP.NET MVC 1–5, and Web API.',
    'Data Access: Low-level ADO.NET (SqlConnection, SqlCommand, DataReader, DataSet) evolved into LINQ to SQL, then Entity Framework 1–6 (EDMX Model-First to Code First with DbContext).',
    'Core Limitations: Windows-only lock-in, in-place machine-wide OS updates risking regressions, heavy monolithic System.Web tied to IIS worker process (w3wp.exe), slow release cadence.',
    'Successor: Re-architected from the ground up as cross-platform, side-by-side, open-source .NET Core.',
  ],
  coreConceptMarkdown: `### 1. Definition & Core Purpose
**.NET Framework** is Microsoft's original managed software development platform for Microsoft Windows, first launched in February 2002. It provided a managed virtual machine execution environment—the **Common Language Runtime (CLR)**—and a comprehensive **Base Class Library (BCL)** that abstracted the underlying Win32 APIs, file systems, networking, and memory management.

---

### 2. Why It Exists / Problem It Solved
Prior to 2002, Windows software engineering relied on unmanaged C, C++ (MFC, Win32 API), and Visual Basic 6. This era was characterized by critical developer pain points:
- **"DLL Hell":** Shared dynamic-link libraries placed in \`C:\\Windows\\System32\` frequently overwrote one another, causing incompatible binary signatures that crashed unrelated applications.
- **Manual Memory Corruption:** C/C++ developers struggled with buffer overflows, memory leaks, dangling pointers, and unhandled access violations.
- **Language Fragmentation:** C++ and Visual Basic had incompatible type systems, calling conventions, and object lifecycles; interoperability required complex COM (Component Object Model) plumbing.
- **Enterprise Competition:** Sun Microsystems' Java was rapidly gaining enterprise dominance by offering managed memory and cross-platform bytecode.

.NET Framework solved these challenges by introducing **managed code**, type-safe intermediate bytecode, automatic generational garbage collection, and a single Common Type System (CTS) across all .NET languages.

---

### 3. History and Major Versions
The .NET Framework progressed through distinct architectural phases from 2002 to 2022:

| Version | Release Date | CLR Engine | Key Milestones & Features |
| :--- | :--- | :--- | :--- |
| **.NET Framework 1.0 / 1.1** | Feb 2002 / Apr 2003 | CLR 1.0 / 1.1 | Initial launch: C# 1.0, VB.NET, WinForms, Web Forms, ADO.NET, GAC. |
| **.NET Framework 2.0** | Nov 2005 | CLR 2.0 | **Reified Generics** (\`List<T>\` avoiding boxing), nullable value types (\`int?\`), iterators (\`yield return\`), 64-bit CLR. |
| **.NET Framework 3.0** | Nov 2006 | CLR 2.0 | The "Foundation" libraries: **WPF** (XAML desktop UI), **WCF** (SOAP enterprise services), **WF** (Workflows), CardSpace. |
| **.NET Framework 3.5** | Nov 2007 | CLR 2.0 | **LINQ** (Language Integrated Query), lambdas, extension methods, expression trees; SP1 (2008) added **Entity Framework 1.0**. |
| **.NET Framework 4.0** | Apr 2010 | CLR 4.0 | CLR 4 rewrite: Task Parallel Library (TPL), PLINQ, \`dynamic\` keyword, Memory-Mapped Files, MEF. |
| **.NET Framework 4.5 / 4.5.1 / 4.5.2** | Aug 2012–2014 | CLR 4.0 (In-place) | **\`async\` / \`await\`** asynchronous programming, \`HttpClient\`, WebSocket support, RyuJIT 64-bit preview. |
| **.NET Framework 4.6–4.8.1** | 2015–Aug 2022 | CLR 4.0 (In-place) | Roslyn compiler service, RyuJIT production engine, high-DPI Per-Monitor V2, TLS 1.3, final maintenance state (4.8.1). |

---

### 4. CLR, BCL and Architecture
The .NET Framework execution model is stratified into clean functional layers:

\`\`\`
+-------------------------------------------------------------------------+
|                  APPLICATIONS (Desktop / Web / Services)                |
|  WinForms (GDI+)  |  WPF (DirectX)  |  ASP.NET Web Forms / MVC / WCF    |
+-------------------------------------------------------------------------+
|                         BASE CLASS LIBRARY (BCL)                        |
|  System.Web (Tied to IIS)  |  System.Windows.Forms  |  System.Data      |
+-------------------------------------------------------------------------+
|               COMMON LANGUAGE RUNTIME (CLR 1.0 - 4.0)                   |
|  JIT Compiler (x86/x64) | Generational GC | Type Loader | Security Engine |
|  Machine-Wide GAC (Global Assembly Cache) | In-Place Registry Config     |
+-------------------------------------------------------------------------+
|                   HOST: WINDOWS OPERATING SYSTEM ONLY                   |
|          Win32 APIs  *  COM/ActiveX  *  Internet Information Services (IIS) |
+-------------------------------------------------------------------------+
\`\`\`

- **Common Language Runtime (CLR):** The heart of the platform. Responsibilities include loading assemblies, compiling MSIL to native CPU instructions via JIT, allocating and reclaiming memory with a 3-generation Garbage Collector (Gen 0, Gen 1, Gen 2, plus Large Object Heap for objects ≥ 85,000 bytes), enforcing type safety, and managing OS threads.
- **Base Class Library (BCL):** The standardized collection of reusable types providing foundational data structures (\`System.Collections\`), file and stream I/O (\`System.IO\`), threading (\`System.Threading\`), network sockets (\`System.Net\`), and security.
- **Global Assembly Cache (GAC):** A machine-wide repository located at \`C:\\Windows\\Assembly\` (and later \`C:\\Windows\\Microsoft.NET\\assembly\`) that stored strongly named, signed assemblies to facilitate sharing across multiple applications.
- **Compilation Pipeline:** Source code (C#) → Roslyn/CSC compiler → Managed Assembly containing **MSIL** and self-describing **Metadata** → CLR JIT compiler at execution time → Native Machine Code.

---

### 5. Application Models: ASP.NET, WinForms, WPF, WCF
.NET Framework powered diverse workload categories:

#### A. Windows Forms (WinForms)
- Direct managed wrapper over Win32 User32 and GDI+ APIs.
- Visual drag-and-drop designer in Visual Studio, pixel-absolute coordinate layout, and synchronous event-driven programming model (\`btnSubmit_Click\`).
- Fast and lightweight for internal enterprise forms, but struggled with high-DPI screens and complex graphics.

#### B. Windows Presentation Foundation (WPF - Introduced in .NET 3.0)
- Built on top of **DirectX**, enabling vector-based, resolution-independent rendering and hardware acceleration.
- Introduced **XAML** (Extensible Application Markup Language) to decouple visual layout from code-behind.
- Standardized the **MVVM (Model-View-ViewModel)** architectural pattern with rich two-way data binding, dependency properties, control templates, and styling.

#### C. Windows Communication Foundation (WCF - Introduced in .NET 3.0)
- Unified SOAP, WS-* standards, TCP binary remoting, MSMQ messaging, and named pipes into a single enterprise service bus architecture.
- Built on strict tripartite configuration: **ABC (Address, Binding, Contract)**:
  - *Address:* Where the service lives (\`http://...\`, \`net.tcp://...\`).
  - *Binding:* How to communicate (BasicHttpBinding, WsHttpBinding, NetTcpBinding).
  - *Contract:* What operations are exposed (\`[ServiceContract]\`, \`[OperationContract]\`).

#### D. ASP.NET Web Development Evolution
1. **ASP.NET Web Forms (2002):** Created a synthetic stateful abstraction over stateless HTTP. Used **PostBacks** (page forms POSTing back to themselves) and serialized control states into a hidden HTML input field called **\`__VIEWSTATE\`**. This made web development feel like WinForms desktop development, but generated bloated page sizes and made unit testing virtually impossible due to static dependencies on \`HttpContext.Current\`.
2. **ASP.NET MVC (1.0 in 2009 → 5.0 in 2013):** Replaced Web Forms with the Model-View-Controller pattern, full control over HTML markup, clean URL routing, the **Razor view engine** (MVC 3), and testability. However, it was still tightly coupled to \`System.Web.dll\` and the IIS pipeline.
3. **ASP.NET Web API (2012):** Purpose-built framework for building pure RESTful HTTP services consumed by mobile devices and SPAs. Introduced content negotiation (JSON/XML) and early self-hosting through **OWIN (Open Web Interface for .NET)** and Project Katana.

---

### 6. Data Access: ADO.NET and Entity Framework 6
Data persistence in .NET Framework evolved from low-level imperative database commands to high-level declarative ORMs:

1. **ADO.NET (2002):**
   - Disconnected data architecture using \`SqlConnection\`, \`SqlCommand\`, \`SqlDataReader\`, and in-memory relational containers (\`DataSet\`, \`DataTable\`, \`SqlDataAdapter\`).
   - Maximum performance and absolute control over SQL, but required extensive boilerplate mapping code.
2. **LINQ to SQL (2007):**
   - Microsoft's first lightweight ORM targeting Microsoft SQL Server, mapping database tables directly to C# classes with compile-time checked LINQ queries.
3. **Entity Framework 1.0–6.x (2008–2013):**
   - *EF 1.0 to EF 4.0:* Relied on XML-based **EDMX files** (Entity Data Model), mapping Database-First or Model-First schemas through a visual canvas.
   - *EF 4.1 to EF 6.x:* Introduced **Code First** mapping, \`DbContext\`, automatic migrations, and convention-based configuration.
   - *EF 6 (2013):* Reached enterprise maturity with async database queries (\`ToListAsync\`), connection resiliency, interceptors, and custom transaction management. Remains in widespread use for legacy .NET Framework applications.

---

### 7. Advantages and Limitations
#### Key Advantages:
- Rich, battle-tested API surface spanning thousands of enterprise scenarios.
- Deep, zero-overhead integration with Windows OS features (Active Directory, Windows Registry, Event Log, COM).
- High visual productivity with Visual Studio designers for WinForms, WPF, and Web Forms.

#### Critical Limitations:
- **Windows-Only:** Coupled directly to Win32, COM, and IIS; impossible to host natively on Linux servers or in Docker containers.
- **In-Place Machine-Wide Upgrades:** .NET Framework 4.5 through 4.8.1 installed globally on the host operating system. Installing an update changed the shared runtime for every application on that server, creating severe regression risks.
- **Monolithic \`System.Web.dll\`:** Heavyweight assembly deeply married to the IIS worker process (\`w3wp.exe\`), consuming large memory footprints.
- **Slow Release Cadence:** Feature updates were tied to major Windows OS and Visual Studio release cycles.

---

### 8. Evolution to Next Generation (.NET Framework → .NET Core)
Because .NET Framework could not be containerized, trimmed, or run on Linux, Microsoft initiated the ground-up rewrite that became **.NET Core**:
- Replacing the global CLR with a modular, side-by-side **CoreCLR**.
- Replacing \`System.Web\` and IIS with the high-performance in-process **Kestrel** server.
- Decoupling dependencies into fine-grained NuGet packages.`,
  diagrams: [
    {
      id: 'diag-fw-arch',
      title: '.NET Framework CLR & Architecture Stack',
      type: 'architecture',
      content: `+-------------------------------------------------------------------------+
|                  APPLICATIONS (Desktop / Web / Services)                |
|  WinForms (GDI+)  |  WPF (DirectX)  |  ASP.NET Web Forms / MVC / WCF    |
+-------------------------------------------------------------------------+
|                         BASE CLASS LIBRARY (BCL)                        |
|  System.Web (Tied to IIS)  |  System.Windows.Forms  |  System.Data      |
+-------------------------------------------------------------------------+
|               COMMON LANGUAGE RUNTIME (CLR 1.0 - 4.0)                   |
|  JIT Compiler (x86/x64) | Generational GC | Type Loader | Security Engine |
|  Machine-Wide GAC (Global Assembly Cache) | In-Place Registry Config     |
+-------------------------------------------------------------------------+
|                   HOST: WINDOWS OPERATING SYSTEM ONLY                   |
|          Win32 APIs  *  COM/ActiveX  *  Internet Information Services (IIS) |
+-------------------------------------------------------------------------+`,
      caption: 'The monolithic, Windows-bound architecture of the .NET Framework.',
    },
  ],
  codeExamples: [
    {
      title: 'ASP.NET Web Forms vs ADO.NET vs EF6 Comparison',
      language: 'csharp',
      code: `// 1. Classic ASP.NET Web Forms Code-Behind (ViewState & PostBack)
public partial class OrderPage : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack) {
            LoadOrders();
        }
    }

    protected void btnSubmit_Click(object sender, EventArgs e)
    {
        // ViewState stored state in a hidden HTML field across HTTP requests
        int clickCount = (int)(ViewState["ClickCount"] ?? 0) + 1;
        ViewState["ClickCount"] = clickCount;
        lblStatus.Text = "Submitted: " + clickCount;
    }
}

// 2. Direct ADO.NET Imperative Query
using (var conn = new SqlConnection(connectionString))
using (var cmd = new SqlCommand("SELECT Id, Total FROM Orders WHERE CustomerId = @cid", conn))
{
    cmd.Parameters.AddWithValue("@cid", customerId);
    conn.Open();
    using (var reader = cmd.ExecuteReader())
    {
        while (reader.Read()) {
            int id = reader.GetInt32(0);
            decimal total = reader.GetDecimal(1);
        }
    }
}

// 3. Entity Framework 6 (Code First with DbContext)
public class ShopDbContext : DbContext
{
    public ShopDbContext() : base("name=ShopDbConnectionString") { }
    public DbSet<Order> Orders { get; set; }
}

public async Task<List<Order>> GetOrdersAsync(int customerId)
{
    using (var context = new ShopDbContext())
    {
        return await context.Orders
            .Where(o => o.CustomerId == customerId)
            .AsNoTracking()
            .ToListAsync();
    }
}`,
      description: 'The core programming models of the .NET Framework: Web Forms, ADO.NET data access, and Entity Framework 6.',
    },
  ],
  callouts: [
    {
      type: 'warning',
      title: 'Current Maintenance Status of .NET Framework',
      content:
        '.NET Framework 4.8.1 is the final version. It is supported as an operating system component of Windows, but it is strictly in maintenance mode—receiving security and reliability fixes only. No new C# language features beyond C# 7.3 or modern runtime improvements will ever be added.',
    },
  ],
  interviewQuestions: [
    {
      id: 'q-fw-1',
      question: 'What is the difference between the CLR, CTS, and CLS in .NET Framework?',
      shortAnswer:
        'The CLR is the runtime execution engine; the CTS defines all possible data types supported across all languages; the CLS is a subset of the CTS ensuring cross-language interoperability.',
      detailedAnswer:
        '1. **Common Language Runtime (CLR):** The execution engine that executes MSIL bytecode, performs Just-In-Time (JIT) compilation, manages memory via the Garbage Collector, and enforces security.\n2. **Common Type System (CTS):** The formal specification that defines how types (value types, reference types, classes, interfaces, delegates) are declared and represented in memory across all .NET languages.\n3. **Common Language Specification (CLS):** A set of rules and constraints defining a common denominator subset of the CTS. If a public API follows the CLS (e.g., avoiding unsigned integers like `uint` or case-sensitive identifiers), any .NET language (C#, VB.NET, F#) can consume it seamlessly.',
      keyTakeaways: [
        'CLR = Execution engine (JIT, GC, thread pool)',
        'CTS = Universal type system across all .NET languages',
        'CLS = Subset of CTS guaranteeing cross-language interoperability',
      ],
    },
    {
      id: 'q-fw-2',
      question: 'Why did in-place updates of .NET Framework create operational risks for enterprises?',
      shortAnswer:
        'Because .NET Framework was installed globally on the OS, upgrading to a newer version mutated the runtime for all applications on the server, risking unexpected regressions.',
      detailedAnswer:
        '.NET Framework 4.0 was an independent CLR version, but .NET Framework 4.5, 4.6, 4.7, 4.8, and 4.8.1 were machine-wide in-place upgrades replacing the files in `C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319`.\n\nEven though Microsoft maintained backwards compatibility via compatibility quirks, installing a security update or new Framework version on a production Windows Server could subtly change JIT optimizations, security protocols (like TLS defaults), or XML parsers, breaking mission-critical legacy applications hosted on the same box.',
      keyTakeaways: [
        'In-place updates mutate the global OS runtime files',
        'Applications cannot isolate their runtime version independently',
        'Direct driver for .NET Core\'s side-by-side per-application architecture',
      ],
    },
  ],
  checklist: [
    { id: 'c-fw-1', text: 'Explain the CLR execution pipeline (Source → MSIL → JIT → Native Machine Code)' },
    { id: 'c-fw-2', text: 'Understand the difference between WinForms (GDI+) and WPF (DirectX XAML)' },
    { id: 'c-fw-3', text: 'Know why ViewState made Web Forms heavy and non-testable' },
    { id: 'c-fw-4', text: 'Describe the evolution from ADO.NET to Entity Framework 6' },
  ],
  references: [
    {
      id: 'ref-fw-1',
      title: 'The History of .NET - OmniTech',
      url: 'https://omnitech-inc.com/blog/the-history-of-net/',
      source: 'OmniTech Blog',
      type: 'Article',
    },
    {
      id: 'ref-fw-2',
      title: '.NET Framework Architecture Overview',
      url: 'https://learn.microsoft.com/en-us/dotnet/framework/get-started/overview',
      source: 'Microsoft Learn',
      type: 'Official Documentation',
    },
  ],
  relatedTopicIds: ['topic-dotnet-core', 'topic-dotnet-modern'],
  lastUpdated: '2026-10-01',
  isPublished: true,
};

export const dotnetCoreTopic: Topic = {
  id: 'topic-dotnet-core',
  slug: 'dotnet-core',
  subjectId: 'subj-dotnet',
  sectionId: 'sec-dotnet-01-history',
  title: '.NET Core',
  tags: ['.NET Core', 'CoreCLR', 'Kestrel', 'Cross-Platform', 'ASP.NET Core', 'EF Core', '.NET Standard'],
  quickDefinition:
    'The ground-up, open-source, cross-platform rewrite of .NET (2016–2019) engineered for Linux cloud containers, side-by-side per-application isolation, and high-throughput web architectures with Kestrel.',
  quickRevisionBulletPoints: [
    'Definition: An open-source, modular, cross-platform rewrite of .NET initiated by Microsoft on GitHub in 2014 and launched as 1.0 in June 2016.',
    'Why Introduced: To break free from Windows lock-in, enable cloud-native Linux Docker microservices, eliminate machine-wide install coupling, and achieve top-tier I/O performance.',
    'Versions: 1.0/1.1 (2016, CoreCLR, project.json), 2.0/2.1 LTS (2017–18, .NET Standard 2.0, Span<T>, HttpClientFactory), 3.0/3.1 LTS (2019, WinForms/WPF on Core, gRPC, Blazor Server, Worker Services).',
    'Architecture: CoreCLR runtime with Platform Abstraction Layer (PAL), CoreFX modular BCL delivered via NuGet, dotnet CLI, and side-by-side / self-contained deployment.',
    'ASP.NET Core: Complete rewrite without System.Web. Built around Kestrel, composable middleware pipeline, built-in Dependency Injection, and unified ControllerBase.',
    'EF Core: Lightweight, extensible, cross-platform ORM designed from scratch; in 3.0, dropped silent client-side evaluation to enforce performant SQL.',
    'Desktop on Core: .NET Core 3.0 ported Windows Forms and WPF to Core (Windows-only), unlocking side-by-side deployment and modern runtime speed for desktop.',
    'Limitations: Three-way ecosystem fragmentation (Framework vs Core vs Mono/Xamarin) and complex .NET Standard compatibility matrix, leading to Modern .NET unification.',
  ],
  coreConceptMarkdown: `### 1. Definition & Core Purpose
**.NET Core** is a modular, high-performance, open-source, and cross-platform reimplementation of the .NET runtime and libraries. First announced in late 2014 and officially launched in June 2016, it was designed from the ground up to run on Linux, macOS, and Windows.

---

### 2. Why .NET Core Was Introduced
By 2014, the software industry had undergone a tectonic shift:
1. **Linux Dominated Cloud Infrastructure:** Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure were predominantly hosting workloads on Linux virtual machines.
2. **Containerization & Docker:** Microservice architectures required small, stateless, disposable container images that booted in milliseconds. .NET Framework was locked to massive Windows Server installations.
3. **Open-Source Standard:** Modern developers expected their platform, runtime, and compilers to be fully open source on GitHub with transparent engineering and rapid release cycles.
4. **Performance Imperative:** Monolithic \`System.Web.dll\` was too resource-intensive to compete with lightweight frameworks in Go, Node.js, and Java Netty.

Microsoft recognized that patching .NET Framework was impossible without breaking millions of legacy enterprise lines of code. Therefore, Microsoft initiated a clean-slate rewrite on GitHub under the .NET Foundation.

---

### 3. Version Evolution (.NET Core 1.0–3.1)
\`\`\`
.NET Core 1.0 (2016) ────────► .NET Core 2.0/2.1 (2017-18) ────────► .NET Core 3.0/3.1 LTS (2019)
 • CoreCLR & CoreFX on GitHub   • .NET Standard 2.0 (32K+ APIs)       • WinForms & WPF on Core (Windows)
 • Kestrel in-process server    • Span<T> zero-allocation memory      • System.Text.Json, gRPC, Blazor Server
 • project.json (later csproj)  • HttpClientFactory, SignalR, Razor   • ASP.NET Core leaves Framework behind
\`\`\`

- **.NET Core 1.0 & 1.1 (June 2016):**
  - First public release featuring the **CoreCLR** runtime, CoreFX libraries, and the unified **\`dotnet\` CLI** (\`dotnet new\`, \`build\`, \`run\`, \`publish\`).
  - Initially used JSON-based project files (\`project.json\`), which proved difficult for MSBuild interop and was replaced by modern SDK-style \`.csproj\` in 2.0.
  - The API surface was deliberately small, causing porting friction for existing enterprise libraries.
- **.NET Core 2.0 & 2.1 LTS (Aug 2017 – May 2018):**
  - The major turning point: introduced **.NET Standard 2.0**, more than doubling the shared API surface to over 32,000 APIs and adding compatibility shims for .NET Framework NuGet packages.
  - Introduced high-performance memory primitives: **\`Span<T>\`** and **\`Memory<T>\`** for zero-allocation memory slicing.
  - Added **\`IHttpClientFactory\`** to solve socket exhaustion and DNS caching bugs, rewritten **SignalR**, and **Razor Pages**.
- **.NET Core 3.0 & 3.1 LTS (Sep 2019 – Dec 2019):**
  - Added Windows desktop support (**Windows Forms** and **WPF** running on .NET Core).
  - Introduced high-performance **\`System.Text.Json\`**, native **gRPC** contracts over HTTP/2, **Blazor Server**, and **Worker Services** (\`BackgroundService\`).
  - Decisive architectural break: ASP.NET Core 3.0+ completely stopped supporting .NET Framework, running exclusively on .NET Core.

---

### 4. Cross-Platform Architecture
.NET Core introduced a modern, isolated runtime architecture:

\`\`\`
+-------------------------------------------------------------------------+
|                  APPLICATIONS (Cross-Platform & Windows)                |
|  ASP.NET Core Web APIs | Worker Services | Console | WinForms & WPF (Win) |
+-------------------------------------------------------------------------+
|                    CORE LIBRARIES (CoreFX / NuGet Packages)             |
|   Microsoft.Extensions (DI, Config, Logging) | System.Text.Json | Span<T> |
+-------------------------------------------------------------------------+
|                           CORECLR RUNTIME                               |
|   Tiered JIT (RyuJIT) | Cross-Platform GC | Lightweight Exception Engine |
|   Platform Abstraction Layer (PAL) - Windows, Linux, macOS               |
+-------------------------------------------------------------------------+
|                  OPERATING SYSTEM & CONTAINER RUNTIMES                  |
|    Linux (Ubuntu / Alpine / RHEL)   *   macOS   *   Windows   *   Docker    |
+-------------------------------------------------------------------------+
\`\`\`

- **Platform Abstraction Layer (PAL):** CoreCLR abstracts operating system specifics (threads, virtual memory, file descriptors) through the PAL, enabling identical execution semantics on Linux glibc, Alpine musl, macOS, and Windows.
- **Side-by-Side Per-App Deployment:** Applications can be deployed as **Framework-dependent** (using an installed runtime on the machine) or **Self-contained** (bundling the exact CoreCLR runtime and libraries inside the application directory). Upgrading one app cannot break any other app on the server.
- **RyuJIT & Tiered Compilation:** Introduced tiered JIT compilation in 3.0: Tier 0 generates fast, unoptimized code for quick startup; hot methods recompile at Tier 1 with aggressive optimization.

---

### 5. ASP.NET Core and EF Core
Both web and data access were rewritten from first principles:

#### A. ASP.NET Core
- **No System.Web:** Completely eliminated \`System.Web.dll\` and the IIS pipeline.
- **Kestrel Web Server:** An in-process, asynchronous, event-driven HTTP server capable of serving millions of requests per second.
- **Composable Middleware Pipeline:** Requests pass through an explicit, ordered sequence of middleware delegates (\`app.Use(...)\`), each deciding whether to pass execution to \`next()\` or short-circuit.
- **Built-in Dependency Injection:** First-class container with \`Transient\`, \`Scoped\`, and \`Singleton\` lifetimes baked into the generic host.
- **Layered Configuration:** Seamlessly merges \`appsettings.json\`, environment variables, User Secrets, and command-line arguments.

#### B. Entity Framework Core (EF Core)
- Ground-up rewrite of EF6 designed to be lightweight, modular, and cloud-friendly.
- Supported non-relational providers (like Azure Cosmos DB) alongside SQL Server, PostgreSQL (Npgsql), and SQLite.
- **EF Core 3.0 Breaking Change:** Discontinued silent client-side evaluation. In older versions, LINQ queries that could not be translated to SQL would silently fetch entire database tables into RAM; in EF Core 3.0+, untranslatable queries threw an immediate exception.

---

### 6. WinForms and WPF Support in .NET Core 3.0
In .NET Core 3.0, Microsoft open-sourced and ported Windows Forms and WPF to .NET Core (\`Microsoft.WindowsDesktop.App\`):
- **Still Windows-Only:** WinForms and WPF on .NET Core continue to rely on native Windows graphics APIs (GDI+ and DirectX) and do not run on Linux or macOS.
- **Major Benefits for Desktop Developers:**
  1. Access to modern C# 8 language features (nullable reference types, async streams).
  2. Substantial runtime performance and memory allocation improvements.
  3. **Self-contained desktop executables:** Applications could be deployed with their own runtime, ending dependence on machine-wide .NET Framework updates.
  4. Single-file publishing bundling all DLLs into a single \`.exe\`.

---

### 7. Limitations of .NET Core
Despite its success, .NET Core introduced its own architectural pain points:
1. **The Three-Runtime Split:** Developers had to maintain separate codebases and skills across three different .NET runtimes:
   - *.NET Framework:* Windows enterprise applications and legacy IIS systems.
   - *.NET Core:* Cross-platform cloud services and microservices.
   - *Mono / Xamarin:* Mobile apps (iOS and Android) and game scripting (Unity).
2. **The .NET Standard Tax:** Sharing code required targeting **.NET Standard** (an API contract specification). Navigating compatibility matrices (e.g., .NET Standard 2.0 vs 2.1) created confusion.
3. **Brand Confusion:** The name ".NET Core" caused many enterprise decision-makers to view it as an incomplete subset of .NET Framework.

This paved the way for the ultimate unification in **Modern .NET (.NET 5+)**.`,
  diagrams: [
    {
      id: 'diag-core-pipe',
      title: 'ASP.NET Core Middleware Pipeline',
      type: 'architecture',
      content: `+-------------------------------------------------------------------------+
|                  HTTP REQUEST FROM CLIENT (HTTP/1.1 or HTTP/2)          |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                    KESTREL IN-PROCESS WEB SERVER                        |
|       Asynchronous Sockets Pipeline * Native Non-Blocking I/O           |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                 ORDERED COMPOSABLE MIDDLEWARE PIPELINE                  |
|   1. Exception Handler / Developer Exception Page                       |
|   2. HTTPS Redirection                                                  |
|   3. Static Files (short-circuits if file matches)                      |
|   4. Routing (Endpoint Routing - selects endpoint metadata)             |
|   5. Authentication (identifies user ClaimsPrincipal)                   |
|   6. Authorization (evaluates policy requirements)                      |
|   7. Endpoint Execution (Controller / Razor Page / gRPC service)        |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                  HTTP RESPONSE FLOWS BACK OUT THROUGH MIDDLEWARE        |
+-------------------------------------------------------------------------+`,
      caption: 'The asynchronous, in-process request processing pipeline of ASP.NET Core.',
    },
  ],
  codeExamples: [
    {
      title: 'ASP.NET Core 3.1 Startup with Middleware & Dependency Injection',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

public class Startup
{
    // 1. Service Registration: Configure the built-in DI container
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddControllers();
        
        // Registering lifetimes
        services.AddTransient<ITransientService, TransientService>(); // New per resolve
        services.AddScoped<IOrderService, OrderService>();             // One per HTTP request
        services.AddSingleton<ICacheService, MemoryCacheService>();    // One per app lifetime
    }

    // 2. HTTP Pipeline: Configure the sequential middleware chain
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment()) {
            app.UseDeveloperExceptionPage();
        }

        app.UseHttpsRedirection();
        app.UseRouting(); // Endpoint routing selects target endpoint early

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(endpoints => {
            endpoints.MapControllers();
        });
    }
}`,
      description: 'The standard Startup.cs pattern in .NET Core 3.1 defining dependency injection and middleware chaining.',
    },
  ],
  callouts: [
    {
      type: 'info',
      title: 'What Was .NET Standard?',
      content:
        '.NET Standard was not an executable runtime—it was a formal specification of API signatures (like a C# interface). If a library targeted .NET Standard 2.0, it could run on .NET Framework 4.6.1+, .NET Core 2.0+, and Xamarin. With the unified release of .NET 5+, .NET Standard is obsolete for new development.',
    },
  ],
  interviewQuestions: [
    {
      id: 'q-core-1',
      question: 'What is a "Captive Dependency" in .NET Core Dependency Injection?',
      shortAnswer:
        'A captive dependency occurs when a service with a longer lifetime (e.g., Singleton) holds a reference to a service with a shorter lifetime (e.g., Scoped), trapping it in memory.',
      detailedAnswer:
        'In ASP.NET Core DI, **Scoped** services (like `DbContext`) are intended to be created once per HTTP request and disposed when the request ends.\n\nIf a **Singleton** service injects a Scoped service through its constructor, that Scoped service is kept alive forever as a "captive". This causes two critical production bugs:\n1. **Thread-Safety Violations:** `DbContext` is not thread-safe. Multiple simultaneous HTTP requests calling the Singleton will access the same `DbContext` concurrently, causing `InvalidOperationException` crashes.\n2. **Stale Data & Memory Leaks:** The trapped `DbContext` never clears its change tracker, accumulating memory and returning stale cached entity instances.\n\nIn Development mode, ASP.NET Core validates scopes and throws an exception on startup if a captive dependency is detected.',
      keyTakeaways: [
        'Singleton injecting Scoped = Captive Dependency bug',
        'Leads to DbContext concurrency crashes and memory leaks',
        'ASP.NET Core DI validates scopes automatically in Development mode',
      ],
    },
    {
      id: 'q-core-2',
      question: 'Why did EF Core 3.0 remove silent client-side evaluation?',
      shortAnswer:
        'Silent client-side evaluation caused massive hidden performance bugs where queries that could not translate to SQL silently downloaded whole tables into memory.',
      detailedAnswer:
        'In EF Core 2.x, if part of a LINQ query could not be translated into SQL (such as a custom C# method call in the `Where` clause), EF Core would execute the translatable portion in the database and silently stream all resulting rows into application RAM to evaluate the remainder in memory.\n\nIn production, developers frequently wrote queries they assumed were executing on the database index, only to discover their servers were downloading hundreds of thousands of rows over the network.\n\nEF Core 3.0 made this a hard compile-time/runtime error: if an expression cannot be translated into SQL, EF Core throws an exception immediately unless the developer explicitly calls `.AsEnumerable()` or `.ToList()`.',
      keyTakeaways: [
        'Prevented silent downloading of entire database tables into RAM',
        'Enforced explicit developer intent when memory evaluation is needed',
        'Crucial breaking change to know when migrating from .NET Core 2.x to 3.x',
      ],
    },
  ],
  checklist: [
    { id: 'c-core-1', text: 'Understand why .NET Core was rewritten on GitHub as open source' },
    { id: 'c-core-2', text: 'Explain how Kestrel and the middleware pipeline process HTTP requests' },
    { id: 'c-core-3', text: 'Master the three DI lifetimes (Transient, Scoped, Singleton)' },
    { id: 'c-core-4', text: 'Know why .NET Core 3.0 was the turning point for desktop applications' },
  ],
  references: [
    {
      id: 'ref-core-1',
      title: 'Announcing .NET Core 1.0',
      url: 'https://devblogs.microsoft.com/dotnet/announcing-net-core-1-0/',
      source: 'Microsoft .NET Blog',
      type: 'Official Documentation',
    },
    {
      id: 'ref-core-2',
      title: 'The History of .NET - OmniTech',
      url: 'https://omnitech-inc.com/blog/the-history-of-net/',
      source: 'OmniTech Blog',
      type: 'Article',
    },
  ],
  relatedTopicIds: ['topic-dotnet-framework', 'topic-dotnet-modern'],
  lastUpdated: '2026-10-01',
  isPublished: true,
};

export const dotnetModernTopic: Topic = {
  id: 'topic-dotnet-modern',
  slug: 'dotnet-modern',
  subjectId: 'subj-dotnet',
  sectionId: 'sec-dotnet-01-history',
  title: 'Modern .NET',
  tags: ['Modern .NET', '.NET 10', '.NET 8', 'Minimal APIs', 'Blazor', 'Native AOT', 'MAUI', 'Aspire', 'C# 14'],
  quickDefinition:
    'The unified, single-ecosystem platform (.NET 5 through .NET 10 LTS and .NET 11) delivering predictable yearly releases, Native AOT compilation, Minimal APIs, .NET MAUI cross-platform UI, and industry-leading runtime performance.',
  quickRevisionBulletPoints: [
    'Definition: The single unified .NET platform starting with .NET 5 (2020), dropping "Core" and skipping version 4 to avoid confusion with .NET Framework 4.x.',
    'Unified Ecosystem: Merged CoreCLR, CoreFX, and Mono into a single BCL and toolchain powering Cloud, Web, Desktop (WPF, WinForms, WinUI), Mobile (.NET MAUI), Gaming, and AI.',
    'Versions & Cadence: Yearly November releases. Even versions are LTS (3 years: .NET 6, .NET 8, .NET 10). Odd versions are STS (.NET 7, .NET 9, .NET 11). Current LTS is .NET 10 (supported to Nov 2028).',
    'Modern C#: C# 9 (records, top-level statements), C# 10 (global usings), C# 11 (raw strings, generic math), C# 12 (primary ctors, collection expressions), C# 13 (params collections, Lock), C# 14 (field keyword, extension members).',
    'Performance: Dynamic Profile-Guided Optimization (Dynamic PGO) on by default, DATAS dynamic GC heap sizing, vectorization (AVX-512/AVX10), and zero-allocation memory pipelines.',
    'Deployment: Native AOT (sub-10ms startup, ~15MB RAM, no JIT), secure-by-default non-root container images (port 8080), and single-file publish.',
    'Web & Cloud: Minimal APIs, unified Blazor Web App (InteractiveServer, InteractiveWebAssembly, InteractiveAuto), and .NET Aspire cloud-native orchestration.',
    'Migration Horizon: .NET 8 LTS and .NET 9 STS both reach End of Support on November 10, 2026. Enterprise teams must migrate to .NET 10 LTS.',
  ],
  coreConceptMarkdown: `### 1. Definition & The Great Unification
**Modern .NET** refers to the unified, single-ecosystem developer platform that began with **.NET 5 in November 2020** and continues through the current **.NET 10 LTS** and **.NET 11**. 

By dropping the word "Core" and skipping version 4 (to eliminate any confusion with .NET Framework 4.x), Microsoft declared Modern .NET as the single, go-forward runtime, compiler, and class library for every workload:

\`\`\`
                          UNIFIED MODERN .NET PLATFORM
+-------------------------------------------------------------------------------+
|   CLOUD / WEB    |    DESKTOP     |      MOBILE      |   GAMING   |    AI     |
| Minimal APIs     | WPF & WinForms | .NET MAUI        | Unity      | Semantic  |
| Blazor Web App   | .NET MAUI      | (iOS / Android)  | Godot      | Kernel    |
| gRPC / Aspire    | (WinUI / Mac)  | Native bindings  | Monogame   | Agents    |
+-------------------------------------------------------------------------------+
|                       UNIFIED BASE CLASS LIBRARY (BCL)                        |
|   Collections * IO * JSON * Logging * Dependency Injection * System.Numerics  |
+-------------------------------------------------------------------------------+
|                         UNIFIED RUNTIME (CoreCLR)                             |
| Dynamic PGO * Tiered RyuJIT * Server GC / DATAS * Native AOT Ahead-of-Time    |
+-------------------------------------------------------------------------------+
|                  ONE SDK * ONE TOOLCHAIN * C# 14 / C# 15                      |
+-------------------------------------------------------------------------------+
\`\`\`

---

### 2. .NET 5–10 Evolution & Release Cadence
Modern .NET follows a strict, predictable cadence: a new major version ships every November at **.NET Conf**.
- **LTS (Long Term Support):** Even-numbered versions (.NET 6, .NET 8, .NET 10) receive **3 years** of official enterprise support.
- **STS (Standard Term Support):** Odd-numbered versions (.NET 7, .NET 9, .NET 11) receive support until 6 months after the subsequent release (extended to 24 months starting with .NET 9).

| Version | Release Date | Support Lifecycle | Signature Architectural Innovations |
| :--- | :--- | :--- | :--- |
| **.NET 5** | Nov 2020 | STS | Unification release. Dropped "Core", C# 9 records, source generators, single-file publish, Arm64 optimizations. |
| **.NET 6** | Nov 2021 | LTS (Ended Nov 2024) | **Minimal APIs**, modern \`WebApplication\` host builder, hot reload, C# 10, DateOnly/TimeOnly, Dynamic PGO preview. |
| **.NET 7** | Nov 2022 | STS (Ended May 2024) | Generic math (\`INumber<T>\`), built-in rate limiting middleware, output caching, Native AOT preview for console apps. |
| **.NET 8** | Nov 2023 | **LTS (Ends 10 Nov 2026)** | **Native AOT for ASP.NET Core**, **Dynamic PGO enabled by default**, unified Blazor Web App, keyed DI, port 8080 non-root containers, Aspire preview. |
| **.NET 9** | Nov 2024 | **STS (Ends 10 Nov 2026)** | **HybridCache**, built-in OpenAPI generation, DATAS dynamic GC heap sizing, complete removal of \`BinaryFormatter\`. |
| **.NET 10** | Nov 2025 | **Current LTS (Nov 2028)** | C# 14 (\`field\` keyword, extension members), passkeys in Identity, EF Core named query filters, native container publishing. |
| **.NET 11** | Nov 2026 | STS (RC1 Sep 2026) | **Runtime Async** (runtime-native async state), C# 15 union types, Zstandard compression, raised CPU instruction baselines. |

---

### 3. Unified Platform & Target Framework Monikers (TFMs)
Modern .NET completely eliminated the confusion of .NET Standard. All libraries and applications now target uniform, descriptive TFMs in their \`.csproj\`:
- \`net10.0\`: Universal code running on any operating system, cloud container, or architecture.
- \`net10.0-windows\`: Unlocks Windows-specific APIs (WinForms, WPF, Windows Registry).
- \`net10.0-android\` / \`net10.0-ios\`: Native mobile application targets compiled via **.NET MAUI**.
- \`net10.0-maccatalyst\`: Native macOS desktop applications.

---

### 4. Modern C# Evolution
The C# programming language evolved in lockstep with the runtime:
- **C# 9 (.NET 5):** **Records** (immutable value-equality data shapes), \`init\`-only properties, top-level statements, and pattern matching enhancements.
- **C# 10 (.NET 6):** Global using directives, file-scoped namespaces (\`namespace MyProject;\`), record structs, and interpolated string improvements.
- **C# 11 (.NET 7):** Raw string literals (\`"""...\` preserving quotes/indentation), required members (\`required string Name\`), list patterns, and generic math via static abstract interface members.
- **C# 12 (.NET 8):** **Primary constructors** for classes and structs (\`public class UserService(IUserRepository repo)\`), **collection expressions** (\`int[] x = [1, 2, 3];\`), and default lambda parameters.
- **C# 13 (.NET 9):** \`params\` collections (supporting \`ReadOnlySpan<T>\`), new high-performance \`System.Threading.Lock\` object, and \`ref struct\` interface implementations.
- **C# 14 (.NET 10):** The **\`field\` keyword** in auto-properties (\`get; set => field = value?.Trim();\`), extension members (properties and static extensions), and null-conditional assignment (\`?.=\`).
- **C# 15 (.NET 11 RC):** First-class **Union types** (discriminated unions) and closed type hierarchies.

---

### 5. Performance and Deployment Improvements
Modern .NET routinely matches or outperforms C++ and Rust in web and I/O benchmarks:

1. **Dynamic Profile-Guided Optimization (Dynamic PGO):**
   Enabled by default in .NET 8+. The JIT compiler instruments code at Tier 0, monitors actual production execution branches and types, and recompiles hot methods at Tier 1 with aggressive **devirtualization** and method inlining.
   *Industry Evidence:* Microsoft's Bing search workflow execution engine cited Dynamic PGO as the single largest contributor to latency reductions and server density savings.
2. **DATAS (Dynamic Adaptation To Application Sizes):**
   Introduced in .NET 9 for Server GC. Traditional Server GC aggressively reserved memory; DATAS automatically scales heap counts up and down based on instantaneous application demand, reducing cloud memory costs by up to 30%.
3. **Native Ahead-of-Time (Native AOT) Compilation:**
   Compiles C# directly into native machine code (ELF on Linux, PE on Windows, Mach-O on macOS) with **zero JIT compilation** and no runtime IL interpreter.
   - *Startup Time:* Under 10 milliseconds.
   - *Memory Footprint:* ~15MB base memory.
   - *Security:* No executable memory pages generated at runtime.
4. **Cloud-Native Containers:**
   Official .NET container images default to a secure non-root user and listen on port **8080** rather than privileged port 80. The .NET SDK can publish container images directly to Docker registries without requiring a Dockerfile (\`dotnet publish /t:PublishContainer\`).

---

### 6. Modern Web, Desktop, and Cloud Workloads
#### A. Minimal APIs & ASP.NET Core
Allows building ultra-fast microservice endpoints with minimal boilerplate, full OpenAPI document generation, and zero controller overhead.

#### B. Unified Blazor Web App (.NET 8+)
Combines server-side rendering and WebAssembly into a single project supporting **per-component render modes**:
- *Static SSR:* Fast initial HTML rendering with zero WebAssembly download.
- *InteractiveServer:* Real-time interactivity over SignalR WebSockets.
- *InteractiveWebAssembly:* Client-side execution in browser WebAssembly.
- *InteractiveAuto:* Opens instantly via Server WebSockets while caching WASM assets in the background, transitioning to client execution on repeat visits.

#### C. .NET MAUI (Multi-platform App UI)
The cross-platform successor to Xamarin.Forms. Allows developers to write a **single C# and XAML codebase** that compiles natively to Android, iOS, macOS (Mac Catalyst), and Windows (WinUI 3).

#### D. .NET Aspire
An opinionated, cloud-native stack for building observable, resilient distributed applications. Wires up service discovery, health check endpoints, OpenTelemetry traces/metrics, and resilience policies (Polly v8), complete with a local developer dashboard.

---

### 7. Migration and Compatibility
Enterprise migration to Modern .NET requires understanding the support horizon:
- **Critical Support Deadline:** Both **.NET 8 (LTS)** and **.NET 9 (STS)** reach End of Support on **November 10, 2026**.
- **Target .NET 10 LTS:** All enterprise applications on .NET 8 or .NET 9 should migrate directly to .NET 10 LTS (supported through November 2028).
- **Migration from .NET Framework 4.8:**
  1. Use the **.NET Upgrade Assistant** or Visual Studio Modernization tooling.
  2. Port class libraries first, replacing obsolete Windows APIs (WCF server → CoreWCF or gRPC; Web Forms → Blazor or Razor Pages).
  3. Replace \`BinaryFormatter\` with \`System.Text.Json\` (BinaryFormatter was completely removed in .NET 9 due to remote code execution vulnerabilities).`,
  diagrams: [
    {
      id: 'diag-modern-aot',
      title: 'Modern .NET Native AOT vs JIT Compilation Flow',
      type: 'architecture',
      content: `TRADITIONAL JIT COMPILATION PIPELINE:
  C# Source ──► [ Roslyn ] ──► [ IL Assembly ] ──► [ JIT Compiler (Tier 0 & Tier 1) ] ──► Native CPU Code
  (Higher startup latency, runtime memory for JIT, requires dynamic code generation)

NATIVE AOT COMPILATION PIPELINE (.NET 8+):
  C# Source ──► [ Roslyn ] ──► [ IL Linker / Trimmer ] ──► [ ILC Native AOT Compiler ] ──► Standalone Native Binary
  (Sub-10ms startup, ~15MB RAM, hardened against code injection, zero JIT overhead)`,
      caption: 'Comparison between traditional JIT execution and Modern .NET Native AOT.',
    },
  ],
  codeExamples: [
    {
      title: 'Modern Minimal API with C# 14 & Native AOT (.NET 10)',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateSlimBuilder(args); // Optimized for Native AOT

// Built-in HybridCache (.NET 9+) and domain services
builder.Services.AddHybridCache();
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

app.UseHttpsRedirection();

// Clean route-to-lambda with typed results and parameter binding
app.MapGet("/api/orders/{id:guid}", async (Guid id, IOrderService svc) =>
    await svc.GetOrderAsync(id) is OrderDto order 
        ? TypedResults.Ok(order) 
        : TypedResults.NotFound())
.WithName("GetOrder")
.WithSummary("Fetches an order by its unique ID");

app.Run();

// C# 12+ record with primary constructor
public record OrderDto(Guid Id, string CustomerEmail, decimal Total, string Status);
public interface IOrderService { Task<OrderDto?> GetOrderAsync(Guid id); }`,
      description: 'An idiomatic Modern .NET 10 Minimal API with Native AOT support, HybridCache, and typed results.',
    },
  ],
  callouts: [
    {
      type: 'danger',
      title: 'Hard Deadline: .NET 8 & .NET 9 End of Support',
      content:
        '.NET 8 (LTS) and .NET 9 (STS) both reach End of Support on November 10, 2026. Because STS support was expanded to 24 months, both versions share the exact same end date. Plan upgrades directly to .NET 10 LTS.',
    },
  ],
  interviewQuestions: [
    {
      id: 'q-mod-1',
      question: 'Why did Microsoft drop "Core" and skip version 4 in .NET 5?',
      shortAnswer:
        'Microsoft dropped "Core" to signify that it is the single unified platform going forward, and skipped version 4 to avoid confusion with .NET Framework 4.x.',
      detailedAnswer:
        'Between 2016 and 2020, developers had to distinguish between ".NET Framework" and ".NET Core". To communicate that this is no longer an alternative fork but the one and only future of .NET, Microsoft unified the branding to simply ".NET".\n\nVersion 4.0 was intentionally skipped because .NET Framework 4.x (4.0 through 4.8) had existed for a decade. Jumping directly from .NET Core 3.1 to .NET 5 made it immediately clear to developers, management, and enterprises that .NET 5 was newer than both .NET Core 3.1 and .NET Framework 4.8.',
      keyTakeaways: [
        'Dropped "Core" to indicate platform unification',
        'Skipped version 4 to avoid collision with .NET Framework 4.x',
        'Established the yearly November release cadence',
      ],
    },
    {
      id: 'q-mod-2',
      question: 'What is Dynamic PGO, and why was it so impactful for hyperscale systems like Microsoft Bing?',
      shortAnswer:
        'Dynamic PGO allows the JIT to gather real-time execution statistics on hot methods and recompile them with aggressive devirtualization and inlining, unlocking C++ tier speeds.',
      detailedAnswer:
        'Traditional JIT compilers compile code blindly without knowing how it will behave under real load. With Dynamic Profile-Guided Optimization (Dynamic PGO):\n1. Methods initially compile at Tier 0 with lightweight profiling stubs.\n2. The runtime observes which conditional branches are taken 99% of the time and which concrete classes implement polymorphic interface calls.\n3. The Tier 1 JIT recompiles hot methods using that telemetry—replacing indirect virtual method lookups with direct inlined calls (devirtualization) and unrolling hot loops.\n\nMicrosoft Bing reported that Dynamic PGO was the single most impactful feature in .NET 8, reducing hardware cluster sizes and driving double-digit throughput gains without code changes.',
      keyTakeaways: [
        'Enabled by default in .NET 8+',
        'Eliminates virtual dispatch overhead via devirtualization',
        'Proves that managed runtimes with runtime PGO can rival ahead-of-time compiled native code',
      ],
    },
  ],
  checklist: [
    { id: 'c-mod-1', text: 'Explain the November LTS/STS release cadence and support end dates' },
    { id: 'c-mod-2', text: 'Describe how Minimal APIs differ from traditional MVC controllers' },
    { id: 'c-mod-3', text: 'Understand Native AOT trade-offs (instant startup vs reflection trimming)' },
    { id: 'c-mod-4', text: 'Know the 4 Blazor render modes in modern .NET' },
  ],
  references: [
    {
      id: 'ref-mod-1',
      title: 'What\'s new in .NET 10',
      url: 'https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview',
      source: 'Microsoft Learn',
      type: 'Official Documentation',
    },
    {
      id: 'ref-mod-2',
      title: 'What\'s new in .NET 11',
      url: 'https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-11/overview',
      source: 'Microsoft Learn',
      type: 'Official Documentation',
    },
  ],
  relatedTopicIds: ['topic-dotnet-framework', 'topic-dotnet-core'],
  lastUpdated: '2026-10-01',
  isPublished: true,
};

export const initialDotnetHistorySections: Section[] = [dotnetHistorySection];
export const initialDotnetHistoryTopics: Topic[] = [
  dotnetFrameworkTopic,
  dotnetCoreTopic,
  dotnetModernTopic,
];
