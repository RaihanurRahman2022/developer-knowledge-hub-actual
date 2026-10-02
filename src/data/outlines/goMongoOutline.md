<!--
  Go & MongoDB curriculum outline, parsed by src/data/outlineCurriculum.ts.
  Format:
    # <subject id>        subject the following sections belong to
    ## Section title
    ### Topic title
    - point / 1. point    topic coverage points
    other text            topic notes ("→ x" lines continue the previous note)
  Ids are derived from subject + position + title, so append new sections/topics
  at the end of a subject to keep existing ids (and user progress) stable.
-->

# subj-go

## Go History & Evolution

### Why Go Was Created
- Problems Go aimed to solve
- Simplicity and readability
- Fast compilation
- Concurrency
- Static typing
- Systems and backend development

### Go Release Evolution
- Go 1.0
- Major language and runtime milestones
- Modules
- Generics
- Improved tooling
- Recent Go releases

### Go Philosophy
- Simplicity
- Composition over inheritance
- Explicit error handling
- Small interfaces
- Convention over configuration

## Go Installation, Toolchain & Project Structure

### Go Toolchain
- `go`
- `gofmt`
- `go vet`
- `go test`
- `go build`
- `go run`
- `go mod`
- `go generate`

### Project Structure
- `go.mod`
- `go.sum`
- `main.go`
- `internal/`
- `cmd/`
- `pkg/`
- `api/`
- `configs/`
- `migrations/`
- `testdata/`

### Go Modules
- Module path
- Dependencies
- Versioning
- `go get`
- `go mod tidy`
- `go mod download`
- `go mod vendor`

### Build & Run
- `go run`
- `go build`
- Executables
- Cross compilation
- Build flags
- Environment-specific configuration

## Go Language Fundamentals

### Variables & Constants
- `var`
- `:=`
- `const`
- Zero values
- Scope

### Basic Types
- Integers
- Floating point
- Boolean
- String
- Rune
- Byte
- Type aliases
- Custom types

### Control Flow
- `if`
- `for`
- `switch`
- `defer`
- `break`
- `continue`

### Functions
- Parameters
- Return values
- Multiple return values
- Named returns
- Variadic functions
- Function values
- Closures

## Go Data Structures

### Arrays
- Fixed size
- Value semantics

### Slices
- Length
- Capacity
- `append`
- `copy`
- Slicing
- Backing arrays
- Common pitfalls

### Maps
- Creation
- Lookup
- Delete
- Zero values
- Concurrency considerations

### Structs
- Fields
- Embedded structs
- Struct tags
- Composition

### Pointers
- Address and dereference
- Pointer receivers
- Nil pointers
- Value vs pointer semantics

## Methods, Interfaces & Composition

### Methods
- Value receivers
- Pointer receivers
- Method sets

### Interfaces
- Implicit implementation
- Small interfaces
- Interface composition
- Empty interface / `any`
- Type assertions
- Type switches

### Composition
- Struct embedding
- Dependency composition
- Composition over inheritance

### Common Interview Topics
- Interface vs concrete type
- Pointer receiver vs value receiver
- Nil interface vs typed nil
- When to use an interface

## Generics

### Generic Functions
- Type parameters
- Constraints
- Type inference

### Generic Types
- Generic structs
- Generic data structures

### Constraints
- `any`
- `comparable`
- Union constraints
- Approximation with `~`

### When to Use Generics
- Reusable algorithms
- Collections
- Avoiding unnecessary duplication
- When interfaces are more appropriate

## Error Handling

### Go Error Model
- `error` interface
- Returning errors
- Multiple return values

### Error Wrapping
- `fmt.Errorf`
- `%w`
- `errors.Is`
- `errors.As`

### Custom Errors
- Sentinel errors
- Typed errors
- Domain errors

### Panic & Recover
- `panic`
- `recover`
- When panic is appropriate
- Why normal errors should not use panic

## Packages & Dependency Management

### Packages
- Package declaration
- Imports
- Exported vs unexported identifiers

### Package Design
- Cohesion
- Dependency direction
- Avoiding circular dependencies

### Dependency Injection
- Constructor injection
- Interface-based dependencies
- Manual dependency injection
- DI frameworks and when they are unnecessary

### Standard Library
Important packages:
- `fmt`
- `strings`
- `strconv`
- `time`
- `os`
- `io`
- `context`
- `sync`
- `net/http`
- `encoding/json`
- `log/slog`

## Concurrency Fundamentals

### Goroutines
- What a goroutine is
- Starting goroutines
- Goroutine lifecycle
- Goroutine leaks

### Channels
- Unbuffered channels
- Buffered channels
- Send / receive
- Closing channels
- Range over channels

### Select
- Multiple channel operations
- Timeouts
- Cancellation

