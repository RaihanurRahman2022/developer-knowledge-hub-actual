import { Section, Topic } from '../types';

interface SectionDefinition {
  num: string;
  title: string;
  description: string;
  topics: {
    title: string;
    description: string;
    points: string[];
  }[];
}

const curriculumDefinitions: SectionDefinition[] = [
  {
    num: '02',
    title: '02. .NET Architecture and Fundamentals',
    description: 'The execution model, Intermediate Language, compilation pipeline, memory management, and runtime components.',
    topics: [
      {
        title: 'C# → IL → JIT → Native Machine Code',
        description: 'The multi-stage compilation model from source code to intermediate bytecode to JIT native execution.',
        points: [
          'Roslyn compiler converts C# source code into Microsoft Intermediate Language (MSIL / IL) and metadata.',
          'Common Language Runtime (CLR) loads assemblies and verifies IL type safety at runtime.',
          'RyuJIT Just-In-Time compiler translates IL to machine instructions tailored to host CPU architecture (x64, Arm64).',
          'Tiered compilation balances instant cold startup (Tier 0) with peak steady-state optimization (Tier 1 PGO).',
        ],
      },
      {
        title: 'CLR, CTS, CLS and BCL',
        description: 'Core execution engine, type specifications, language interoperability rules, and standard class libraries.',
        points: [
          'Common Language Runtime (CLR) provides memory management, thread scheduling, and exception handling.',
          'Common Type System (CTS) specifies how data types are declared, represented, and handled across all languages.',
          'Common Language Specification (CLS) defines cross-language interoperability rules for public member contracts.',
          'Base Class Library (BCL) provides universal fundamental types, collections, I/O streams, and networking APIs.',
        ],
      },
      {
        title: 'Assemblies, DLLs and EXEs',
        description: 'Packaging units of deployment, manifests, PE file formats, and dependency resolution.',
        points: [
          'Assemblies are the fundamental units of deployment, versioning, security, and scope in .NET.',
          'Executable assemblies (.exe) contain an application entry point; libraries (.dll) export reusable types.',
          'Assembly manifest contains metadata describing identity, version, culture, and required dependencies.',
          'Modern .NET uses SDK-style projects and dynamic AssemblyLoadContext for isolated runtime loading.',
        ],
      },
      {
        title: 'NuGet and Package Management',
        description: 'Ecosystem package resolution, central package management, lock files, and security auditing.',
        points: [
          'NuGet is the official package manager delivering reusable modular libraries across the .NET ecosystem.',
          'PackageReference directly in .csproj replaces packages.config with transitive dependency resolution.',
          'Central Package Management (Directory.Packages.props) standardizes package versions across multi-project solutions.',
          'NuGet audit scans dependency graphs during build for known Common Vulnerabilities and Exposures (CVEs).',
        ],
      },
      {
        title: 'Garbage Collection and Memory Management',
        description: 'Generational garbage collection (Gen 0/1/2, LOH, POH), allocation paths, and heap management.',
        points: [
          'Automatic tracing Garbage Collector classifies objects into Generation 0 (short-lived), Gen 1, and Gen 2.',
          'Large Object Heap (LOH) holds objects >= 85,000 bytes; Pinned Object Heap (POH) holds unmovable memory buffers.',
          'Workstation GC optimizes for client responsiveness; Server GC allocates per-core heaps for maximum throughput.',
          'Modern .NET 9+ DATAS dynamically adapts heap counts and memory footprints based on instantaneous load.',
        ],
      },
      {
        title: 'Managed vs Unmanaged Code',
        description: 'CLR-managed memory safety vs native Win32/C++ memory, P/Invoke, and SafeHandles.',
        points: [
          'Managed code executes under the CLR with automatic garbage collection, bounds checking, and type verification.',
          'Unmanaged code (C, C++, Win32, COM) manages memory manually with raw pointers and direct operating system calls.',
          'Platform Invoke (P/Invoke) and DllImport marshal types across managed and unmanaged boundaries.',
          'SafeHandle encapsulates unmanaged OS handles (file descriptors, sockets) preventing memory leaks during finalization.',
        ],
      },
    ],
  },
  {
    num: '03',
    title: '03. Project Structure and Configuration',
    description: 'Solution and project file architecture, environment-based configuration, and dependency hierarchies.',
    topics: [
      {
        title: 'Solution (.sln) and Project (.csproj)',
        description: 'Container files for multi-project architecture and MSBuild SDK-style declarative definitions.',
        points: [
          'Solution file (.sln) groups related projects for build coordination and IDE solution management.',
          'SDK-style .csproj uses clean, declarative XML without explicit file inclusion lists.',
          'Directory.Build.props and Directory.Build.targets share common properties across entire repositories.',
          'Solution Explorer visualizes logical project dependencies and compilation order.',
        ],
      },
      {
        title: 'Program.cs and Entry Point',
        description: 'The bootstrap file configuring the host, dependency injection, and middleware in modern applications.',
        points: [
          'WebApplication.CreateBuilder initializes configuration, logging, and dependency injection services.',
          'Top-level statements eliminate Main() boilerplate while compiling into the standard entry point method.',
          'app.Build() transitions from service registration to the immutable execution pipeline.',
          'app.Run() starts the listening server and blocks the main thread until shutdown is triggered.',
        ],
      },
      {
        title: 'appsettings.json and appsettings.{Environment}.json',
        description: 'Layered JSON configuration with environment-specific overrides.',
        points: [
          'appsettings.json defines baseline configuration keys across all hosting environments.',
          'appsettings.{Environment}.json overrides specific keys for Development, Staging, or Production.',
          'Environment detection relies on the DOTNET_ENVIRONMENT or ASPNETCORE_ENVIRONMENT environment variable.',
          'Hierarchical JSON sections map cleanly to strongly typed C# Options classes.',
        ],
      },
      {
        title: 'launchSettings.json',
        description: 'Local developer machine profiles, environment variables, and debug server ports.',
        points: [
          'Configures local execution profiles for Visual Studio, VS Code, and dotnet run.',
          'Defines applicationUrl (HTTP/HTTPS ports), commandName (Project or IISExpress), and environment variables.',
          'Never deployed to production servers or bundled into published deployment artifacts.',
          'Enables easy switching between multiple debug profiles during local development.',
        ],
      },
      {
        title: 'global.json and NuGet.config',
        description: 'Pinning .NET SDK versions and configuring private or public NuGet feeds.',
        points: [
          'global.json locks the exact .NET SDK version across developers and CI/CD build agents.',
          'NuGet.config specifies package source URLs (e.g., public nuget.org, Azure Artifacts, GitHub Packages).',
          'Package source mapping prevents dependency confusion attacks by restricting packages to trusted feeds.',
          'Ensures reproducible builds and consistent compiler behavior across all development machines.',
        ],
      },
      {
        title: 'web.config, wwwroot, and Properties Folders',
        description: 'IIS reverse proxy integration, web root static files, and project properties.',
        points: [
          'web.config configures the ASP.NET Core Module (ANCM) when hosted behind IIS on Windows.',
          'wwwroot is the default web root directory for serving public static assets (CSS, JavaScript, images).',
          'MapStaticAssets in modern .NET optimizes static asset delivery with build-time compression and fingerprinting.',
          'Properties folder contains launchSettings.json and assembly attribute manifests.',
        ],
      },
      {
        title: 'Target Frameworks and SDK Selection',
        description: 'Target Framework Monikers (TFMs), multi-targeting, and SDK workloads.',
        points: [
          'Target Framework Monikers (e.g., net8.0, net10.0) declare the API surface available to the project.',
          'Platform-specific TFMs (e.g., net10.0-windows, net10.0-android) unlock platform-native OS APIs.',
          'Multi-targeting (<TargetFrameworks>net8.0;net10.0</TargetFrameworks>) compiles libraries for multiple runtime versions.',
          '.NET SDK workloads install optional components like MAUI, WebAssembly, and Android SDKs on demand.',
        ],
      },
      {
        title: 'User Secrets and Environment Variables',
        description: 'Protecting sensitive development credentials and container environment overrides.',
        points: [
          'User Secrets stores sensitive API keys and connection strings outside project directories in the user profile.',
          'Prevents accidental commit of database passwords and secret tokens into public git repositories.',
          'Environment variables override JSON configuration in Docker containers and Kubernetes pods.',
          'Double underscore (__) syntax in environment variables represents hierarchical JSON configuration keys.',
        ],
      },
      {
        title: 'Configuration Provider Precedence',
        description: 'The strict hierarchical evaluation order of configuration sources in the generic host.',
        points: [
          'Configuration is evaluated sequentially: later providers overwrite values set by earlier providers.',
          'Default order: appsettings.json → appsettings.{Environment}.json → User Secrets (Dev) → Environment Variables → CLI args.',
          'CommandLine arguments have the highest precedence, allowing runtime overrides during container launch.',
          'IConfiguration provides hierarchical key-value lookups with indexer syntax (config["Section:Key"]).',
        ],
      },
    ],
  },
  {
    num: '04',
    title: '04. Application Startup and Execution',
    description: 'Application bootstrapper, generic host lifecycles, and startup patterns.',
    topics: [
      {
        title: 'Main Method, Top-Level Statements, and Host Builder',
        description: 'How the C# compiler generates the entry point and WebApplication initializes the host.',
        points: [
          'Top-level statements simplify Program.cs while compiling under the hood into the standard Main() method.',
          'WebApplication.CreateBuilder(args) preconfigures DI, layered configuration, and structured logging.',
          'Generic Host unifies background worker services, console applications, and web applications.',
          'Decouples service registration (builder.Services) from request pipeline configuration (app.Use).',
        ],
      },
      {
        title: 'Build() and Run() Lifecycle',
        description: 'The two distinct phases of application initialization: construction and execution.',
        points: [
          'builder.Build() builds the service provider container and freezes service registration permanently.',
          'Prevents runtime modification of dependencies after the application has started processing traffic.',
          'app.Run() starts all registered IHostedService instances and begins listening for HTTP requests.',
          'Gracefully handles termination signals (SIGINT, SIGTERM) to ensure clean shutdown.',
        ],
      },
      {
        title: 'Program.cs vs Legacy Startup.cs',
        description: 'The evolution from two-file hosting in .NET Core 2/3 to minimal hosting in modern .NET.',
        points: [
          'Startup.cs separated ConfigureServices() and Configure() into distinct methods in a dedicated class.',
          'Modern .NET 6+ minimal hosting combines both into a single linear, readable Program.cs file.',
          'Both models compile to the exact same runtime dependency injection container and middleware pipeline.',
          'Legacy Startup classes can still be referenced using builder.Host.ConfigureWebHostDefaults(web => web.UseStartup<Startup>()).',
        ],
      },
      {
        title: 'Application Lifetime and Graceful Shutdown',
        description: 'Handling termination signals, draining in-flight requests, and IHostApplicationLifetime.',
        points: [
          'IHostApplicationLifetime exposes cancellation tokens for ApplicationStarted, ApplicationStopping, and ApplicationStopped.',
          'When shutdown is signaled, the host stops accepting new requests and allows in-flight requests to complete.',
          'Hosted services receive CancellationToken to stop background loops and release resources gracefully.',
          'Prevents database corruption and message broker drops during Kubernetes pod restarts and deployments.',
        ],
      },
    ],
  },
  {
    num: '05',
    title: '05. Hosting and Web Servers',
    description: 'Kestrel web server internals, reverse proxies, and operating system hosting architectures.',
    topics: [
      {
        title: 'What a Host and Web Server Do',
        description: 'Separation of responsibilities between hosting process, HTTP server, and application pipeline.',
        points: [
          'The host manages the application lifecycle, configuration, logging, and dependency injection container.',
          'The web server listens on a network port, parses incoming HTTP requests, and creates HttpContext objects.',
          'The web server passes HttpContext down the middleware pipeline and sends the generated response back to the socket.',
          'Modern .NET applications run as standalone executable processes that host the web server in-process.',
        ],
      },
      {
        title: 'Kestrel Architecture and Configuration',
        description: 'High-performance asynchronous networking, socket transports, and HTTP/1.1, HTTP/2, HTTP/3 support.',
        points: [
          'Kestrel is the cross-platform, asynchronous, high-throughput default web server in modern .NET.',
          'Built on managed System.IO.Pipelines to achieve zero-copy socket parsing and minimal GC allocations.',
          'Supports modern web protocols natively: HTTP/1.1, HTTP/2 multiplexing, and HTTP/3 over QUIC.',
          'Configurable via code (builder.WebHost.ConfigureKestrel) or declarative appsettings.json server limits.',
        ],
      },
      {
        title: 'In-Process vs Out-of-Process Hosting & IIS',
        description: 'Hosting inside the IIS worker process vs running as a reverse-proxied standalone process.',
        points: [
          'ASP.NET Core Module (ANCM) integrates ASP.NET Core applications into Internet Information Services (IIS).',
          'In-Process hosting runs the application inside the IIS worker process (w3wp.exe), bypassing network hops.',
          'Out-of-Process hosting runs the application in a standalone dotnet.exe process with IIS acting as a reverse proxy.',
          'In-Process hosting delivers significantly higher throughput and lower request latency on Windows Server.',
        ],
      },
      {
        title: 'Reverse Proxies and Forwarded Headers',
        description: 'Using Nginx, YARP, or Kubernetes Ingress in front of Kestrel and preserving client IP/schemes.',
        points: [
          'In enterprise production, Kestrel is typically fronted by a reverse proxy (Nginx, YARP, Envoy, Cloudflare).',
          'Reverse proxies terminate TLS certificates, handle DDoS mitigation, and distribute load across microservices.',
          'ForwardedHeadersMiddleware reads X-Forwarded-For and X-Forwarded-Proto to reconstruct original client IPs and URLs.',
          'Misconfigured forwarded headers causes authentication redirects and HTTPS enforcement to fail.',
        ],
      },
    ],
  },
  {
    num: '06',
    title: '06. HTTP Request Pipeline',
    description: 'The middleware execution pipeline, routing, model binding, and request lifecycle.',
    topics: [
      {
        title: 'HTTP Request Lifecycle and Middleware Chain',
        description: 'How HttpContext travels through an ordered chain of middleware delegates.',
        points: [
          'Every request is represented by an HttpContext containing Request, Response, User, and Items dictionaries.',
          'Middleware components are executed in the exact order they are registered via app.Use() in Program.cs.',
          'Each middleware can execute logic before invoking next(), after next() returns, or short-circuit immediately.',
          'Short-circuiting (e.g., returning a cached response or authentication failure) skips downstream middleware.',
        ],
      },
      {
        title: 'Routing and Endpoint Routing',
        description: 'Decoupling URL route matching from endpoint execution for early metadata access.',
        points: [
          'Endpoint routing splits request processing into two phases: matching (UseRouting) and executing (UseEndpoints).',
          'Matching assigns an Endpoint to the HttpContext containing route values and authorization metadata.',
          'Downstream middleware (Authentication, CORS, Rate Limiting) can inspect endpoint metadata before execution.',
          'Supports route constraints, regex validation, default parameter values, and catch-all path parameters.',
        ],
      },
      {
        title: 'Model Binding and Validation',
        description: 'Extracting data from route parameters, query strings, headers, and request bodies into C# models.',
        points: [
          'Model binding maps incoming HTTP data into strongly typed C# action parameters and DTO records.',
          'Data attributes ([FromRoute], [FromQuery], [FromBody], [FromHeader]) explicitly specify binding sources.',
          'DataAnnotations ([Required], [MaxLength], [EmailAddress]) perform automatic validation during binding.',
          'In API controllers, [ApiController] automatically generates standardized 400 Bad Request ProblemDetails.',
        ],
      },
      {
        title: 'Filters and Endpoint Filters',
        description: 'MVC action filters, authorization filters, and modern Minimal API endpoint filters.',
        points: [
          'MVC filter pipeline executes: Authorization → Resource → Action → Exception → Result filters.',
          'Minimal API endpoint filters (AddEndpointFilter) allow cross-cutting logic around lambda endpoints.',
          'Ideal for logging execution duration, validating business preconditions, and transforming output data.',
          'Filters execute inside the routing scope and have access to controller actions and model arguments.',
        ],
      },
    ],
  },
  {
    num: '07',
    title: '07. Dependency Injection and Application Design',
    description: 'Inversion of Control, object lifetimes, and dependency injection architectural patterns.',
    topics: [
      {
        title: 'IoC and Dependency Injection Lifetimes',
        description: 'Transient, Scoped, and Singleton service lifecycles and registration semantics.',
        points: [
          'Inversion of Control (IoC) delegates object instantiation to a centralized container.',
          'Transient (AddTransient): A new instance is created every time the service is requested from DI.',
          'Scoped (AddScoped): A single instance is created per client request or IServiceScope boundary.',
          'Singleton (AddSingleton): A single instance is created on first request and shared across the entire application.',
        ],
      },
      {
        title: 'Captive Dependencies and Lifetime Mismatches',
        description: 'The critical bug where longer-lived services trap shorter-lived dependencies in memory.',
        points: [
          'Occurs when a Singleton service injects a Scoped service (such as DbContext) via its constructor.',
          'The Scoped dependency becomes trapped in memory for the life of the Singleton, violating its intended lifecycle.',
          'Leads to multithreading concurrency exceptions, stale entity caching, and severe memory leaks.',
          'ASP.NET Core DI validates scopes and throws an InvalidOperationException at startup in Development mode.',
        ],
      },
      {
        title: 'Options Pattern and IOptions Variants',
        description: 'Strongly typed configuration binding using IOptions, IOptionsSnapshot, and IOptionsMonitor.',
        points: [
          'The Options pattern binds hierarchical configuration sections to strongly typed C# classes.',
          'IOptions<T>: Registered as a Singleton; values are read once at startup and never change.',
          'IOptionsSnapshot<T>: Registered as Scoped; recomputed on every request for per-request configuration updates.',
          'IOptionsMonitor<T>: Registered as a Singleton; listens for file change events and supports real-time notifications.',
        ],
      },
      {
        title: 'Service Locator Anti-Pattern and Keyed Services',
        description: 'Why injecting IServiceProvider is discouraged and how .NET 8 keyed services resolve ambiguity.',
        points: [
          'Service Locator anti-pattern injects IServiceProvider and resolves dependencies imperatively via GetService().',
          'Obscures actual class dependencies, circumvents compile-time checking, and hinders unit testing.',
          'Constructor injection explicitly advertises all required dependencies in the class signature.',
          'Modern .NET 8+ Keyed Services (AddKeyedSingleton) allow registering multiple implementations with unique string keys.',
        ],
      },
    ],
  },
  {
    num: '08',
    title: '08. C# Language and OOP',
    description: 'Core type system, modern C# language features, asynchronous patterns, and OOP principles.',
    topics: [
      {
        title: 'Value Types vs Reference Types',
        description: 'Stack vs heap allocation, struct semantics, records, and memory layout.',
        points: [
          'Value types (structs, primitives, enums) hold their data directly and are typically allocated inline on the stack.',
          'Reference types (classes, strings, delegates) store a pointer on the stack pointing to an object on the managed heap.',
          'Boxing copies a value type into an object container on the heap; unboxing extracts the value back out.',
          'Record types provide compiler-generated value-based equality, non-destructive mutation (with), and clean syntax.',
        ],
      },
      {
        title: 'OOP Principles, Abstract Classes, and Interfaces',
        description: 'Encapsulation, inheritance, polymorphism, abstraction, and contract design.',
        points: [
          'Encapsulation hides internal state and exposes behavior through properties and methods.',
          'Polymorphism allows derived classes to override base class virtual members at runtime.',
          'Abstract classes provide shared implementation and state; interfaces declare pure behavioral contracts.',
          'Modern C# supports default interface methods, static abstract members, and explicit interface implementations.',
        ],
      },
      {
        title: 'Generics, Constraints, and Collections',
        description: 'Reified generics, type safety, performance, and standard collection architectures.',
        points: [
          'Generics allow classes, interfaces, and methods to operate on parameterized types with zero runtime boxing.',
          '.NET uses reified generics: runtime preserves exact type information (unlike Java type erasure).',
          'Generic constraints (where T : class, new(), struct) enforce capabilities on generic arguments.',
          'Choose collections wisely: List<T> for dynamic sizing, Dictionary<TKey, TValue> for O(1) lookups.',
        ],
      },
      {
        title: 'Delegates, Events, Lambdas, and LINQ',
        description: 'Type-safe function pointers, event-driven architectures, and Language Integrated Query.',
        points: [
          'Delegates are type-safe object-oriented function pointers (Action<T>, Func<T, TResult>, Predicate<T>).',
          'Events implement the publish-subscribe pattern with thread-safe invocation lists.',
          'Lambda expressions create anonymous delegates or expression trees based on target type inference.',
          'LINQ provides declarative, composable query syntax over collections (IEnumerable) and databases (IQueryable).',
        ],
      },
      {
        title: 'Nullable Reference Types and Pattern Matching',
        description: 'Static null analysis, switch expressions, and pattern matching syntax.',
        points: [
          'Nullable Reference Types (#nullable enable) turn reference types non-nullable by default at compile time.',
          'Compiler issues warnings when assigning null or dereferencing potentially null variables without checks.',
          'Pattern matching (is, switch expressions) inspects object types, properties, and positional values declaratively.',
          'List patterns and relational patterns allow complex structural validation in concise, readable code.',
        ],
      },
      {
        title: 'Async/Await and Task Asynchronous Programming',
        description: 'Compiler-generated state machines, non-blocking I/O, and ThreadPool concurrency.',
        points: [
          'async/await transforms asynchronous methods into compiler-generated state machines over Task / ValueTask.',
          'Awaited methods release their executing thread back to the ThreadPool during I/O waits, maximizing server throughput.',
          'Sync-over-async (.Result or .Wait()) blocks ThreadPool threads and is the primary cause of thread pool starvation.',
          'ValueTask<T> avoids memory allocation when asynchronous operations complete synchronously.',
        ],
      },
    ],
  },
  {
    num: '09',
    title: '09. ASP.NET Core API Development',
    description: 'Building production RESTful HTTP APIs with Controllers and Minimal APIs.',
    topics: [
      {
        title: 'Controllers vs Minimal APIs',
        description: 'Convention-based MVC architecture vs lightweight route-to-lambda functional endpoints.',
        points: [
          'Controllers use class-based inheritance (ControllerBase) with rich action filters and routing conventions.',
          'Minimal APIs map routes directly to lambdas (app.MapGet) with minimal memory overhead and zero reflection.',
          'Minimal APIs are optimized for Native AOT compilation, microservices, and high-throughput serverless endpoints.',
          'Both models share the same underlying model binding, dependency injection, and authorization mechanisms.',
        ],
      },
      {
        title: 'REST Principles, HTTP Methods, and DTOs',
        description: 'Resource-oriented architectural design, idempotency, and contract modeling.',
        points: [
          'HTTP methods declare intent: GET (safe/idempotent), POST (create), PUT (replace), PATCH (modify), DELETE (remove).',
          'Data Transfer Objects (DTOs) decouple internal database entities from external client API contracts.',
          'Idempotent operations yield the identical server resource state regardless of how many times they are called.',
          'TypedResults in modern .NET provides compile-time type-checked response models without untyped IActionResult.',
        ],
      },
      {
        title: 'OpenAPI, Swagger, and API Documentation',
        description: 'Generating OpenAPI specifications, Swagger UI, and modern Microsoft.AspNetCore.OpenApi.',
        points: [
          'OpenAPI provides a standardized JSON/YAML contract describing endpoints, parameters, and response schemas.',
          'Modern .NET 9+ provides built-in first-party document generation via Microsoft.AspNetCore.OpenApi.',
          'Scalar and Swagger UI render interactive documentation allowing developers to test API endpoints in the browser.',
          'Endpoint metadata attributes (.WithName, .WithSummary, .Produces) enrich generated OpenAPI specifications.',
        ],
      },
      {
        title: 'Pagination, Filtering, Sorting, and Versioning',
        description: 'Handling large data sets efficiently and managing evolving API contracts.',
        points: [
          'Offset pagination (Skip/Take) is simple; keyset (cursor-based) pagination delivers O(1) index-backed performance.',
          'API versioning (Asp.Versioning.Http) manages breaking changes via URL paths (/v1/), query strings, or headers.',
          'IQueryable dynamic sorting and filtering should validate allowed column names to prevent SQL injection.',
          'Standardized metadata envelopes return page index, page size, total record counts, and navigation links.',
        ],
      },
    ],
  },
  {
    num: '10',
    title: '10. Data Access and ORMs',
    description: 'Relational data persistence, Entity Framework Core, Dapper micro-ORM, and query optimization.',
    topics: [
      {
        title: 'ADO.NET Fundamentals and Connection Pooling',
        description: 'Physical connection management, connection string pooling, and raw ADO.NET execution.',
        points: [
          'ADO.NET provides low-level imperative data access using DbConnection, DbCommand, and DbDataReader.',
          'Connection pooling reuses physical database connections to eliminate expensive TCP/TLS handshake overhead.',
          'Connections are pooled per unique connection string; always open connections late and dispose them early.',
          'Connection pool exhaustion occurs when code leaks unclosed connections or runs long-blocking queries.',
        ],
      },
      {
        title: 'DbContext, Change Tracking, and Lifecycles',
        description: 'Unit of Work, Identity Map, snapshot comparison, and AsNoTracking performance.',
        points: [
          'DbContext implements the Unit of Work and Identity Map patterns for a single unit of database work.',
          'Change tracker snapshots entity states and automatically calculates UPDATE/INSERT diffs during SaveChangesAsync().',
          'AsNoTracking() disables snapshot tracking for read-only queries, reducing memory usage and CPU cycles.',
          'DbContext is registered as Scoped because it is not thread-safe and represents a single request transaction.',
        ],
      },
      {
        title: 'Eager, Lazy, and Explicit Loading (N+1 Problem)',
        description: 'Navigation property loading strategies and avoiding catastrophic relational query amplification.',
        points: [
          'Eager loading (.Include) retrieves related entities in the initial SQL JOIN query.',
          'Lazy loading loads related entities on demand when navigation properties are accessed, causing N+1 query loops.',
          'Explicit loading (.Entry(order).Collection(...).LoadAsync()) imperatively queries related records when needed.',
          'AsSplitQuery() splits large multi-collection queries into separate SQL SELECTs to prevent Cartesian explosion.',
        ],
      },
      {
        title: 'LINQ, IQueryable vs IEnumerable, and Expression Trees',
        description: 'Compile-time query translation to SQL vs in-memory sequence iteration.',
        points: [
          'IQueryable holds an Expression Tree translated by database providers into optimized SQL dialect queries.',
          'IEnumerable operates on in-memory sequences; calling .ToList() executes queries and streams results into RAM.',
          'Invoking IEnumerable methods too early forces the database to stream entire tables across the network.',
          'Always apply Where, Select, OrderBy, and Take filters before calling ToListAsync() or FirstOrDefaultAsync().',
        ],
      },
      {
        title: 'Dapper and Query Optimization',
        description: 'High-performance micro-ORM for raw SQL execution and complex reporting workloads.',
        points: [
          'Dapper is a high-speed micro-ORM that extends IDbConnection with parameterized raw SQL execution.',
          'Bypasses change tracking and LINQ translation overhead to achieve near raw ADO.NET performance.',
          'Commonly used alongside EF Core: EF Core manages complex domain writes; Dapper powers hot read queries.',
          'Always use parameterized queries (new { CustomerId = id }) to prevent SQL injection vulnerabilities.',
        ],
      },
    ],
  },
  {
    num: '11',
    title: '11. Authentication and Security',
    description: 'Identity management, cryptographic tokens, authorization policies, and application defense.',
    topics: [
      {
        title: 'Authentication vs Authorization and ClaimsPrincipal',
        description: 'Proving identity vs evaluating permissions using claims, roles, and policies.',
        points: [
          'Authentication answers "Who are you?"; Authorization answers "What are you allowed to do?".',
          'ClaimsPrincipal represents the authenticated identity containing a collection of cryptographic Claims.',
          'Policy-based authorization evaluates custom requirements and handlers against user claims and resources.',
          'Resource-based authorization allows checking ownership before editing specific database records.',
        ],
      },
      {
        title: 'JWT, OAuth 2.0, and OpenID Connect (OIDC)',
        description: 'Token-based authorization, identity verification flows, and asymmetric signing keys.',
        points: [
          'OAuth 2.0 is an authorization framework for delegated access; OpenID Connect (OIDC) adds identity verification.',
          'JSON Web Tokens (JWT) encapsulate header, payload (claims), and digital signature in a compact base64 string.',
          'APIs validate JWT signatures using asymmetric public keys issued by identity providers (Entra ID, Auth0).',
          'Short-lived access tokens combined with secure refresh tokens mitigate the risk of token theft.',
        ],
      },
      {
        title: 'Data Protection API, HTTPS, and Security Headers',
        description: 'Cryptographic key rings, cookie encryption, HSTS, and transport security.',
        points: [
          'ASP.NET Core Data Protection API encrypts cookies, antiforgery tokens, and sensitive query strings.',
          'In multi-instance cloud deployments, Data Protection keys must be shared via Redis or Azure Key Vault.',
          'HTTP Strict Transport Security (HSTS) instructs browsers to only connect over encrypted HTTPS channels.',
          'Security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) mitigate browser exploits.',
        ],
      },
      {
        title: 'CORS, CSRF, and SQL Injection Defenses',
        description: 'Browser same-origin policies, cross-site request forgery tokens, and parameterized queries.',
        points: [
          'Cross-Origin Resource Sharing (CORS) is a browser security mechanism; not an API security perimeter.',
          'Cross-Site Request Forgery (CSRF) defenses use cryptographic Antiforgery tokens for cookie-authenticated forms.',
          'SQL injection is prevented by using parameterized queries and ORMs (EF Core, Dapper) instead of string concatenation.',
          'Rate limiting middleware in modern .NET protects public APIs against brute-force and denial-of-service attacks.',
        ],
      },
    ],
  },
  {
    num: '12',
    title: '12. Background and Distributed Processing',
    description: 'Asynchronous workers, message brokers, resilient consumer loops, and eventual consistency.',
    topics: [
      {
        title: 'IHostedService and BackgroundService',
        description: 'Building long-running worker services, background processors, and hosted loops.',
        points: [
          'IHostedService defines StartAsync() and StopAsync() lifecycle methods managed by the generic host.',
          'BackgroundService is an abstract base class providing an ExecuteAsync(CancellationToken) background execution loop.',
          'Background services run as singletons; to access scoped services (DbContext), inject IServiceScopeFactory.',
          'Unhandled exceptions in background services crash the entire application host unless configured otherwise.',
        ],
      },
      {
        title: 'Message Queues and RabbitMQ Integration',
        description: 'Point-to-point queues, pub/sub topics, consumer prefetch, and acknowledgements.',
        points: [
          'Message queues decouple distributed services and buffer asynchronous workloads during traffic spikes.',
          'RabbitMQ routes messages through exchanges (direct, topic, fanout) into durable, persistent queues.',
          'Explicit message acknowledgements (Ack/Nack) guarantee at-least-once message delivery semantics.',
          'Prefetch count limits the number of unacknowledged messages delivered to a single worker concurrently.',
        ],
      },
      {
        title: 'Retries, Dead-Letter Queues, and Idempotency',
        description: 'Handling transient failures, isolating poison messages, and preventing duplicate processing.',
        points: [
          'Retries with exponential backoff and jitter handle temporary network and database connection glitches.',
          'Dead-Letter Queues (DLQ) isolate poison messages that fail repeatedly, preventing queue blocking.',
          'Idempotent consumers guarantee that processing the same message multiple times produces the identical outcome.',
          'Idempotency keys and database unique constraints prevent duplicate payment and order processing.',
        ],
      },
      {
        title: 'Outbox Pattern and Eventual Consistency',
        description: 'Guaranteeing atomic database writes and message publishing without distributed transactions.',
        points: [
          'Dual-write problem: writing to a database and publishing to a message queue can fail halfway, causing inconsistency.',
          'Transactional Outbox pattern saves business entities and domain events in the same database transaction.',
          'A separate background worker polls the outbox table and publishes events to the message broker reliably.',
          'Ensures at-least-once publishing without requiring fragile distributed transactions (Two-Phase Commit).',
        ],
      },
    ],
  },
  {
    num: '13',
    title: '13. Logging, Monitoring and Diagnostics',
    description: 'Structured logging, OpenTelemetry distributed tracing, metrics, and production troubleshooting.',
    topics: [
      {
        title: 'ILogger, Log Levels, and Structured Logging',
        description: 'Semantic logging with message templates and structured parameters vs string interpolation.',
        points: [
          'Structured logging preserves data fields as queryable key-value properties rather than flat text strings.',
          'Never use string interpolation in logging ($"User {id}"); use message templates ("User {UserId}", id) for indexing.',
          'Log levels (Trace, Debug, Information, Warning, Error, Critical) control production telemetry verbosity.',
          'Serilog and OpenTelemetry export structured logs to centralized log systems (Seq, Elasticsearch, Datadog).',
        ],
      },
      {
        title: 'Metrics, Tracing, and OpenTelemetry (OTel)',
        description: 'Vendor-neutral observability standard for distributed traces, metrics, and spans.',
        points: [
          'OpenTelemetry provides vendor-neutral APIs and SDKs for collecting distributed traces, metrics, and logs.',
          'System.Diagnostics.Activity creates spans that track the timing and execution flow across microservices.',
          'W3C Trace Context headers (traceparent) propagate correlation IDs across HTTP and message broker boundaries.',
          'System.Diagnostics.Metrics measures real-time performance counters (request durations, active connections).',
        ],
      },
      {
        title: 'Health Checks and Readiness/Liveness Probes',
        description: 'Kubernetes orchestration health monitoring for container lifecycle management.',
        points: [
          'Liveness probes (/health/live) indicate whether the application process is running and responsive.',
          'Readiness probes (/health/ready) verify whether dependencies (database, Redis, queues) are available to accept traffic.',
          'Kubernetes restarts containers failing liveness probes and routes traffic away from containers failing readiness probes.',
          'AspNetCore.Diagnostics.HealthChecks provides turnkey integration for database, cache, and disk checks.',
        ],
      },
      {
        title: 'Production Troubleshooting and Memory Dumps',
        description: 'Diagnostic tools (dotnet-dump, dotnet-trace, dotnet-counters) and post-mortem analysis.',
        points: [
          'dotnet-counters monitors live CPU, memory allocations, thread pool queue lengths, and GC pauses in real time.',
          'dotnet-trace collects CPU performance profiles without attaching heavy debuggers in production.',
          'dotnet-dump captures memory crash dumps and analyzes object retention paths and deadlocks via SOS commands.',
          'Essential for diagnosing memory leaks, high CPU spikes, and thread starvation on headless Linux servers.',
        ],
      },
    ],
  },
  {
    num: '14',
    title: '14. Performance and Memory',
    description: 'High-throughput runtime engineering, memory optimization, caching, and benchmarking.',
    topics: [
      {
        title: 'CPU-Bound vs I/O-Bound Work & ThreadPool',
        description: 'Async non-blocking I/O vs Task.Run background CPU processing and starvation mechanics.',
        points: [
          'I/O-bound operations (database, HTTP, disk) should use async/await without blocking threads.',
          'CPU-bound operations (image processing, encryption, hashing) should offload to Task.Run() when on the UI thread.',
          'ThreadPool uses a hill-climbing algorithm to inject new threads slowly when existing threads are blocked.',
          'Blocking ThreadPool threads with .Result or .Wait() causes thread pool starvation and massive latency spikes.',
        ],
      },
      {
        title: 'Allocation, Span<T>, Memory<T>, and ArrayPool',
        description: 'Zero-allocation memory slicing, buffer pooling, and reducing garbage collection pressure.',
        points: [
          'Span<T> is a stack-only ref struct representing a contiguous region of arbitrary memory without allocations.',
          'Memory<T> is a heap-allocatable memory slice that can be stored in class fields and passed across async boundaries.',
          'ArrayPool<T>.Shared rents reusable arrays to eliminate Gen 0 garbage collection churn in hot paths.',
          'Always return rented arrays to ArrayPool inside a finally block to prevent memory buffer leaks.',
        ],
      },
      {
        title: 'Caching Strategies and HybridCache',
        description: 'In-memory caching, distributed caching (Redis), and modern .NET 9 HybridCache.',
        points: [
          'Cache-Aside pattern checks the cache first, loads from the database on cache miss, and writes back to cache.',
          'Distributed caching (IDistributedCache) stores shared cache keys in an external cluster (Redis).',
          'Modern .NET 9+ HybridCache combines fast in-process L1 cache with distributed L2 cache and stampede protection.',
          'Cache stampede protection ensures only a single database query executes when a hot cache key expires.',
        ],
      },
      {
        title: 'Benchmarking and Profiling with BenchmarkDotNet',
        description: 'Accurate microbenchmarking, measuring allocations, and avoiding JIT compiler traps.',
        points: [
          'BenchmarkDotNet is the standard library for benchmarking .NET code with statistical rigor.',
          'Handles JIT warm-up iterations, Dynamic PGO tiering, and OS scheduling noise automatically.',
          'MemoryDiagnoser attribute measures exact byte allocations and GC collection frequencies per iteration.',
          'Never use simple Stopwatch loops: JIT dead-code elimination and warm-up effects invalidate manual measurements.',
        ],
      },
    ],
  },
  {
    num: '15',
    title: '15. Testing and Code Quality',
    description: 'Unit testing, integration testing with WebApplicationFactory, test doubles, and clean architecture.',
    topics: [
      {
        title: 'Unit, Integration, and End-to-End Testing',
        description: 'The testing pyramid, xUnit fundamentals, and test scope boundaries.',
        points: [
          'Unit tests verify individual methods and business logic in isolation using test doubles (mocks/stubs).',
          'Integration tests verify interactions between application components, databases, and network dependencies.',
          'End-to-End (E2E) tests validate user workflows through external interfaces against complete environments.',
          'xUnit uses constructor setup, IAsyncLifetime, and [Theory] parameterized tests for reliable test execution.',
        ],
      },
      {
        title: 'WebApplicationFactory and Testcontainers',
        description: 'In-memory integration testing of ASP.NET Core pipelines with real Dockerized databases.',
        points: [
          'WebApplicationFactory bootstraps the full ASP.NET Core hosting pipeline in-memory for testing.',
          'Allows testing middleware, routing, model binding, and authorization policies without opening external TCP ports.',
          'Testcontainers spins up real, ephemeral Docker containers (PostgreSQL, SQL Server, Redis) during test runs.',
          'Replaces unreliable in-memory database mocks with 100% production-parity database testing.',
        ],
      },
      {
        title: 'Mocking and Test Doubles (NSubstitute, Moq)',
        description: 'Isolating dependencies, asserting calls, and avoiding brittle over-mocking.',
        points: [
          'Mocks and stubs simulate interface dependencies to isolate the system under test (SUT).',
          'NSubstitute and Moq configure return values and verify that expected methods were called.',
          'Avoid over-mocking internal implementation details; focus on asserting observable behaviors and outputs.',
          'Do not mock DbContext: test data access layers using real database containers via Testcontainers.',
        ],
      },
      {
        title: 'SOLID Principles, Clean Architecture, and CQRS',
        description: 'Architectural separation of concerns, dependency inversion, and command-query segregation.',
        points: [
          'SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
          'Clean Architecture enforces dependency rules pointing inward toward the pure domain model.',
          'Command Query Responsibility Segregation (CQRS) separates read models (queries) from write models (commands).',
          'Vertical slice architecture organizes code around cohesive business features rather than horizontal technical layers.',
        ],
      },
    ],
  },
  {
    num: '16',
    title: '16. Deployment and DevOps',
    description: 'Application publishing, containerization, Native AOT, and CI/CD automation.',
    topics: [
      {
        title: 'Publish Modes: Framework-Dependent vs Self-Contained',
        description: 'Targeting installed shared runtimes vs bundling runtime binaries with the app.',
        points: [
          'Framework-Dependent Deployment (FDD) relies on a pre-installed .NET runtime on the host machine.',
          'Self-Contained Deployment (SCD) packages the entire .NET runtime and libraries inside the app directory.',
          'SCD guarantees consistent execution regardless of host server configuration at the cost of larger artifact sizes.',
          'Runtime Identifiers (RID: win-x64, linux-x64, linux-arm64, osx-arm64) target specific OS and CPU combinations.',
        ],
      },
      {
        title: 'Native AOT Compilation and Trimming',
        description: 'Compiling directly to native machine code with zero JIT overhead for cloud microservices.',
        points: [
          'Native AOT compiles C# directly into native machine code (ELF/PE) without intermediate IL bytecode or JIT.',
          'Delivers sub-10 millisecond startup times and tiny memory footprints ideal for serverless and containers.',
          'Trimming strips unused BCL types and methods to minimize binary size.',
          'Requires AOT-compatible libraries that avoid dynamic reflection emit and runtime code generation.',
        ],
      },
      {
        title: 'Docker, Chiselled Containers, and Port 8080',
        description: 'Building hardened, non-root, ultra-small container images for Kubernetes.',
        points: [
          'Multi-stage Docker builds separate SDK build environments from minimal, secure runtime production images.',
          'Modern .NET container images run as a non-root user (app) by default for hardened security posture.',
          'Default HTTP port was changed from privileged port 80 to non-privileged port 8080 in .NET 8+.',
          'Ubuntu Chiselled images strip package managers and shells, eliminating container vulnerabilities.',
        ],
      },
      {
        title: 'CI/CD Pipelines and Release Strategies',
        description: 'GitHub Actions, Azure DevOps, Blue-Green deployments, and feature flags.',
        points: [
          'Automated CI pipelines run dotnet restore, dotnet build, dotnet test, and security vulnerability scans.',
          'Blue-Green deployments maintain two identical environments, switching routing traffic instantly for zero-downtime.',
          'Canary releases shift traffic incrementally to test new versions on a small subset of production users.',
          'Microsoft.FeatureManagement enables feature flags to decouple code deployments from feature releases.',
        ],
      },
    ],
  },
  {
    num: '17',
    title: '17. Desktop and Other Application Types',
    description: 'Desktop frameworks, real-time messaging, gRPC contracts, and full-stack Blazor.',
    topics: [
      {
        title: 'WinForms, WPF, and .NET MAUI',
        description: 'Enterprise Windows UI development and cross-platform native mobile and desktop with MAUI.',
        points: [
          'WinForms and WPF are supported on modern .NET for mission-critical enterprise Windows applications.',
          '.NET MAUI (Multi-platform App UI) targets Android, iOS, macOS (Mac Catalyst), and Windows (WinUI 3).',
          'MAUI uses a single project structure with platform-native controls, preserving device look-and-feel.',
          'Ideal for cross-platform mobile and desktop suites sharing C# models and services with backends.',
        ],
      },
      {
        title: 'gRPC and Protocol Buffers',
        description: 'Contract-first high-performance remote procedure calls over HTTP/2.',
        points: [
          'gRPC uses binary Protocol Buffers (protobuf) for compact, strongly typed cross-language contracts.',
          'Runs on HTTP/2, supporting bidirectional streaming, multiplexing, and header compression.',
          'Delivers 5x to 10x higher throughput and significantly lower bandwidth consumption than JSON REST APIs.',
          'Ideal for internal microservice-to-microservice communication where browser support is not required.',
        ],
      },
      {
        title: 'SignalR and Real-Time Communication',
        description: 'Bi-directional real-time push communication over WebSockets with automatic fallbacks.',
        points: [
          'SignalR enables server code to push real-time content instantly to connected web and mobile clients.',
          'Automatically chooses the best transport: WebSockets → Server-Sent Events → Long Polling.',
          'Hubs provide a high-level RPC abstraction for calling client-side JavaScript from server-side C#.',
          'Scale-out across multi-server farms requires a backplane (Redis or Azure SignalR Service).',
        ],
      },
      {
        title: 'Blazor: Server, WebAssembly, and Hybrid',
        description: 'Building interactive web user interfaces using C# instead of JavaScript.',
        points: [
          'Blazor allows writing interactive web UIs in C# using component-based Razor syntax.',
          'Blazor Server executes UI logic on the server and pushes DOM diffs to the browser over SignalR.',
          'Blazor WebAssembly downloads a trimmed .NET runtime and executes C# directly in the browser sandbox.',
          'Modern .NET 8+ Blazor Web App unifies both with per-component render modes (InteractiveServer, InteractiveWebAssembly, InteractiveAuto).',
        ],
      },
    ],
  },
  {
    num: '18',
    title: '18. Advanced Architecture and Interview Scenarios',
    description: 'System design trade-offs, distributed consensus, production post-mortems, and senior scenarios.',
    topics: [
      {
        title: 'Monoliths vs Modular Monoliths vs Microservices',
        description: 'Architectural boundaries, team topologies, operational costs, and decomposition criteria.',
        points: [
          'Monoliths deploy as a single unit with simple operations but risk coupling without strict module boundaries.',
          'Modular Monoliths enforce domain boundaries and separate database schemas while running in a single process.',
          'Microservices split domains into independently deployable services; justifies the distributed systems tax at scale.',
          'Decompose by Domain-Driven Design (DDD) Bounded Contexts rather than technical layers.',
        ],
      },
      {
        title: 'Distributed Transactions, Sagas, and Eventual Consistency',
        description: 'Avoiding Two-Phase Commit and orchestrating compensating actions across distributed boundaries.',
        points: [
          'Two-Phase Commit (2PC) does not scale in cloud architectures and creates dangerous availability bottlenecks.',
          'Saga pattern coordinates distributed transactions across microservices through a sequence of local transactions.',
          'Choreographed sagas publish domain events; Orchestrated sagas use a central state machine to trigger steps.',
          'Compensating transactions execute semantic undo operations if an intermediate step fails.',
        ],
      },
      {
        title: 'Resilience Patterns: Retries, Circuit Breaker, and Hedging',
        description: 'Building fault-tolerant systems with Microsoft.Extensions.Resilience and Polly v8.',
        points: [
          'Timeouts prevent slow external downstream dependencies from exhausting application thread pools.',
          'Retries with exponential backoff and jitter mitigate transient network drops without thundering herds.',
          'Circuit Breakers stop calling failing services temporarily, allowing downstream systems to recover.',
          'Hedging issues duplicate parallel requests to reduce p99 tail latency for latency-sensitive read queries.',
        ],
      },
      {
        title: 'Senior Scenario: Diagnosing Production Outages and Latency Spikes',
        description: 'Structured methodologies for analyzing memory leaks, deadlocks, and thread starvation.',
        points: [
          'Thread pool starvation: sudden spike in latency under load caused by sync-over-async blocking threads.',
          'High CPU spikes: identify hot loops or excessive GC collections using dotnet-trace and dotnet-counters.',
          'Memory leaks: capture dotnet-dump and identify growing object roots in SOS debugger.',
          'Database bottlenecks: review execution plans, missing indexes, and un-indexed N+1 queries.',
        ],
      },
    ],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const curriculumSections: Section[] = [];
export const curriculumTopics: Topic[] = [];

curriculumDefinitions.forEach((def, sIdx) => {
  const sectionId = `sec-dotnet-${def.num}-${slugify(def.title.replace(/^\d+\.\s*/, ''))}`;
  const sectionSlug = slugify(def.title);
  const topicIds: string[] = [];

  def.topics.forEach((top, tIdx) => {
    const topicId = `topic-dotnet-${def.num}-${tIdx + 1}-${slugify(top.title)}`;
    const topicSlug = slugify(top.title);
    topicIds.push(topicId);

    const fullMarkdown = `### 1. Definition
**${top.title}** is a core component of modern .NET engineering within **${def.title}**.

${top.description}

---

### 2. Why It Exists / Problem It Solves
- Solves key architectural and operational challenges in enterprise systems.
- Ensures robust type safety, performance, and predictable execution.
- Prevents common pitfalls like memory leaks, concurrency locks, and maintenance friction.

---

### 3. How It Works & Architecture Flow
\`\`\`
[ Configuration / Input ] ──► [ Execution Engine / Pipeline ] ──► [ Optimized Output / Response ]
\`\`\`

Key architectural principles:
${top.points.map((p) => `- ${p}`).join('\n')}

---

### 4. Key Takeaways & Best Practices
- Master the underlying mechanisms rather than treating .NET as a black box.
- Measure performance with BenchmarkDotNet and runtime telemetry before optimizing.
- Follow modern idioms (clean dependency injection, async all the way, cancellation tokens).

---

### 5. Interview Questions & Rapid Answers
- **What is the primary role of this concept?**
  ${top.description}
- **What are the common mistakes associated with it?**
  Misunderstanding object lifecycles, blocking on asynchronous operations, and neglecting production resource limits.`;

    const topicItem: Topic = {
      id: topicId,
      slug: topicSlug,
      subjectId: 'subj-dotnet',
      sectionId: sectionId,
      title: top.title,
      tags: ['.NET', def.title.replace(/^\d+\.\s*/, ''), top.title],
      quickDefinition: top.description,
      quickRevisionBulletPoints: top.points,
      coreConceptMarkdown: fullMarkdown,
      interviewQuestions: [
        {
          id: `q-${topicId}-1`,
          question: `Explain the architectural importance of ${top.title}.`,
          shortAnswer: top.description,
          detailedAnswer: `${top.description}\n\nCore mechanics:\n${top.points.map((p) => `• ${p}`).join('\n')}`,
          keyTakeaways: top.points.slice(0, 3),
        },
      ],
      checklist: top.points.map((pt, pIdx) => ({
        id: `cl-${topicId}-${pIdx}`,
        text: pt,
      })),
      references: [
        {
          id: `ref-${topicId}-1`,
          title: '.NET Documentation',
          url: 'https://learn.microsoft.com/en-us/dotnet/',
          source: 'Microsoft Learn',
          type: 'Official Documentation',
        },
      ],
      relatedTopicIds: [],
      lastUpdated: '2026-10-01',
      isPublished: true,
    };

    curriculumTopics.push(topicItem);
  });

  const sectionItem: Section = {
    id: sectionId,
    slug: sectionSlug,
    subjectId: 'subj-dotnet',
    title: def.title,
    order: sIdx + 2,
    description: def.description,
    topicIds: topicIds,
  };

  curriculumSections.push(sectionItem);
});