### Synchronization
- `sync.Mutex`
- `sync.RWMutex`
- `sync.WaitGroup`
- `sync.Once`
- `sync.Cond`
- Atomic operations

## Context & Cancellation

### context.Context
- Request-scoped context
- Deadlines
- Timeouts
- Cancellation

### Context Propagation
- HTTP handlers
- Database operations
- External API calls
- Goroutines

### Common Context Mistakes
- Storing context in structs
- Using context for optional parameters
- Forgetting cancellation
- Ignoring `ctx.Done()`

## Go Memory Model & Runtime

### Stack & Heap
- Stack allocation
- Heap allocation
- Escape analysis

### Garbage Collection
- Go GC
- Marking and sweeping concepts
- GC pauses
- Allocation pressure

### Escape Analysis
- `-gcflags`
- Heap escape
- Allocation optimization

### Runtime Scheduler
- G
- M
- P
- Goroutine scheduling
- Work stealing

## HTTP & Web Development

### net/http
- Server
- Client
- Handler
- HandlerFunc
- ServeMux

### HTTP Lifecycle
- Request
- Middleware
- Handler
- Service
- Repository
- Response

### REST APIs
- Routing
- HTTP methods
- Status codes
- Request validation
- Response models
- Error responses

### Middleware
- Logging
- Authentication
- Authorization
- Recovery
- CORS
- Rate limiting
- Request IDs

## JSON, Serialization & Validation

### JSON
- `encoding/json`
- Marshal
- Unmarshal
- Struct tags
- `omitempty`

### Request/Response DTOs
- DTO vs domain model
- Validation
- Mapping

### Validation
- Required fields
- Type validation
- Business validation
- Error response design

## Backend Architecture

### Layered Architecture
- Handler
- Service
- Repository
- Infrastructure

### Clean Architecture
- Domain
- Application
- Infrastructure
- Presentation

### Hexagonal Architecture
- Ports
- Adapters
- Dependency direction

### Domain-Driven Design
- Entities
- Value objects
- Aggregates
- Domain services
- Repositories

### Architecture Project Structure
Example:
- `cmd/`
- `internal/`
- `domain/`
- `application/`
- `infrastructure/`
- `transport/`

## Database Access

### database/sql
- `DB`
- Connection pool
- Query
- Exec
- Scan
- Transactions

### SQL Drivers
- Driver abstraction
- PostgreSQL
- MySQL
- SQL Server

### ORM / Query Libraries
- GORM
- sqlx
- Query builders
- Raw SQL

### Connection Pooling
- Max open connections
- Max idle connections
- Connection lifetime
- Timeouts

## Testing

### Unit Testing
- `testing`
- Test functions
- Table-driven tests

### Test Organization
- Test files
- Subtests
- Test helpers

### Mocking
- Interfaces
- Hand-written mocks
- Mocking libraries

### Integration Testing
- Database
- HTTP
- External services

### Benchmarks
- `testing.B`
- Benchmark design
- Allocation measurements

### Race Detection
- `go test -race`

## Logging, Observability & Production Diagnostics

### Structured Logging
- `log/slog`
- Log levels
- Structured fields

### Observability
- Logs
- Metrics
- Traces

### Request Correlation
- Request ID
- Trace ID
- Context propagation

### Diagnostics
- `pprof`
- CPU profiling
- Memory profiling
- Goroutine profiling

## Performance & Optimization

### CPU Performance
- Benchmarking
- Profiling
- Algorithm complexity

### Memory Performance
- Allocations
- GC pressure
- Escape analysis

### Concurrency Performance
- Goroutine overhead
- Lock contention
- Channel overhead

### HTTP Performance
- Connection reuse
- Timeouts
- Keep-alive
- HTTP/2

### Database Performance
- Query optimization
- Pool configuration
- Batching
- Caching

## Security

### Authentication
- Sessions
- JWT
- OAuth2 / OIDC

### Authorization
- RBAC
- Permissions
- Middleware

### Web Security
- TLS
- CORS
- CSRF
- Input validation
- Injection attacks

### Secrets
- Environment variables
- Secret managers
- Credential rotation

## Messaging & Distributed Systems

### Message Brokers
- RabbitMQ
- Kafka
- NATS

### Producer / Consumer
- Delivery
- Acknowledgement
- Retry
- Dead-letter queues

### Distributed Systems
- Timeouts
- Retries
- Idempotency
- Circuit breakers
- Event-driven architecture

### gRPC
- Protocol Buffers
- Unary RPC
- Streaming
- Interceptors
- Deadlines
- Metadata

## Deployment & DevOps

### Docker
- Multi-stage builds
- Minimal images
- Environment configuration

### Kubernetes
- Pods
- Deployments
- Services
- ConfigMaps
- Secrets
- Probes

### CI/CD
- Build
- Test
- Scan
- Package
- Deploy

### Configuration
- Development
- Staging
- Production
- Environment variables

## Go Interview & Practical Problems

### Language Questions
- Slice vs array
- Map behavior
- Pointer vs value
- Interface behavior
- Defer
- Closure

### Concurrency Questions
- Goroutine
- Channel
- Mutex
- Race condition
- Deadlock
- Worker pool
- Fan-in / fan-out

### Backend Questions
- Middleware
- Context
- HTTP server
- Graceful shutdown
- Connection pooling

### Architecture Questions
- Dependency injection
- Clean architecture
- Repository pattern
- Event-driven architecture

### Practical Exercises
- Worker pool
- Rate limiter
- Concurrent URL checker
- File processor
- REST API
- gRPC service
- Background job processor

## Quick Revision

### Go Revision Order
Before an interview, revise these first.
1. Interfaces
2. Pointers
3. Slices
4. Maps
5. Error handling
6. Goroutines
7. Channels
8. Mutex
9. Context
10. HTTP
11. Middleware
12. Dependency injection
13. Project structure
14. Testing
15. Profiling
16. Graceful shutdown

# subj-nosql

## NoSQL & MongoDB History

### Relational vs NoSQL
- Tables vs documents
- Fixed schema vs flexible schema
- Joins vs embedding/references
- Transactions
- Scaling models

### NoSQL Categories
- Document
- Key-value
- Wide-column
- Graph

### MongoDB Evolution
- MongoDB origins
- Major architecture changes
- WiredTiger
- Transactions
- Aggregation improvements
- Modern MongoDB

## MongoDB Fundamentals

### Core Concepts
- Database
- Collection
- Document
- Field
- `_id`
- BSON

### BSON
- BSON vs JSON
- ObjectId
- Date
- Decimal128
- Binary data

### MongoDB Architecture
- Client
- Driver
- MongoDB server
- Database
- Collection

### MongoDB Shell & Tools
- `mongosh`
- Compass
- MongoDB drivers

## Document Modeling

### Embedding
- Embedded documents
- Embedded arrays
- One-to-one
- One-to-many

### Referencing
- References
- One-to-many
- Many-to-many

### Embedding vs Referencing
Consider:
- Access patterns
- Document size
- Update frequency
- Data duplication
- Atomicity
- Relationship complexity

### Schema Design Patterns
- Bucket pattern
- Attribute pattern
- Polymorphic pattern
- Computed pattern
- Extended reference
- Outlier pattern
- Subset pattern

## CRUD Operations

### Create
- `insertOne`
- `insertMany`

### Read
- `find`
- `findOne`
- Filters
- Projection
- Sorting
- Pagination

### Update
- `updateOne`
- `updateMany`
- `$set`
- `$unset`
- `$inc`
- `$push`
- `$pull`
- Upsert

### Delete
- `deleteOne`
- `deleteMany`

### Bulk Operations
- Bulk writes
- Ordered vs unordered operations

## Querying MongoDB

### Query Operators
- Comparison
- Logical
- Element
- Array
- Evaluation operators

### Arrays
- `$elemMatch`
- Array filtering
- Array updates

### Projection
- Include fields
- Exclude fields
- Computed fields

### Sorting & Pagination
- Skip/limit
- Range pagination
- Cursor-based pagination

## Indexing

### Why Indexes Matter
- Query performance
- Read/write trade-offs
- Memory considerations

### Index Types
- Single-field
- Compound
- Multikey
- Text
- Geospatial
- Hashed
- Wildcard

### Compound Indexes
- Prefix rule
- Field ordering
- Equality / sort / range considerations

### Special Indexes
- Unique
- Sparse
- Partial
- TTL

### Index Analysis
- `explain()`
- Query planner
- COLLSCAN
- IXSCAN
- Winning plan

## Aggregation Framework

### Aggregation Pipeline
- Pipeline stages
- Data transformation

### Important Stages
- `$match`
- `$project`
- `$group`
- `$sort`
- `$limit`
- `$skip`
- `$unwind`
- `$lookup`
- `$set`
- `$facet`

### Aggregation Optimization
- Filter early
- Use indexes
- Reduce document size
- Avoid unnecessary `$lookup`
- Understand memory limits

### $lookup
- MongoDB join-like operation
- Local/foreign fields
- Pipeline lookup
- When references are appropriate

## Transactions & Consistency

### Atomicity
- Single-document atomicity
- Multi-document operations

### Transactions
- Sessions
- Multi-document transactions
- Commit
- Abort

### Read Concern
- Local
- Majority
- Linearizable

### Write Concern
- Acknowledgement
- `w`
- Journaling
- Majority

### Read Preference
- Primary
- Secondary
- Secondary preferred

## Replication

### Replica Sets
- Primary
- Secondary
- Arbiter
- Election

### Failover
- Primary failure
- Election
- New primary

### Oplog
- Operation log
- Replication mechanism

### Read Scaling
- Reading from secondary
- Consistency implications

## Sharding & Horizontal Scaling

### Why Sharding?
- Dataset size
- Write throughput
- Horizontal scaling

### Sharded Cluster
- Shards
- Config servers
- `mongos`

### Shard Keys
- Cardinality
- Distribution
- Query isolation
- Hotspots

### Scaling Problems
- Poor shard key
- Uneven distribution
- Scatter-gather queries

## MongoDB Performance

### Query Optimization
- Index selection
- Projection
- Query shape
- `explain()`

### Schema Optimization
- Document size
- Embedding
- Duplication
- Read/write patterns

### Application Optimization
- Connection pooling
- Batch operations
- Pagination
- Caching

### Common Performance Problems
- Collection scans
- Too many indexes
- Large documents
- Unbounded arrays
- N+1 queries
- Excessive `$lookup`

## MongoDB with Go

### Official Go Driver
- Client
- Database
- Collection

### Connection Management
- `MongoClient`
- Connection pool
- Timeouts
- Context

### CRUD with Go
- Insert
- Find
- Update
- Delete

### BSON Mapping
- Struct tags
- `bson.M`
- `bson.D`
- Typed structs

### Repository Pattern
- Repository interfaces
- MongoDB implementation
- Error handling
- Context propagation

## MongoDB Security

### Authentication
- Username/password
- SCRAM
- X.509
- Authentication mechanisms

### Authorization
- Roles
- Privileges
- RBAC

### Network Security
- TLS
- IP access control
- Private networking

### Data Security
- Encryption
- Encryption at rest
- Encryption in transit
- Client-side field-level encryption

### Secrets
- Connection strings
- Secret managers
- Credential rotation

## MongoDB Backup & Operations

### Backup
- Logical backups
- `mongodump`
- `mongorestore`
- Cloud backups

### Monitoring
- CPU
- Memory
- Disk
- Connections
- Query latency
- Replication lag

### Production Diagnostics
- Slow queries
- Current operations
- Server metrics
- Replica status

### Disaster Recovery
- Backup strategy
- Restore testing
- Recovery Point Objective
- Recovery Time Objective

## MongoDB Interview Topics

### Fundamentals Questions
- MongoDB vs SQL
- Collection vs table
- Document vs row
- BSON vs JSON

### Data Modeling Questions
- Embedding vs referencing
- Denormalization
- Schema design

### Performance Questions
- Indexes
- Compound indexes
- `explain()`
- Query optimization

### Distributed Systems Questions
- Replica sets
- Elections
- Sharding
- Read/write concerns

### Transactions Questions
- Atomicity
- Sessions
- Multi-document transactions

### Practical Scenarios
- Design an employee document
- Design an order system
- Design a product catalog
- Design an audit log
- Optimize a slow query
- Choose an index
- Choose a shard key
- Handle high-volume writes

## Building a Production Go + MongoDB API

### Application Structure
- HTTP handler
- Service
- Repository
- MongoDB

### Request Flow
Client
→ HTTP server
→ Middleware
→ Handler
→ Service
→ Repository
→ MongoDB

### API Configuration
- Environment variables
- MongoDB URI
- Database name
- Connection options
- Timeouts

### API Error Handling
- Validation errors
- Not found
- Duplicate key
- Database errors
- Internal errors

### API Observability
- Structured logging
- Request ID
- Metrics
- Tracing

### Graceful Shutdown
- Stop accepting requests
- Finish active requests
- Close MongoDB client
- Close other resources

## Go + MongoDB Interview Scenarios

### Scenario 1 — Slow API
Investigate:
1. Go handler
2. Service logic
3. MongoDB query
4. Index
5. `explain()`
6. Network latency
7. Connection pool
8. Serialization cost

### Scenario 2 — High Concurrent Requests
Investigate:
1. Goroutines
2. Context cancellation
3. Connection pool
4. MongoDB capacity
5. Query latency
6. Lock/contention considerations
7. Backpressure

### Scenario 3 — Large Dataset
Consider:
1. Indexes
2. Pagination
3. Projection
4. Aggregation
5. Archiving
6. Sharding

### Scenario 4 — Duplicate Data
Determine whether duplication is intentional denormalization or an actual consistency problem.
Consider:
- Source of truth
- Update frequency
- Atomicity
- Event-driven synchronization

## Quick Revision

### MongoDB Revision Order
Before an interview, revise these first.
1. Document model
2. Embedding vs referencing
3. CRUD
4. Indexes
5. Compound indexes
6. `explain()`
7. Aggregation
8. `$lookup`
9. Transactions
10. Read/write concerns
11. Replica sets
12. Sharding
13. Connection pooling
14. MongoDB + Go driver
15. Performance optimization
